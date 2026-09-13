// ==========================================================
// PostgreSQL Storage Engine
// Uses 'pg' Pool with SQL queries matching schema.sql
// ==========================================================

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');

let pool = null;

function getPool() {
  if (!pool) {
    if (config.databaseUrl) {
      pool = new Pool({ connectionString: config.databaseUrl });
    } else {
      pool = new Pool(config.pgConfig);
    }
  }
  return pool;
}

const postgresStorage = {
  async init() {
    const p = getPool();
    // Test connection
    const client = await p.connect();
    try {
      console.log('[PostgreSQL] Connected successfully to database');
      // Run schema script to ensure tables exist
      const schemaPath = path.join(__dirname, 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
        await client.query(schemaSql);
        console.log('[PostgreSQL] Database schema verified/initialized');
      }
    } finally {
      client.release();
    }
  },

  async getUsers({ search = '', status = 'all', sortBy = 'rank', order = 'asc' } = {}) {
    const p = getPool();
    let query = `
      SELECT 
        u.*,
        ROW_NUMBER() OVER (ORDER BY u.referral_count DESC, u.created_at ASC) as rank
      FROM waitlist_users u
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      query += ` AND (LOWER(u.name) LIKE $${params.length} OR LOWER(u.email) LIKE $${params.length} OR LOWER(u.referral_code) LIKE $${params.length})`;
    }

    if (status && status !== 'all') {
      params.push(status);
      query += ` AND u.status = $${params.length}`;
    }

    // Sort order
    const direction = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    if (sortBy === 'referral_count') {
      query += ` ORDER BY u.referral_count ${direction}, u.created_at ASC`;
    } else if (sortBy === 'created_at') {
      query += ` ORDER BY u.created_at ${direction}`;
    } else {
      // Default sort by rank
      query += ` ORDER BY rank ${direction}`;
    }

    const result = await p.query(query, params);
    return result.rows.map((row) => ({
      ...row,
      rank: Number(row.rank),
    }));
  },

  async getUserById(id) {
    const p = getPool();
    const query = `
      WITH ranked_users AS (
        SELECT *, ROW_NUMBER() OVER (ORDER BY referral_count DESC, created_at ASC) as rank
        FROM waitlist_users
      )
      SELECT * FROM ranked_users WHERE id = $1
    `;
    const result = await p.query(query, [id]);
    if (result.rows.length === 0) return null;
    return { ...result.rows[0], rank: Number(result.rows[0].rank) };
  },

  async getUserByEmail(email) {
    const p = getPool();
    const query = `
      WITH ranked_users AS (
        SELECT *, ROW_NUMBER() OVER (ORDER BY referral_count DESC, created_at ASC) as rank
        FROM waitlist_users
      )
      SELECT * FROM ranked_users WHERE LOWER(email) = LOWER($1)
    `;
    const result = await p.query(query, [email.trim()]);
    if (result.rows.length === 0) return null;
    return { ...result.rows[0], rank: Number(result.rows[0].rank) };
  },

  async getUserByReferralCode(code) {
    if (!code) return null;
    const p = getPool();
    const query = `
      WITH ranked_users AS (
        SELECT *, ROW_NUMBER() OVER (ORDER BY referral_count DESC, created_at ASC) as rank
        FROM waitlist_users
      )
      SELECT * FROM ranked_users WHERE UPPER(referral_code) = UPPER($1)
    `;
    const result = await p.query(query, [code.trim()]);
    if (result.rows.length === 0) return null;
    return { ...result.rows[0], rank: Number(result.rows[0].rank) };
  },

  async createUser({ name, email, referralCode, referredBy = null }) {
    const p = getPool();
    const insertQuery = `
      INSERT INTO waitlist_users (name, email, referral_code, referred_by, referral_count, status)
      VALUES ($1, $2, $3, $4, 0, 'waitlisted')
      RETURNING *
    `;
    const result = await p.query(insertQuery, [
      name.trim(),
      email.trim().toLowerCase(),
      referralCode.toUpperCase(),
      referredBy ? referredBy.toUpperCase() : null,
    ]);

    const created = result.rows[0];
    return this.getUserById(created.id);
  },

  async incrementReferralCount(referralCode) {
    const p = getPool();
    const query = `
      UPDATE waitlist_users
      SET referral_count = referral_count + 1, updated_at = CURRENT_TIMESTAMP
      WHERE UPPER(referral_code) = UPPER($1)
      RETURNING *
    `;
    const result = await p.query(query, [referralCode.trim()]);
    return result.rows[0] || null;
  },

  async logReferral({ referrerCode, referredEmail }) {
    const p = getPool();
    const query = `
      INSERT INTO referrals (referrer_code, referred_email)
      VALUES ($1, $2)
      RETURNING *
    `;
    const result = await p.query(query, [referrerCode.toUpperCase(), referredEmail.toLowerCase()]);
    return result.rows[0];
  },

  async updateUserStatus(id, status) {
    const p = getPool();
    let query = `
      UPDATE waitlist_users
      SET status = $1, 
          access_granted_at = CASE WHEN $1 = 'granted' THEN CURRENT_TIMESTAMP ELSE NULL END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await p.query(query, [status, id]);
    if (result.rows.length === 0) return null;
    return this.getUserById(id);
  },

  async batchUpdateStatus(ids, status) {
    const p = getPool();
    const query = `
      UPDATE waitlist_users
      SET status = $1,
          access_granted_at = CASE WHEN $1 = 'granted' THEN CURRENT_TIMESTAMP ELSE NULL END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ANY($2::int[])
    `;
    const result = await p.query(query, [status, ids]);
    return { updatedCount: result.rowCount };
  },

  async deleteUser(id) {
    const p = getPool();
    const result = await p.query('DELETE FROM waitlist_users WHERE id = $1', [id]);
    return result.rowCount > 0;
  },

  async getStats() {
    const p = getPool();
    const countsQuery = `
      SELECT
        COUNT(*) AS total_users,
        COALESCE(SUM(referral_count), 0) AS total_referrals,
        COUNT(*) FILTER (WHERE status = 'granted') AS granted_users,
        COUNT(*) FILTER (WHERE status = 'waitlisted') AS waitlisted_users,
        COUNT(*) FILTER (WHERE status = 'revoked') AS revoked_users,
        COUNT(*) FILTER (WHERE referred_by IS NOT NULL) AS users_referred
      FROM waitlist_users
    `;
    const countsRes = await p.query(countsQuery);
    const row = countsRes.rows[0];

    const totalUsers = Number(row.total_users);
    const usersReferred = Number(row.users_referred);
    const viralRate = totalUsers > 0 ? ((usersReferred / totalUsers) * 100).toFixed(1) : 0;

    const topQuery = `
      SELECT name, email, referral_count, status,
             ROW_NUMBER() OVER (ORDER BY referral_count DESC, created_at ASC) as rank
      FROM waitlist_users
      ORDER BY referral_count DESC, created_at ASC
      LIMIT 5
    `;
    const topRes = await p.query(topQuery);

    return {
      totalUsers,
      totalReferrals: Number(row.total_referrals),
      grantedUsers: Number(row.granted_users),
      waitlistedUsers: Number(row.waitlisted_users),
      revokedUsers: Number(row.revoked_users),
      viralRate: Number(viralRate),
      topReferrers: topRes.rows.map((r) => ({
        ...r,
        rank: Number(r.rank),
      })),
    };
  },

  async logEmail({ recipient, subject, type, content, status = 'sent' }) {
    const p = getPool();
    const query = `
      INSERT INTO email_logs (recipient, subject, type, content, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await p.query(query, [recipient, subject, type, content, status]);
    return result.rows[0];
  },

  async getEmailLogs() {
    const p = getPool();
    const result = await p.query('SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 50');
    return result.rows;
  },

  async getAdmin(username) {
    const p = getPool();
    const result = await p.query('SELECT * FROM admin_users WHERE username = $1', [username]);
    return result.rows[0] || null;
  },

  async createAdminIfNotExists(username, passwordHash) {
    const p = getPool();
    const check = await this.getAdmin(username);
    if (!check) {
      const result = await p.query(
        'INSERT INTO admin_users (username, password_hash) VALUES ($1, $2) RETURNING *',
        [username, passwordHash]
      );
      return result.rows[0];
    }
    return check;
  },
};

module.exports = postgresStorage;
