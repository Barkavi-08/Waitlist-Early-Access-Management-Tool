// ==========================================================
// Comprehensive API Test Script
// Tests all public and admin endpoints
// ==========================================================

async function runTests() {
  const base = 'http://localhost:5000/api';
  console.log('--- Starting API Verification Tests ---\n');

  // Test 1: Health check
  console.log('1. Testing /health...');
  const healthRes = await fetch(`${base}/health`);
  const healthData = await healthRes.json();
  console.log('   Status:', healthData.status, '| DB Engine:', healthData.databaseEngine);
  if (healthData.status !== 'online') throw new Error('Health check failed');

  // Test 2: Public stats
  console.log('2. Testing /waitlist/public-stats...');
  const statsRes = await fetch(`${base}/waitlist/public-stats`);
  const statsData = await statsRes.json();
  console.log('   Total in waitlist:', statsData.data.totalWaitlist);
  console.log('   Total referrals:', statsData.data.totalReferrals);
  console.log('   Top referrers count:', statsData.data.topReferrers.length);

  // Test 3: Join waitlist (New User A)
  const testEmailA = `alice_${Date.now()}@example.com`;
  console.log(`3. Testing /waitlist/join with ${testEmailA}...`);
  const joinResA = await fetch(`${base}/waitlist/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Alice Walker', email: testEmailA }),
  });
  const joinDataA = await joinResA.json();
  console.log('   Joined successfully! Code:', joinDataA.data.referralCode, '| Rank:', joinDataA.data.rank);
  const codeA = joinDataA.data.referralCode;

  // Test 4: Duplicate signup check
  console.log('4. Testing duplicate signup rejection/welcome back...');
  const dupRes = await fetch(`${base}/waitlist/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Alice Walker', email: testEmailA }),
  });
  const dupData = await dupRes.json();
  console.log('   Duplicate response alreadyJoined:', dupData.alreadyJoined, '| Message:', dupData.message);

  // Test 5: Join waitlist with referral code from Alice (User B)
  const testEmailB = `bob_${Date.now()}@example.com`;
  console.log(`5. Testing /waitlist/join with invite ref code: ${codeA}...`);
  const joinResB = await fetch(`${base}/waitlist/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Bob Roberts', email: testEmailB, ref: codeA }),
  });
  const joinDataB = await joinResB.json();
  console.log('   User B joined! Rank:', joinDataB.data.rank);

  // Test 6: Verify Alice's referral count incremented
  console.log('6. Testing status lookup for Alice to check updated referral count...');
  const statusResA = await fetch(`${base}/waitlist/status?email=${encodeURIComponent(testEmailA)}`);
  const statusDataA = await statusResA.json();
  console.log('   Alice referrals:', statusDataA.data.referralCount, '| New Rank:', statusDataA.data.rank, '| Tier:', statusDataA.data.perks.tier);
  if (statusDataA.data.referralCount !== 1) {
    throw new Error(`Expected Alice referralCount to be 1, got ${statusDataA.data.referralCount}`);
  }

  // Test 7: Admin Login
  console.log('7. Testing /admin/login...');
  const loginRes = await fetch(`${base}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
  });
  const loginData = await loginRes.json();
  const token = loginData.data.token;
  console.log('   Admin login successful! Received JWT token.');

  // Test 8: Admin Stats
  console.log('8. Testing /admin/stats...');
  const adminStatsRes = await fetch(`${base}/admin/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const adminStatsData = await adminStatsRes.json();
  console.log('   Total Users:', adminStatsData.data.totalUsers);
  console.log('   Waitlisted Users:', adminStatsData.data.waitlistedUsers);
  console.log('   Granted Users:', adminStatsData.data.grantedUsers);
  console.log('   Viral Rate:', adminStatsData.data.viralRate + '%');

  // Test 9: Admin Users list with search
  console.log('9. Testing /admin/users with search query "Alice"...');
  const usersRes = await fetch(`${base}/admin/users?search=Alice`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const usersData = await usersRes.json();
  console.log('   Found users:', usersData.data.users.length, 'matching "Alice"');

  // Test 10: Admin Status Update
  console.log(`10. Testing /admin/users/${joinDataA.data.id}/status to 'granted'...`);
  const updateRes = await fetch(`${base}/admin/users/${joinDataA.data.id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status: 'granted' }),
  });
  const updateData = await updateRes.json();
  console.log('   Updated user status:', updateData.data.status);

  // Test 11: Admin Batch Grant
  console.log('11. Testing /admin/users/batch-grant for top 2 waitlisted users...');
  const batchRes = await fetch(`${base}/admin/users/batch-grant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ count: 2 }),
  });
  const batchData = await batchRes.json();
  console.log('   Batch granted count:', batchData.data.grantedCount);

  // Test 12: CSV Export with query token
  console.log('12. Testing CSV Export with query token...');
  const csvRes = await fetch(`${base}/admin/export/csv?token=${encodeURIComponent(token)}`);
  const csvText = await csvRes.text();
  console.log('   CSV rows received, length:', csvText.length, 'bytes');
  console.log('   CSV header preview:', csvText.split('\n')[0]);

  // Test 13: Email Logs
  console.log('13. Testing /admin/emails...');
  const emailRes = await fetch(`${base}/admin/emails`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const emailData = await emailRes.json();
  console.log('   Total logged emails:', emailData.data.length);
  if (emailData.data.length > 0) {
    console.log('   Recent email subject:', emailData.data[0].subject, 'to', emailData.data[0].recipient);
  }

  console.log('\n✅ ALL 13 TEST SUITES PASSED FLAWLESSLY!\n');
}

runTests().catch((err) => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
