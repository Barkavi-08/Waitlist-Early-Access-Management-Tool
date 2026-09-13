-- ==========================================================
-- PostgreSQL Database Schema
-- Project: Waitlist & Early-Access Management Tool
-- ==========================================================

-- 1. Create table for waitlist users
CREATE TABLE IF NOT EXISTS waitlist_users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    referral_code VARCHAR(32) NOT NULL UNIQUE,
    referred_by VARCHAR(32) DEFAULT NULL,
    referral_count INTEGER DEFAULT 0 NOT NULL,
    status VARCHAR(20) DEFAULT 'waitlisted' NOT NULL, -- 'waitlisted', 'granted', 'revoked'
    access_granted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index for fast lookup by referral code and email
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON waitlist_users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_email ON waitlist_users(email);
CREATE INDEX IF NOT EXISTS idx_users_rank ON waitlist_users(referral_count DESC, created_at ASC);

-- 2. Create table for tracking individual referral events
CREATE TABLE IF NOT EXISTS referrals (
    id SERIAL PRIMARY KEY,
    referrer_code VARCHAR(32) NOT NULL,
    referred_email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_referrer FOREIGN KEY (referrer_code) REFERENCES waitlist_users(referral_code) ON DELETE CASCADE
);

-- 3. Create table for admin users
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4. Create table for logged emails (welcome & access granted)
CREATE TABLE IF NOT EXISTS email_logs (
    id SERIAL PRIMARY KEY,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'welcome_waitlist', 'access_granted'
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'sent' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
