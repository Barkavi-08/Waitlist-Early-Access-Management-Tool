// ==========================================================
// File-based Storage Engine (JSON File Database)
// Used for zero-config local development and offline college demos
// ==========================================================

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'waitlist.json');

// Initial schema structure
const defaultData = {
  users: [],
  referrals: [],
  adminUsers: [],
  emailLogs: [],
};

// Ensure data directory and file exist
function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
  }
}

// Read database from file
function readData() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading JSON database, resetting file:', err.message);
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
    return defaultData;
  }
}

// Write database to file
function writeData(data) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Calculate user rank based on referral count and signup date.
 * Rule: More referrals = higher rank (lower position number).
 * Ties are broken by earlier signup time (FIFO).
 */
function calculateRanks(users) {
  // Sort copy of users: referral_count DESC, created_at ASC
  const sorted = [...users].sort((a, b) => {
    if (b.referral_count !== a.referral_count) {
      return b.referral_count - a.referral_count;
    }
    return new Date(a.created_at) - new Date(b.created_at);
  });

  // Assign 1-indexed rank
  return sorted.map((user, index) => ({
    ...user,
    rank: index + 1,
  }));
}

const fileStorage = {
  async init() {
    ensureDataFile();
    console.log(`[Storage] Using local JSON file storage: ${DATA_FILE}`);
  },

  async getUsers({ search = '', status = 'all', sortBy = 'rank', order = 'asc' } = {}) {
    const data = readData();
    let ranked = calculateRanks(data.users);

    // Filter by search query (name or email)
    if (search) {
      const q = search.toLowerCase();
      ranked = ranked.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.referral_code && u.referral_code.toLowerCase().includes(q))
      );
    }

    // Filter by status
    if (status && status !== 'all') {
      ranked = ranked.filter((u) => u.status === status);
    }

    // Sort order
    ranked.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === 'created_at') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (order.toLowerCase() === 'desc') {
        return valA < valB ? 1 : valA > valB ? -1 : 0;
      }
      return valA > valB ? 1 : valA < valB ? -1 : 0;
    });

    return ranked;
  },

  async getUserById(id) {
    const data = readData();
    const ranked = calculateRanks(data.users);
    return ranked.find((u) => u.id === Number(id)) || null;
  },

  async getUserByEmail(email) {
    const data = readData();
    const ranked = calculateRanks(data.users);
    const normalized = email.trim().toLowerCase();
    return ranked.find((u) => u.email.toLowerCase() === normalized) || null;
  },

  async getUserByReferralCode(code) {
    if (!code) return null;
    const data = readData();
    const ranked = calculateRanks(data.users);
    const normalized = code.trim().toUpperCase();
    return ranked.find((u) => u.referral_code.toUpperCase() === normalized) || null;
  },

  async createUser({ name, email, referralCode, referredBy = null }) {
    const data = readData();
    const newId = data.users.length > 0 ? Math.max(...data.users.map((u) => u.id)) + 1 : 1;
    const now = new Date().toISOString();

    const newUser = {
      id: newId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      referral_code: referralCode.toUpperCase(),
      referred_by: referredBy ? referredBy.toUpperCase() : null,
      referral_count: 0,
      status: 'waitlisted',
      access_granted_at: null,
      created_at: now,
      updated_at: now,
    };

    data.users.push(newUser);
    writeData(data);

    // Return user with newly assigned rank
    const ranked = calculateRanks(data.users);
    return ranked.find((u) => u.id === newId);
  },

  async incrementReferralCount(referralCode) {
    const data = readData();
    const userIndex = data.users.findIndex(
      (u) => u.referral_code.toUpperCase() === referralCode.trim().toUpperCase()
    );

    if (userIndex !== -1) {
      data.users[userIndex].referral_count += 1;
      data.users[userIndex].updated_at = new Date().toISOString();
      writeData(data);
      return data.users[userIndex];
    }
    return null;
  },

  async logReferral({ referrerCode, referredEmail }) {
    const data = readData();
    const newId = data.referrals.length > 0 ? Math.max(...data.referrals.map((r) => r.id)) + 1 : 1;

    const record = {
      id: newId,
      referrer_code: referrerCode.toUpperCase(),
      referred_email: referredEmail.toLowerCase(),
      created_at: new Date().toISOString(),
    };

    data.referrals.push(record);
    writeData(data);
    return record;
  },

  async updateUserStatus(id, status) {
    const data = readData();
    const userIndex = data.users.findIndex((u) => u.id === Number(id));

    if (userIndex !== -1) {
      data.users[userIndex].status = status;
      data.users[userIndex].updated_at = new Date().toISOString();
      if (status === 'granted') {
        data.users[userIndex].access_granted_at = new Date().toISOString();
      } else if (status === 'waitlisted') {
        data.users[userIndex].access_granted_at = null;
      }
      writeData(data);
      const ranked = calculateRanks(data.users);
      return ranked.find((u) => u.id === Number(id));
    }
    return null;
  },

  async batchUpdateStatus(ids, status) {
    const data = readData();
    const idSet = new Set(ids.map((id) => Number(id)));
    const now = new Date().toISOString();
    let updatedCount = 0;

    data.users.forEach((user) => {
      if (idSet.has(user.id)) {
        user.status = status;
        user.updated_at = now;
        if (status === 'granted') {
          user.access_granted_at = now;
        } else if (status === 'waitlisted') {
          user.access_granted_at = null;
        }
        updatedCount++;
      }
    });

    writeData(data);
    return { updatedCount };
  },

  async deleteUser(id) {
    const data = readData();
    const initialLen = data.users.length;
    data.users = data.users.filter((u) => u.id !== Number(id));
    data.referrals = data.referrals.filter((r) => r.referrer_id !== Number(id));
    writeData(data);
    return data.users.length < initialLen;
  },

  async getStats() {
    const data = readData();
    const totalUsers = data.users.length;
    const totalReferrals = data.users.reduce((sum, u) => sum + (u.referral_count || 0), 0);
    const grantedUsers = data.users.filter((u) => u.status === 'granted').length;
    const waitlistedUsers = data.users.filter((u) => u.status === 'waitlisted').length;
    const revokedUsers = data.users.filter((u) => u.status === 'revoked').length;

    // Users who signed up via someone's referral link
    const usersReferred = data.users.filter((u) => u.referred_by).length;
    const viralRate = totalUsers > 0 ? ((usersReferred / totalUsers) * 100).toFixed(1) : 0;

    // Top 5 referrers
    const ranked = calculateRanks(data.users);
    const topReferrers = ranked.slice(0, 5).map((u) => ({
      name: u.name,
      email: u.email,
      referral_count: u.referral_count,
      rank: u.rank,
      status: u.status,
    }));

    return {
      totalUsers,
      totalReferrals,
      grantedUsers,
      waitlistedUsers,
      revokedUsers,
      viralRate: Number(viralRate),
      topReferrers,
    };
  },

  async logEmail({ recipient, subject, type, content, status = 'sent' }) {
    const data = readData();
    const newId = data.emailLogs.length > 0 ? Math.max(...data.emailLogs.map((e) => e.id)) + 1 : 1;

    const entry = {
      id: newId,
      recipient,
      subject,
      type,
      content,
      status,
      created_at: new Date().toISOString(),
    };

    data.emailLogs.unshift(entry);
    // Keep max 50 recent email logs
    if (data.emailLogs.length > 50) {
      data.emailLogs = data.emailLogs.slice(0, 50);
    }
    writeData(data);
    return entry;
  },

  async getEmailLogs() {
    const data = readData();
    return data.emailLogs || [];
  },

  async getAdmin(username) {
    const data = readData();
    return data.adminUsers.find((a) => a.username === username) || null;
  },

  async createAdminIfNotExists(username, passwordHash) {
    const data = readData();
    const existing = data.adminUsers.find((a) => a.username === username);
    if (!existing) {
      const newAdmin = {
        id: data.adminUsers.length + 1,
        username,
        password_hash: passwordHash,
        created_at: new Date().toISOString(),
      };
      data.adminUsers.push(newAdmin);
      writeData(data);
      return newAdmin;
    }
    return existing;
  },
};

module.exports = fileStorage;
