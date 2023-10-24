const express = require('express');
const MaterialRoute = require('./routes/material.js');
const BookingRoute = require('./routes/booking.js');
const app = express();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization'
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, PATCH, OPTIONS'
  );
  next();
});

app.use(express.json());

app.use('/api/material', MaterialRoute);
app.use('/api/booking', BookingRoute);
module.exports = app;
