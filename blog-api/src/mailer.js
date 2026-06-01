// =============================================================================
// Email delivery for the "send me the full analysis" capture form.
// Uses an external SMTP relay (configured via env), so no mail server runs on
// the VPS. If SMTP is not configured the feature degrades gracefully: the
// subscriber is still stored in the database for later follow-up.
// =============================================================================
'use strict';

const nodemailer = require('nodemailer');

const {
  SMTP_HOST,
  SMTP_PORT = '587',
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
} = process.env;

const enabled = !!(SMTP_HOST && SMTP_FROM);

let transporter = null;
if (enabled) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
}

// Notify the site owner that someone requested the full analysis.
async function notifyOwner(subscriber) {
  if (!enabled) return false;
  const to = SMTP_USER || SMTP_FROM;
  await transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject: `New analysis request (${subscriber.lang}) - ${subscriber.post_slug || 'general'}`,
    text:
      `A reader requested the full analysis.\n\n` +
      `Email: ${subscriber.email}\nLanguage: ${subscriber.lang}\n` +
      `Article: ${subscriber.post_slug || '(none)'}\nTime: ${new Date().toISOString()}\n`,
  });
  return true;
}

module.exports = { mailerEnabled: enabled, notifyOwner };
