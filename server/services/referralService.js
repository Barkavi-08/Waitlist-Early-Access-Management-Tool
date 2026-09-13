// ==========================================================
// Referral Service
// Handles code generation, referral link building, and reward perks
// ==========================================================

const crypto = require('crypto');
const config = require('../config/config');

/**
 * Generate a clean, memorable referral code.
 * E.g., 'NOVA-A8X3K' or 'ALEX-79B2'
 */
function generateReferralCode(name = '') {
  const cleanName = name.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4) || 'REF';
  const randomChars = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars
  return `${cleanName}-${randomChars}`;
}

/**
 * Construct the full public referral URL for a given code
 */
function getReferralUrl(referralCode) {
  return `${config.clientUrl}?ref=${referralCode}`;
}

/**
 * Determine gamification badge and progress based on referral count
 */
function getReferralPerks(referralCount) {
  if (referralCount >= 5) {
    return {
      tier: 'Diamond VIP',
      badge: '🏆 Instant Fast-Track',
      nextTierGoal: null,
      referralsNeededForNext: 0,
      description: 'You are at the top of the priority list for wave 1 rollout!',
    };
  }
  if (referralCount >= 3) {
    return {
      tier: 'Gold Advocate',
      badge: '🥇 Priority Queue',
      nextTierGoal: 'Diamond VIP (5 referrals)',
      referralsNeededForNext: 5 - referralCount,
      description: 'You unlocked Priority Wave 2 rollout access!',
    };
  }
  if (referralCount >= 1) {
    return {
      tier: 'Silver Explorer',
      badge: '🥈 Early Supporter',
      nextTierGoal: 'Gold Advocate (3 referrals)',
      referralsNeededForNext: 3 - referralCount,
      description: 'You bypassed the general queue. Invite 2 more to hit Priority!',
    };
  }
  return {
    tier: 'Bronze Pioneer',
    badge: '🥉 General Queue',
    nextTierGoal: 'Silver Explorer (1 referral)',
    referralsNeededForNext: 1,
    description: 'Invite 1 friend to boost your waitlist rank immediately!',
  };
}

module.exports = {
  generateReferralCode,
  getReferralUrl,
  getReferralPerks,
};
