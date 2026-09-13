// ==========================================================
// Waitlist & Early-Access Management Tool - Express Server
// ==========================================================

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const config = require('./config/config');
const db = require('./db');
const waitlistRoutes = require('./routes/waitlistRoutes');
const adminRoutes = require('./routes/adminRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ==========================================================
// Middleware Configuration
// ==========================================================
app.use(cors({
  origin: '*', // Allow frontend Vite client and local development
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// ==========================================================
// API Routes
// ==========================================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    databaseEngine: db.getEngineName(),
  });
});

app.use('/api/waitlist', waitlistRoutes);
app.use('/api/admin', adminRoutes);

// Central error handler
app.use(errorHandler);

// ==========================================================
// Server Initialization
// ==========================================================
async function startServer() {
  try {
    // 1. Initialize Database (PostgreSQL with fallback to local JSON storage)
    await db.initDatabase();

    // 2. Ensure default admin account exists
    const hashedPassword = await bcrypt.hash(config.adminPassword, 10);
    await db.createAdminIfNotExists(config.adminUsername, hashedPassword);

    // 3. Listen on port
    app.listen(config.port, () => {
      console.log('\n==========================================================');
      console.log('🚀 Waitlist & Early-Access Server is running!');
      console.log(`📡 Backend URL:   http://localhost:${config.port}`);
      console.log(`🌐 Frontend URL:  ${config.clientUrl}`);
      console.log(`💾 Active DB:     ${db.getEngineName()}`);
      console.log(`🔑 Default Admin: ${config.adminUsername} / ${config.adminPassword}`);
      console.log('==========================================================\n');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
