#!/usr/bin/env node
// Check mailer configuration and optionally send a test email to ADMIN_NOTIFICATION_EMAILS

const fs = require('fs');
const path = require('path');

function loadEnvFile(p) {
  if (!fs.existsSync(p)) return;
  const raw = fs.readFileSync(p, 'utf8');
  raw.split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*([A-Za-z0-9_]+)=(.*)$/);
    if (!m) return;
    let key = m[1];
    let val = m[2];
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    process.env[key] = val;
  });
}

loadEnvFile(path.join(process.cwd(), '.env.local'));
loadEnvFile(path.join(process.cwd(), '.env'));

console.log('Mailer configuration check');
console.log('SENDGRID_API_KEY:', !!process.env.SENDGRID_API_KEY);
console.log('SMTP_HOST:', !!process.env.SMTP_HOST);
console.log('ADMIN_NOTIFICATION_EMAILS:', !!process.env.ADMIN_NOTIFICATION_EMAILS);

const admins = (process.env.ADMIN_NOTIFICATION_EMAILS || '').split(',').map(s => s.trim()).filter(Boolean);
if (!admins.length) {
  console.warn('No ADMIN_NOTIFICATION_EMAILS configured. Set ADMIN_NOTIFICATION_EMAILS in .env.local to enable admin notifications.');
  process.exit(0);
}

(async () => {
  try {
    console.log('Attempting to send test email to first admin:', admins[0]);

    // Inline send logic (mirrors lib/mailer.ts) so this script works even when
    // the project's TypeScript mailer isn't compiled to JavaScript.
    const from = process.env.SENDGRID_FROM || process.env.SMTP_FROM || `no-reply@${process.env.NEXT_PUBLIC_BASE_URL?.replace(/^https?:\/\//, '') || 'local'}`;
    const subject = 'Test notification from webosis-archive';
    const text = 'This is a test email to verify mailer configuration.';
    const html = '<p>This is a test email to verify mailer configuration.</p>';

    if (process.env.SENDGRID_API_KEY) {
      try {
        const sg = require('@sendgrid/mail');
        sg.setApiKey(process.env.SENDGRID_API_KEY);
        const msg = { to: admins[0], from, subject, text, html };
        const res = await sg.send(msg);
        console.log('[mailer] Sent via SendGrid', { to: admins[0], subject });
        console.log('sendMail result:', res);
        process.exit(0);
      } catch (err) {
        console.error('[mailer] SendGrid error', err?.message || err);
        // fallthrough to other options
      }
    }

    if (process.env.SMTP_HOST) {
      try {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
          secure: process.env.SMTP_SECURE === '1' || process.env.SMTP_SECURE === 'true',
          auth: process.env.SMTP_USER
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
        });
        const info = await transporter.sendMail({ from, to: admins[0], subject, text, html });
        console.log('[mailer] Sent via SMTP', { to: admins[0], subject, messageId: info.messageId });
        console.log('sendMail result:', info);
        process.exit(0);
      } catch (err) {
        console.error('[mailer] SMTP error', err?.message || err);
      }
    }

    // No mailer configured: print fallback guidance and a sample reset link format.
    console.log('[mailer] No mailer configured. The message will be logged instead.');
    console.log('[mailer] Sample email payload:', { from, to: admins[0], subject, text });
    process.exit(0);
  } catch (e) {
    console.error('Failed to send test email', e?.message || e);
    process.exit(2);
  }
})();
