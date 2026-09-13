// ==========================================================
// Waitlist Controller
// Handles public operations: Join waitlist, check status, public stats
// ==========================================================

const db = require('../db');
const { generateReferralCode, getReferralUrl, getReferralPerks } = require('../services/referralService');
const { sendWelcomeEmail } = require('../services/emailService');

// Simple email regex validation
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * POST /api/waitlist/join
 * Registers a new user on the waitlist with referral tracking
 */
async function joinWaitlist(req, res, next) {
  try {
    const { name, email, ref } = req.body;

    // 1. Validation: Name
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid full name (minimum 2 characters).',
      });
    }

    // 2. Validation: Email
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    // 3. Check for existing signup
    const existingUser = await db.getUserByEmail(cleanEmail);
    if (existingUser) {
      const referralUrl = getReferralUrl(existingUser.referral_code);
      const perks = getReferralPerks(existingUser.referral_count);

      return res.status(200).json({
        success: true,
        alreadyJoined: true,
        message: 'Welcome back! You are already registered on our waitlist.',
        data: {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          referralCode: existingUser.referral_code,
          referralUrl,
          referralCount: existingUser.referral_count,
          rank: existingUser.rank,
          status: existingUser.status,
          createdAt: existingUser.created_at,
          perks,
        },
      });
    }

    // 4. Validate referral code (if provided by incoming invite link)
    let validReferrer = null;
    if (ref && typeof ref === 'string') {
      const cleanRef = ref.trim().toUpperCase();
      const referrerUser = await db.getUserByReferralCode(cleanRef);

      // Avoid self-referral or nonexistent referral codes
      if (referrerUser && referrerUser.email.toLowerCase() !== cleanEmail) {
        validReferrer = referrerUser;
      }
    }

    // 5. Generate unique referral code for the new user
    let referralCode = generateReferralCode(cleanName);
    // Ensure uniqueness
    let duplicateCheck = await db.getUserByReferralCode(referralCode);
    let attempts = 0;
    while (duplicateCheck && attempts < 5) {
      referralCode = generateReferralCode(cleanName);
      duplicateCheck = await db.getUserByReferralCode(referralCode);
      attempts++;
    }

    // 6. Create the user in database
    const newUser = await db.createUser({
      name: cleanName,
      email: cleanEmail,
      referralCode,
      referredBy: validReferrer ? validReferrer.referral_code : null,
    });

    // 7. If valid referral, credit the referrer
    if (validReferrer) {
      await db.incrementReferralCount(validReferrer.referral_code);
      await db.logReferral({
        referrerCode: validReferrer.referral_code,
        referredEmail: cleanEmail,
      });
      console.log(`[Referral] User ${cleanEmail} joined via invite code ${validReferrer.referral_code}! Referrer count incremented.`);
    }

    // 8. Re-fetch user to get their accurate computed rank
    const freshUser = await db.getUserById(newUser.id);
    const referralUrl = getReferralUrl(freshUser.referral_code);
    const perks = getReferralPerks(freshUser.referral_count);

    // 9. Dispatch welcome email (async, will not block response)
    sendWelcomeEmail(freshUser, referralUrl, freshUser.rank).catch((err) => {
      console.error('Welcome email dispatch error:', err.message);
    });

    // 10. Send successful response
    return res.status(201).json({
      success: true,
      alreadyJoined: false,
      message: 'Successfully joined the waitlist! Keep your referral link handy.',
      data: {
        id: freshUser.id,
        name: freshUser.name,
        email: freshUser.email,
        referralCode: freshUser.referral_code,
        referralUrl,
        referralCount: freshUser.referral_count,
        rank: freshUser.rank,
        status: freshUser.status,
        createdAt: freshUser.created_at,
        perks,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/waitlist/status
 * Look up existing position by email or referral code
 */
async function getStatus(req, res, next) {
  try {
    const { email, code } = req.query;

    if (!email && !code) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either an email or a referral code to look up status.',
      });
    }

    let user = null;
    if (email) {
      user = await db.getUserByEmail(email.trim());
    } else if (code) {
      user = await db.getUserByReferralCode(code.trim());
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No waitlist signup found with the provided details.',
      });
    }

    const referralUrl = getReferralUrl(user.referral_code);
    const perks = getReferralPerks(user.referral_count);

    return res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        referralCode: user.referral_code,
        referralUrl,
        referralCount: user.referral_count,
        rank: user.rank,
        status: user.status,
        createdAt: user.created_at,
        perks,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/waitlist/public-stats
 * Returns overall waitlist count and top community referrers
 */
async function getPublicStats(req, res, next) {
  try {
    const stats = await db.getStats();

    return res.json({
      success: true,
      data: {
        totalWaitlist: stats.totalUsers,
        totalReferrals: stats.totalReferrals,
        grantedUsers: stats.grantedUsers,
        topReferrers: stats.topReferrers.map((r) => ({
          name: r.name.split(' ')[0] + ' ' + (r.name.split(' ')[1] ? r.name.split(' ')[1][0] + '.' : ''),
          referralCount: r.referral_count,
          rank: r.rank,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  joinWaitlist,
  getStatus,
  getPublicStats,
};
