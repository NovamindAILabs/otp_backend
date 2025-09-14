// api/reset.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const { otps } = require('./_shared_otps');
const { users } = require('./_shared_users');

const router = express.Router();
router.use(bodyParser.json());

router.post('/', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) return res.status(400).json({ error: 'email, otp, newPassword required' });

  const record = otps.get(email);
  if (!record) return res.status(400).json({ error: 'no otp requested' });
  if (Date.now() > record.expiresAt) { otps.delete(email); return res.status(400).json({ error: 'otp expired' }); }
  if (record.otp !== otp) return res.status(400).json({ error: 'invalid otp' });

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);
  users.set(email, { passwordHash });
  otps.delete(email);

  return res.json({ ok: true, message: 'password reset successful' });
});

module.exports = router;
