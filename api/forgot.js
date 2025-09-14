// api/forgot.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const { otps } = require('./_shared_otps');

const router = express.Router();
router.use(bodyParser.json());

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  logger: true, debug: true
});

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

router.post('/', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });

  const otp = generateOtp();
  const expiresAt = Date.now() + 5 * 60 * 1000;
  otps.set(email, { otp, expiresAt });

  const mail = {
    from: process.env.FROM_EMAIL,
    to: email,
    subject: 'Your OTP',
    text: `Your OTP is ${otp}. It expires in 5 minutes.`
  };

  try {
    await transporter.sendMail(mail);
    return res.json({ ok: true, message: 'OTP sent' });
  } catch (err) {
    console.error('forgot error', err);
    return res.status(500).json({ error: 'failed to send OTP', details: err.message });
  }
});

module.exports = router;
