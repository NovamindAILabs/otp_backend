// index.js
require('dotenv').config();
const express = require('express');
const forgot = require('./api/forgot');
const reset = require('./api/reset');
require('./api/_shared_otps'); 
require('./api/_shared_users');

const app = express();
app.use('/api/forgot', forgot);
app.use('/api/reset', reset);

const port = process.env.PORT || 3000;
app.listen(port, ()=>console.log('listening', port));
