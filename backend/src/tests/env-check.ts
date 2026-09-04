/**
 * LifelineX .env Configuration Validation Script
 * Run with: npx ts-node src/tests/env-check.ts
 */
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import { v2 as cloudinary } from 'cloudinary';

// ─── ANSI Colors ──────────────────────────────────────────────────────────────
const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN   = '\x1b[36m';
const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';

const ok   = (msg: string) => console.log(`  ${GREEN}✔${RESET}  ${msg}`);
const fail = (msg: string) => console.log(`  ${RED}✘${RESET}  ${msg}`);
const warn = (msg: string) => console.log(`  ${YELLOW}⚠${RESET}  ${msg}`);
const info = (msg: string) => console.log(`  ${CYAN}ℹ${RESET}  ${msg}`);
const section = (title: string) =>
  console.log(`\n${BOLD}${CYAN}━━━ ${title} ${'━'.repeat(Math.max(0, 50 - title.length))}${RESET}`);

// ─── Results tracker ──────────────────────────────────────────────────────────
const results: { service: string; status: 'pass' | 'fail' | 'skip'; detail: string }[] = [];

function record(service: string, status: 'pass' | 'fail' | 'skip', detail: string) {
  results.push({ service, status, detail });
}

// ─── 1. Static .env Presence Check ───────────────────────────────────────────
section('1. ENV VARIABLE PRESENCE');

const requiredKeys: Record<string, string> = {
  NODE_ENV: process.env.NODE_ENV || '',
  PORT: process.env.PORT || '',
  MONGODB_URI: process.env.MONGODB_URI || '',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || '',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || '',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || '',
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: process.env.SMTP_PORT || '',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || '',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
};

const placeholders = ['your_', 'your-', 'xxx', 'changeme', 'placeholder'];

for (const [key, value] of Object.entries(requiredKeys)) {
  if (!value || value.trim() === '') {
    fail(`${key} is MISSING or EMPTY`);
    record(key, 'fail', 'Missing or empty');
  } else if (placeholders.some(p => value.toLowerCase().startsWith(p))) {
    warn(`${key} looks like a placeholder: "${value.substring(0, 30)}..."`);
    record(key, 'fail', 'Placeholder value');
  } else {
    ok(`${key} is set`);
    record(key, 'pass', 'Present');
  }
}

// ─── 2. JWT Secret Strength ───────────────────────────────────────────────────
section('2. JWT SECRET STRENGTH');
const accessSecret = process.env.JWT_ACCESS_SECRET || '';
const refreshSecret = process.env.JWT_REFRESH_SECRET || '';

if (accessSecret.length >= 64) {
  ok(`JWT_ACCESS_SECRET length: ${accessSecret.length} chars (strong)`);
  record('JWT_ACCESS_SECRET strength', 'pass', `${accessSecret.length} chars`);
} else {
  fail(`JWT_ACCESS_SECRET too short: ${accessSecret.length} chars (need ≥ 64)`);
  record('JWT_ACCESS_SECRET strength', 'fail', `Only ${accessSecret.length} chars`);
}

if (refreshSecret.length >= 64) {
  ok(`JWT_REFRESH_SECRET length: ${refreshSecret.length} chars (strong)`);
  record('JWT_REFRESH_SECRET strength', 'pass', `${refreshSecret.length} chars`);
} else {
  fail(`JWT_REFRESH_SECRET too short: ${refreshSecret.length} chars (need ≥ 64)`);
  record('JWT_REFRESH_SECRET strength', 'fail', `Only ${refreshSecret.length} chars`);
}

// ─── 3. SMTP User Fix Check ───────────────────────────────────────────────────
section('3. SMTP CONFIG SANITY CHECK');
const smtpUser = process.env.SMTP_USER || '';
const smtpPass = process.env.SMTP_PASS || '';
const emailFrom = process.env.EMAIL_FROM || '';

if (smtpUser.startsWith('your_')) {
  fail(`SMTP_USER contains "your_" prefix: "${smtpUser}" — this is WRONG. Should be just: ragultr07@gmail.com`);
  record('SMTP_USER format', 'fail', 'Has "your_" prefix');
} else {
  ok(`SMTP_USER looks correct: ${smtpUser}`);
  record('SMTP_USER format', 'pass', 'OK');
}

// Gmail app password format: 4 groups of 4 chars separated by spaces
const appPassPattern = /^[a-z]{4} [a-z]{4} [a-z]{4} [a-z]{4}$/;
if (appPassPattern.test(smtpPass.trim())) {
  ok(`SMTP_PASS matches Gmail App Password format (4x4 groups)`);
  record('SMTP_PASS format', 'pass', 'Gmail app password format');
} else {
  warn(`SMTP_PASS doesn't match standard Gmail App Password format (expected: xxxx xxxx xxxx xxxx). Got: "${smtpPass}"`);
  record('SMTP_PASS format', 'fail', 'Not matching Gmail app password pattern');
}

if (emailFrom.includes('<') && emailFrom.includes('>')) {
  ok(`EMAIL_FROM has correct format: ${emailFrom}`);
  record('EMAIL_FROM format', 'pass', 'OK');
} else {
  warn(`EMAIL_FROM format may be off: ${emailFrom}`);
  record('EMAIL_FROM format', 'fail', 'Missing angle bracket format');
}

// ─── 4. Razorpay Key Patterns ─────────────────────────────────────────────────
section('4. RAZORPAY KEY PATTERNS');
const rpKeyId = process.env.RAZORPAY_KEY_ID || '';
const rpKeySecret = process.env.RAZORPAY_KEY_SECRET || '';

if (rpKeyId.startsWith('rzp_test_') || rpKeyId.startsWith('rzp_live_')) {
  ok(`RAZORPAY_KEY_ID pattern valid: ${rpKeyId}`);
  record('RAZORPAY_KEY_ID', 'pass', rpKeyId.startsWith('rzp_test_') ? 'Test mode' : 'Live mode');
  if (rpKeyId.startsWith('rzp_test_')) info('  → Running in Razorpay TEST mode');
} else {
  fail(`RAZORPAY_KEY_ID format invalid. Expected rzp_test_... or rzp_live_... Got: ${rpKeyId}`);
  record('RAZORPAY_KEY_ID', 'fail', 'Invalid format');
}

if (rpKeySecret.length > 10) {
  ok(`RAZORPAY_KEY_SECRET is set (length: ${rpKeySecret.length})`);
  record('RAZORPAY_KEY_SECRET', 'pass', 'Present');
} else {
  fail(`RAZORPAY_KEY_SECRET seems too short or missing`);
  record('RAZORPAY_KEY_SECRET', 'fail', 'Too short');
}

// ─── 5. Gemini API Key Pattern ────────────────────────────────────────────────
section('5. GEMINI API KEY');
const geminiKey = process.env.GEMINI_API_KEY || '';
// Standard Gemini keys start with "AIza" (39 chars). Some new ones may differ.
if (geminiKey.startsWith('AIza') && geminiKey.length >= 39) {
  ok(`GEMINI_API_KEY matches standard Google API key format`);
  record('GEMINI_API_KEY', 'pass', 'Valid format');
} else {
  warn(`GEMINI_API_KEY format may be wrong. Standard keys start with "AIza" and are 39 chars. Got: "${geminiKey.substring(0, 20)}..." (${geminiKey.length} chars)`);
  record('GEMINI_API_KEY', 'fail', 'Unexpected format — double-check in Google AI Studio');
}

// ─── 6. Google OAuth ──────────────────────────────────────────────────────────
section('6. GOOGLE OAUTH');
const gClientId = process.env.GOOGLE_CLIENT_ID || '';
const gClientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
const gCallbackUrl = process.env.GOOGLE_CALLBACK_URL || '';

if (gClientId.endsWith('.apps.googleusercontent.com')) {
  ok(`GOOGLE_CLIENT_ID format valid`);
  record('GOOGLE_CLIENT_ID', 'pass', 'Valid format');
} else {
  fail(`GOOGLE_CLIENT_ID should end with ".apps.googleusercontent.com". Got: ${gClientId}`);
  record('GOOGLE_CLIENT_ID', 'fail', 'Invalid format');
}

if (gClientSecret.startsWith('GOCSPX-')) {
  ok(`GOOGLE_CLIENT_SECRET format valid`);
  record('GOOGLE_CLIENT_SECRET', 'pass', 'Valid format');
} else {
  warn(`GOOGLE_CLIENT_SECRET doesn't start with "GOCSPX-". May be wrong. Got: ${gClientSecret.substring(0, 10)}...`);
  record('GOOGLE_CLIENT_SECRET', 'fail', 'Unexpected format');
}

if (gCallbackUrl.includes('/auth/google/callback')) {
  ok(`GOOGLE_CALLBACK_URL looks correct: ${gCallbackUrl}`);
  record('GOOGLE_CALLBACK_URL', 'pass', 'OK');
} else {
  warn(`GOOGLE_CALLBACK_URL may be wrong: ${gCallbackUrl}`);
  record('GOOGLE_CALLBACK_URL', 'fail', 'Unexpected format');
}

// ─── 7. Live Connectivity Tests ───────────────────────────────────────────────
async function runLiveTests() {
  section('7. LIVE CONNECTIVITY TESTS');
  console.log('  (These make real network calls — may take a few seconds)\n');

  // ── 7a. MongoDB ──────────────────────────────────────────────────────────────
  const mongoUri = process.env.MONGODB_URI || '';
  process.stdout.write(`  ${CYAN}Testing MongoDB connection...${RESET} `);
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
    console.log(`${GREEN}✔ Connected${RESET}`);
    ok(`MongoDB host: ${mongoose.connection.host}`);
    record('MongoDB', 'pass', `Connected to ${mongoose.connection.host}`);
    await mongoose.disconnect();
  } catch (err: any) {
    console.log(`${RED}✘ Failed${RESET}`);
    fail(`MongoDB error: ${err.message}`);
    record('MongoDB', 'fail', err.message);
  }

  // ── 7b. SMTP / Nodemailer ────────────────────────────────────────────────────
  process.stdout.write(`\n  ${CYAN}Testing SMTP (nodemailer verify)...${RESET} `);
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });
    await transporter.verify();
    console.log(`${GREEN}✔ SMTP OK${RESET}`);
    record('SMTP', 'pass', 'Connection verified');
  } catch (err: any) {
    console.log(`${RED}✘ Failed${RESET}`);
    fail(`SMTP error: ${err.message}`);
    record('SMTP', 'fail', err.message);
  }

  // ── 7c. Cloudinary ───────────────────────────────────────────────────────────
  process.stdout.write(`\n  ${CYAN}Testing Cloudinary ping...${RESET} `);
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    const result = await cloudinary.api.ping();
    if (result.status === 'ok') {
      console.log(`${GREEN}✔ Cloudinary OK${RESET}`);
      record('Cloudinary', 'pass', 'Ping successful');
    } else {
      console.log(`${YELLOW}⚠ Unexpected response${RESET}`);
      record('Cloudinary', 'fail', JSON.stringify(result));
    }
  } catch (err: any) {
    console.log(`${RED}✘ Failed${RESET}`);
    fail(`Cloudinary error: ${err.message}`);
    record('Cloudinary', 'fail', err.message);
  }

  // ── 7d. Razorpay ─────────────────────────────────────────────────────────────
  process.stdout.write(`\n  ${CYAN}Testing Razorpay credentials...${RESET} `);
  try {
    const Razorpay = require('razorpay');
    const rzp = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    // Fetch orders with 0 limit — cheapest call that validates credentials
    await rzp.orders.all({ count: 1 });
    console.log(`${GREEN}✔ Razorpay credentials valid${RESET}`);
    record('Razorpay', 'pass', 'Credentials accepted');
  } catch (err: any) {
    console.log(`${RED}✘ Failed${RESET}`);
    fail(`Razorpay error: ${err.message}`);
    record('Razorpay', 'fail', err.message);
  }

  // ── 7e. Gemini AI ────────────────────────────────────────────────────────────
  process.stdout.write(`\n  ${CYAN}Testing Gemini AI API key...${RESET} `);
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('Reply with exactly: OK');
    const text = result.response.text();
    if (text) {
      console.log(`${GREEN}✔ Gemini responded: "${text.trim().substring(0, 30)}"${RESET}`);
      record('Gemini AI', 'pass', 'API call successful');
    }
  } catch (err: any) {
    console.log(`${RED}✘ Failed${RESET}`);
    fail(`Gemini error: ${err.message}`);
    record('Gemini AI', 'fail', err.message);
  }

  // ─── Summary ─────────────────────────────────────────────────────────────────
  section('SUMMARY');
  const passes = results.filter(r => r.status === 'pass').length;
  const fails  = results.filter(r => r.status === 'fail').length;
  const skips  = results.filter(r => r.status === 'skip').length;

  console.log(`\n  Total checks : ${results.length}`);
  console.log(`  ${GREEN}✔ Passed${RESET}  : ${passes}`);
  console.log(`  ${RED}✘ Failed${RESET}  : ${fails}`);
  console.log(`  ${YELLOW}⚠ Skipped${RESET} : ${skips}`);

  if (fails > 0) {
    console.log(`\n${RED}${BOLD}  Issues found:${RESET}`);
    results
      .filter(r => r.status === 'fail')
      .forEach(r => console.log(`  ${RED}✘${RESET} ${r.service}: ${r.detail}`));
  } else {
    console.log(`\n${GREEN}${BOLD}  All configured services passed! 🎉${RESET}`);
  }
  console.log('');
}

runLiveTests().catch(console.error);
