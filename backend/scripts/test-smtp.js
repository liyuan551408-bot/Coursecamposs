/**
 * Diagnose Gmail SMTP configuration without sending an email.
 * Run with: node scripts/test-smtp.js
 */
require('dotenv').config({ override: true });

const nodemailer = require('nodemailer');

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT);
const user = (process.env.SMTP_USER || '').trim();
const pass = process.env.SMTP_PASS || '';
const secure = port === 465;

console.log('SMTP configuration:');
console.log(`- host: ${host || '(missing)'}`);
console.log(`- port: ${process.env.SMTP_PORT || '(missing)'} (secure=${secure})`);
console.log(`- user: ${user ? `${user.slice(0, 2)}***${user.slice(-2)}` : '(missing)'}`);
console.log(`- password: ${pass ? `present (${pass.length} characters)` : '(missing)'}`);

const problems = [];
if (!host) problems.push('SMTP_HOST is missing');
if (!Number.isInteger(port) || port <= 0) problems.push('SMTP_PORT must be a valid number');
if (!user || !/^.+@.+\..+$/.test(user)) problems.push('SMTP_USER must be a complete email address');
if (!pass) problems.push('SMTP_PASS is missing');
if (/your_|password|example/i.test(user) || /your_|password|example/i.test(pass)) problems.push('SMTP credentials still contain placeholder text');
if (/\s/.test(pass)) problems.push('SMTP_PASS contains whitespace; remove spaces from the App Password');
if (port !== 465 && port !== 587) problems.push('Use Gmail SMTP port 465 or 587');

if (problems.length) {
  console.error('\nConfiguration problems:');
  problems.forEach((problem) => console.error(`- ${problem}`));
  process.exitCode = 1;
  return;
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  requireTLS: port === 587,
  auth: { user, pass },
});

transporter.verify()
  .then(() => console.log('\nSMTP_VERIFY_OK: Gmail accepted the SMTP credentials.'))
  .catch((error) => {
    console.error('\nSMTP_VERIFY_FAILED');
    console.error(`- code: ${error.code || 'unknown'}`);
    console.error(`- response code: ${error.responseCode || 'unknown'}`);
    console.error(`- command: ${error.command || 'unknown'}`);
    console.error(`- response: ${(error.response || error.message || '').split('\n')[0]}`);
    if (error.responseCode === 535 || error.code === 'EAUTH') {
      console.error('- meaning: Gmail reached the account but rejected the username/App Password pair.');
    }
    process.exitCode = 1;
  })
  .finally(() => transporter.close());
