// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

const app = express();

// CORS — allow your frontend (change to '*' only for quick testing)
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || "https://novomind.in",
  methods: "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  allowedHeaders: "Content-Type,Authorization",
  credentials: true
}));

app.use(bodyParser.json());

// In-memory OTP store (demo). For production use Supabase/Redis.
const otpStore = {};

// Configure nodemailer transporter from env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

// helper: send mail
async function sendOtpEmail(email, otp) {
  const mail = {
    from: process.env.FROM_EMAIL,
    to: email,
    subject: 'Your OTP',
    text: `Your OTP is ${otp}. It expires in 5 minutes.`
  };
  return transporter.sendMail(mail);
}

// Health
app.get('/', (req, res) => res.send('OTP backend running'));

// POST /api/forgot  -> send OTP
app.post('/api/forgot', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };

  try {
    await sendOtpEmail(email, otp);
    return res.json({ ok: true, message: 'OTP sent' });
  } catch (err) {
    console.error('forgot error', err);
    return res.status(500).json({ error: 'failed to send OTP', details: err.message });
  }
});

// POST /api/reset  -> verify OTP + simulate password update
app.post('/api/reset', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) return res.status(400).json({ error: 'email, otp, newPassword required' });

  const rec = otpStore[email];
  if (!rec || rec.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });
  if (rec.expiresAt < Date.now()) {
    delete otpStore[email];
    return res.status(400).json({ error: 'OTP expired' });
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  console.log(`(demo) password updated for ${email}: ${hashed}`);

  delete otpStore[email];
  return res.json({ ok: true, message: 'Password reset successful' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
