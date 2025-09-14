// index.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');

// import routes
const forgotRouter = require('./api/forgot');
const resetRouter = require('./api/reset');

const app = express();
app.use(bodyParser.json());

// --- manual CORS (no extra dependency needed) ---
app.use((req, res, next) => {
  const allowed = [
    'https://novomind.in',   // ✅ your production site
    'http://localhost:3000'  // ✅ local dev (optional, keep if you test locally)
  ];
  const origin = req.headers.origin;
  if (allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  }
  if (req.method === 'OPTIONS') {
    return res.status(204).end(); // preflight quick exit
  }
  next();
});
// --- end CORS ---

// mount routes
app.use('/api/forgot', forgotRouter);
app.use('/api/reset', resetRouter);

// root route
app.get('/', (req, res) => {
  res.send('OTP backend running');
});

// start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on ${port}`);
});
