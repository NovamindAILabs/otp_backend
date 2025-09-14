// smtp-test.js
require('dotenv').config();
const nodemailer = require('nodemailer');

(async ()=>{
  const t = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT||587),
    secure: Number(process.env.SMTP_PORT)==465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    logger: true, debug: true
  });

  try {
    const info = await t.sendMail({
      from: process.env.FROM_EMAIL,
      to: process.env.FROM_EMAIL,
      subject: 'SMTP test',
      text: 'smtp test'
    });
    console.log('SENT', info);
  } catch (e) {
    console.error('ERR', e);
  }
})();
