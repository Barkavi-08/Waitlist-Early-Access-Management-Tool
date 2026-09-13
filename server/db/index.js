// ==========================================================
// Database Storage Selector & Initializer
// Provides dual-mode capability:
// 1. PostgreSQL (production / full college requirement)
// 2. Local JSON Storage (seamless fallback for offline demos)
// ==========================================================

const config = require('../config/config');
const fileStorage = require('./fileStorage');
const postgresStorage = require('./postgresStorage');

let activeStorage = fileStorage;

async function initDatabase() {
  if (config.usePostgres) {
    try {
      console.log('[Database] Attempting connection to PostgreSQL...');
      await postgresStorage.init();
      activeStorage = postgresStorage;
      console.log('[Database] Active database engine: PostgreSQL');
      return;
    } catch (err) {
      console.warn(
        `[Database] PostgreSQL connection failed: ${err.message}.\n` +
        `[Database] Gracefully falling back to local storage (data/waitlist.json) for development & offline demonstration!`
      );
      activeStorage = fileStorage;
      await fileStorage.init();
      return;
    }
  }

  // Default fallback mode
  console.log('[Database] USE_POSTGRES is false. Initializing local storage engine...');
  await fileStorage.init();
  activeStorage = fileStorage;
}

// Proxy wrapper that routes calls to whichever storage engine is active
const db = {
  initDatabase,
  getUsers: (...args) => activeStorage.getUsers(...args),
  getUserById: (...args) => activeStorage.getUserById(...args),
  getUserByEmail: (...args) => activeStorage.getUserByEmail(...args),
  getUserByReferralCode: (...args) => activeStorage.getUserByReferralCode(...args),
  createUser: (...args) => activeStorage.createUser(...args),
  incrementReferralCount: (...args) => activeStorage.incrementReferralCount(...args),
  logReferral: (...args) => activeStorage.logReferral(...args),
  updateUserStatus: (...args) => activeStorage.updateUserStatus(...args),
  batchUpdateStatus: (...args) => activeStorage.batchUpdateStatus(...args),
  deleteUser: (...args) => activeStorage.deleteUser(...args),
  getStats: (...args) => activeStorage.getStats(...args),
  logEmail: (...args) => activeStorage.logEmail(...args),
  getEmailLogs: (...args) => activeStorage.getEmailLogs(...args),
  getAdmin: (...args) => activeStorage.getAdmin(...args),
  createAdminIfNotExists: (...args) => activeStorage.createAdminIfNotExists(...args),
  getEngineName: () => (activeStorage === postgresStorage ? 'PostgreSQL' : 'Local File Storage (waitlist.json)'),
};

module.exports = db;
