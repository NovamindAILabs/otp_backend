// api/reset.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();
router.use(bodyParser.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

router.post('/', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return res.status(400).json({ error: 'email, otp, newPassword required' });
  }

  // 1. find otp row
  const { data: otpRows, error: otpError } = await supabase
    .from('OTPs')
    .select('*')
    .eq('email', email)
    .eq('used', false)
    .order('created_at', { ascending: false })
    .limit(1);

  if (otpError) return res.status(500).json({ error: 'DB error', details: otpError.message });
  if (!otpRows || otpRows.length === 0) return res.status(400).json({ error: 'no otp requested' });

  const row = otpRows[0];
  if (row.otp !== otp) return res.status(400).json({ error: 'invalid otp' });
  if (new Date(row.expires_at).getTime() < Date.now()) return res.status(400).json({ error: 'otp expired' });

  // 2. update user password
  const { data: userData, error: userError } = await supabase.auth.admin.updateUserByEmail(email, {
    password: newPassword,
  });
  if (userError) return res.status(500).json({ error: 'failed to update password', details: userError.message });

  // 3. mark otp as used
  await supabase.from('OTPs').update({ used: true }).eq('id', row.id);

  return res.json({ ok: true, message: 'Password reset successful' });
});

module.exports = router;
