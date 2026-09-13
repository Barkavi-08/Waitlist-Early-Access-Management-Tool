// ==========================================================
// Admin Controller
// Handles admin authentication, user ranking, batch access release,
// status toggling, CSV export, statistics, and email logs
// ==========================================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const db = require('../db');
const { sendAccessGrantedEmail } = require('../services/emailService');

/**
 * POST /api/admin/login
 * Authenticates admin and returns JWT token
 */
async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.',
      });
    }

    // Check credentials against configured admin
    // If admin is in database, check hash; otherwise check against env config
    const configuredUsername = config.adminUsername;
    const configuredPassword = config.adminPassword;

    let isMatch = false;

    // Check if matching environment admin
    if (username.trim() === configuredUsername && password === configuredPassword) {
      isMatch = true;
    } else {
      // Check database admin
      const adminRecord = await db.getAdmin(username.trim());
      if (adminRecord) {
        isMatch = await bcrypt.compare(password, adminRecord.password_hash);
      }
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator credentials.',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { username: username.trim(), role: 'admin' },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    return res.json({
      success: true,
      message: 'Admin login successful.',
      data: {
        token,
        username: username.trim(),
        role: 'admin',
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/stats
 * Returns complete metrics for the admin dashboard
 */
async function getStats(req, res, next) {
  try {
    const stats = await db.getStats();
    const databaseEngine = db.getEngineName();

    return res.json({
      success: true,
      data: {
        ...stats,
        databaseEngine,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/users
 * Returns list of waitlisted users with search, status filters, and sorting
 */
async function getUsers(req, res, next) {
  try {
    const { search = '', status = 'all', sortBy = 'rank', order = 'asc' } = req.query;

    const users = await db.getUsers({
      search,
      status,
      sortBy,
      order,
    });

    return res.json({
      success: true,
      data: {
        total: users.length,
        users,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/admin/users/:id/status
 * Updates an individual user's access status
 */
async function updateUserStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['waitlisted', 'granted', 'revoked'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const updated = await db.updateUserStatus(id, status);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // If access was granted, send invitation email
    if (status === 'granted') {
      sendAccessGrantedEmail(updated).catch((err) => {
        console.error('Failed to send access granted email:', err.message);
      });
    }

    return res.json({
      success: true,
      message: `User status successfully updated to '${status}'.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/admin/users/batch-grant
 * Releases access to users in batches (e.g. top N waitlisted users or selected IDs)
 */
async function batchGrantAccess(req, res, next) {
  try {
    const { count, userIds } = req.body;

    let targetIds = [];

    if (Array.isArray(userIds) && userIds.length > 0) {
      targetIds = userIds;
    } else if (count && Number(count) > 0) {
      // Fetch top N waitlisted users who do NOT yet have access
      const allUsers = await db.getUsers({ status: 'waitlisted', sortBy: 'rank', order: 'asc' });
      targetIds = allUsers.slice(0, Number(count)).map((u) => u.id);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please provide either a batch count or an array of userIds.',
      });
    }

    if (targetIds.length === 0) {
      return res.json({
        success: true,
        message: 'No pending waitlist users to grant access to.',
        data: { grantedCount: 0 },
      });
    }

    // Batch update in database
    await db.batchUpdateStatus(targetIds, 'granted');

    // Send access emails to all granted users
    for (const id of targetIds) {
      const u = await db.getUserById(id);
      if (u) {
        sendAccessGrantedEmail(u).catch((err) =>
          console.error(`Email error for ${u.email}:`, err.message)
        );
      }
    }

    return res.json({
      success: true,
      message: `Successfully released early access to ${targetIds.length} users!`,
      data: {
        grantedCount: targetIds.length,
        grantedIds: targetIds,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/admin/users/:id
 * Removes a user from the waitlist
 */
async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await db.deleteUser(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'User not found or already deleted.',
      });
    }

    return res.json({
      success: true,
      message: 'User removed from waitlist successfully.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/export/csv
 * Exports the entire waitlist as a CSV file download
 */
async function exportCsv(req, res, next) {
  try {
    const users = await db.getUsers({ sortBy: 'rank', order: 'asc' });

    // CSV Headers
    const headers = ['Rank', 'ID', 'Name', 'Email', 'Referral Code', 'Referred By', 'Referral Count', 'Status', 'Signup Date', 'Access Granted Date'];
    
    // Convert rows to CSV format
    const rows = users.map((u) => [
      u.rank,
      u.id,
      `"${(u.name || '').replace(/"/g, '""')}"`,
      `"${(u.email || '').replace(/"/g, '""')}"`,
      u.referral_code,
      u.referred_by || 'None',
      u.referral_count,
      u.status,
      `"${u.created_at}"`,
      u.access_granted_at ? `"${u.access_granted_at}"` : 'N/A',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=waitlist_export_${Date.now()}.csv`);
    return res.send(csvContent);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/emails
 * Returns email delivery logs (shows simulated or sent emails)
 */
async function getEmailLogs(req, res, next) {
  try {
    const logs = await db.getEmailLogs();
    return res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  getStats,
  getUsers,
  updateUserStatus,
  batchGrantAccess,
  deleteUser,
  exportCsv,
  getEmailLogs,
};
