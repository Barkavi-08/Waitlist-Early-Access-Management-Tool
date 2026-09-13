// ==========================================================
// Database Seed Script
// Populates realistic demo waitlist data for college presentations
// ==========================================================

const db = require('./index');
const { generateReferralCode } = require('../services/referralService');

const sampleUsers = [
  { name: 'Sarah Chen', email: 'sarah.chen@example.com', referrals: 8, status: 'granted' },
  { name: 'Marcus Johnson', email: 'marcus.j@example.com', referrals: 6, status: 'granted' },
  { name: 'Priya Sharma', email: 'priya.sharma@example.com', referrals: 5, status: 'waitlisted' },
  { name: 'Alex Rivera', email: 'alex.rivera@example.com', referrals: 4, status: 'waitlisted' },
  { name: 'Liam Wilson', email: 'liam.w@example.com', referrals: 3, status: 'waitlisted' },
  { name: 'Emma Watson', email: 'emma.watson@example.com', referrals: 2, status: 'waitlisted' },
  { name: 'Noah Davis', email: 'noah.davis@example.com', referrals: 2, status: 'waitlisted' },
  { name: 'Aaliyah Patel', email: 'aaliyah.p@example.com', referrals: 1, status: 'waitlisted' },
  { name: 'Lucas Martin', email: 'lucas.m@example.com', referrals: 1, status: 'waitlisted' },
  { name: 'Chloe Taylor', email: 'chloe.t@example.com', referrals: 1, status: 'waitlisted' },
  { name: 'David Kim', email: 'david.kim@example.com', referrals: 0, status: 'waitlisted' },
  { name: 'Sophia Brown', email: 'sophia.b@example.com', referrals: 0, status: 'waitlisted' },
  { name: 'Daniel Miller', email: 'daniel.m@example.com', referrals: 0, status: 'waitlisted' },
  { name: 'Mia Anderson', email: 'mia.a@example.com', referrals: 0, status: 'waitlisted' },
  { name: 'James Wilson', email: 'james.w@example.com', referrals: 0, status: 'waitlisted' },
];

async function seed() {
  console.log('[Seed] Starting database population...');
  await db.initDatabase();

  for (let i = 0; i < sampleUsers.length; i++) {
    const s = sampleUsers[i];
    const existing = await db.getUserByEmail(s.email);

    if (!existing) {
      const code = generateReferralCode(s.name);
      const user = await db.createUser({
        name: s.name,
        email: s.email,
        referralCode: code,
        referredBy: i > 2 ? 'SARAH-A1B2' : null,
      });

      // Update referral count and status
      for (let r = 0; r < s.referrals; r++) {
        await db.incrementReferralCount(code);
      }

      if (s.status === 'granted') {
        await db.updateUserStatus(user.id, 'granted');
      }

      console.log(`+ Added: ${s.name} (${s.email}) - Referrals: ${s.referrals}, Status: ${s.status}`);
    } else {
      console.log(`- Skipping already existing: ${s.email}`);
    }
  }

  console.log('\n[Seed] Finished successfully! Demo data is ready for presentation.\n');
  process.exit(0);
}

seed().catch((err) => {
  console.error('[Seed Error]:', err);
  process.exit(1);
});
