// ==========================================================
// Central Application Configuration
// ==========================================================

const path = require('path');
// Load environment variables from server/.env or root .env
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
require('dotenv').config();

const config = {
  // Server Port
  port: process.env.PORT || 5000,
  
  // Client URL (Frontend)
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  // Admin Authentication
  jwtSecret: process.env.JWT_SECRET || 'dev_jwt_secret_key_college_project_2026',
  jwtExpiresIn: '24h',
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',

  // Database Configuration
  usePostgres: process.env.USE_POSTGRES === 'true',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/waitlist_db',
  pgConfig: {
    host: process.env.PGHOST || 'localhost',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    database: process.env.PGDATABASE || 'waitlist_db',
    port: parseInt(process.env.PGPORT || '5432', 10),
  },

  // Email Configuration
  emailSimulation: process.env.EMAIL_SERVICE_SIMULATION !== 'false',
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '2525', 10),
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  },
  emailFrom: process.env.EMAIL_FROM || 'Nova Early Access <noreply@nova.dev>',
};

module.exports = config;
