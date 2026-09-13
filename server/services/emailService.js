// ==========================================================
// Email Service
// Sends emails via SMTP (Nodemailer) or logs them in simulation mode
// ==========================================================

const nodemailer = require('nodemailer');
const config = require('../config/config');
const db = require('../db');

// Create transporter if SMTP credentials are provided and simulation is disabled
let transporter = null;
if (!config.emailSimulation && config.smtp.auth.user) {
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    auth: {
      user: config.smtp.auth.user,
      pass: config.smtp.auth.pass,
    },
  });
}

/**
 * Dispatch an email or log it to console/database in simulation mode
 */
async function sendEmail({ to, subject, html, text, type }) {
  console.log(`\n================== [EMAIL DISPATCH: ${type.toUpperCase()}] ==================`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Mode: ${config.emailSimulation ? 'SIMULATION (Local Dev Mode)' : 'SMTP (Live)'}`);
  console.log(`Body Snippet: ${text.slice(0, 150)}...`);
  console.log('=====================================================================\n');

  let status = 'sent';

  if (!config.emailSimulation && transporter) {
    try {
      await transporter.sendMail({
        from: config.emailFrom,
        to,
        subject,
        text,
        html,
      });
    } catch (err) {
      console.error(`Failed to send real email via SMTP: ${err.message}`);
      status = 'failed';
    }
  }

  // Always log to database so admin and examiners can view it in the UI
  try {
    await db.logEmail({
      recipient: to,
      subject,
      type,
      content: html,
      status,
    });
  } catch (err) {
    console.error('Failed to log email to database:', err.message);
  }

  return { success: true, simulated: config.emailSimulation, status };
}

/**
 * Send welcome email when a user joins the waitlist
 */
async function sendWelcomeEmail(user, referralUrl, rank) {
  const subject = `🎉 You're on the waitlist! (Position #${rank})`;
  const text = `
Hi ${user.name},

Thank you for joining the Nova early-access waitlist!

Your current waitlist position is #${rank}.
Your unique referral link: ${referralUrl}

Share your link with colleagues and friends. Every person who joins using your link boosts your position up the waitlist!

Best regards,
The Nova Team
  `.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #4f46e5; margin-bottom: 8px;">Welcome to Nova Early Access!</h2>
      <p>Hi <strong>${user.name}</strong>,</p>
      <p>You've successfully secured your spot on our early-access waitlist.</p>
      
      <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 16px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #64748b;">Current Waitlist Position</p>
        <p style="margin: 4px 0 0 0; font-size: 28px; font-weight: bold; color: #1e293b;">#${rank}</p>
      </div>

      <h3 style="margin-top: 24px; color: #1e293b;">Move Up Faster with Referrals</h3>
      <p>Invite friends to join. Each friend who signs up with your link pushes you closer to the front of the queue.</p>
      
      <div style="background: #eef2ff; padding: 12px; border-radius: 6px; word-break: break-all; margin: 16px 0;">
        <span style="font-size: 13px; color: #4338ca;">Your Referral Link:</span><br/>
        <a href="${referralUrl}" style="color: #4f46e5; font-weight: bold;">${referralUrl}</a>
      </div>

      <p style="font-size: 13px; color: #64748b; margin-top: 30px;">
        Questions? Simply reply to this email.<br/>
        &copy; ${new Date().getFullYear()} Nova Tech.
      </p>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject,
    text,
    html,
    type: 'welcome_waitlist',
  });
}

/**
 * Send access granted email when an admin invites the user
 */
async function sendAccessGrantedEmail(user) {
  const subject = `🚀 You're In! Early Access Granted to Nova`;
  const text = `
Hi ${user.name},

Great news! Your waitlist position has cleared and early access to Nova has been granted.

You can now explore all the upcoming features before the public launch.

Visit our portal: ${config.clientUrl}

Thank you for your support and referrals!

The Nova Team
  `.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #10b981; border-radius: 8px;">
      <h2 style="color: #059669; margin-bottom: 8px;">🎉 Access Granted!</h2>
      <p>Hi <strong>${user.name}</strong>,</p>
      <p>The wait is over! Your early-access invitation to <strong>Nova</strong> is officially active.</p>
      
      <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 16px; font-weight: 600; color: #065f46;">
          Status: Access Unlocked (Wave 1 Rollout)
        </p>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #047857;">
          Total friends referred: <strong>${user.referral_count || 0}</strong>
        </p>
      </div>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${config.clientUrl}" style="background-color: #059669; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">
          Enter Nova Workspace &rarr;
        </a>
      </div>

      <p style="font-size: 13px; color: #64748b; margin-top: 30px;">
        Enjoy your early access!<br/>
        &copy; ${new Date().getFullYear()} Nova Tech.
      </p>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject,
    text,
    html,
    type: 'access_granted',
  });
}

module.exports = {
  sendWelcomeEmail,
  sendAccessGrantedEmail,
};
