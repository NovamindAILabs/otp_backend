const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

const app = express();

// ✅ CORS setup
app.use(cors({
  origin: "https://novomind.in", // allow your frontend domain
  methods: "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  allowedHeaders: "Content-Type,Authorization",
  credentials: true
}));

app.use(bodyParser.json());

// ================= OTP Logic =================

// temporary OTP store (in memory for now)
let otpStore = {};

// transporter (replace with your SMTP config)
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// send OTP by email
async function sendOtpEmail(email, otp) {
  const mail = {
    from: process.env.FROM_EMAIL,
    to: email,
    subject: "Your OTP",
    text: `Your OTP is ${otp}. It expires in 5 minutes.`
  };
  await transporter.sendMail(mail);
}

// STEP 1: forgot password → generate + send OTP
app.post('/api/forgot', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = { otp, expires: Date.now() + 5*60*1000 };

  try {
    await sendOtpEmail(email, otp);
    res.json({ ok: true, message: 'OTP sent' });
  } catch (err) {
    console.error("sendOtp error:", err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// STEP 2: reset password → verify OTP + update password
app.post('/api/reset', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return res.status(400).json({ error: 'email, otp, newPassword required' });
  }

  const record = otpStore[email];
  if (!record || record.otp !== otp || record.expires < Date.now()) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  console.log(`Password updated for ${email}: ${hashed}`);

  delete otpStore[email];
  res.json({ ok: true, message: 'Password reset successful' });
});

// ================= Health check =================
app.get("/", (req, res) => {
  res.send("OTP backend running");
});

// ================= Start server =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
