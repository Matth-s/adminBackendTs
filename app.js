const express = require('express');
const admin = require('firebase-admin');
const { getAppCheck } = require('firebase-admin/app-check');
const helmet = require('helmet');
const app = express();
const cors = require('cors');

const MaterialRoute = require('./routes/material.js');
const BookingRoute = require('./routes/booking.js');

app.use(cors());

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'example.com'],
      styleSrc: ["'self'", 'example.com'],
    },
  })
);

app.use((req, res, next) => {
  res.setHeader(
    'Access-Control-Allow-Origin',
    'https://cheery-mochi-5c1fe8.netlify.app'
  );

  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization, X-Firebase-AppCheck'
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, PATCH, OPTIONS'
  );
  next();
});

const checkTokenApp = async (req, res, next) => {
  const appCheckToken = req.headers['x-firebase-appcheck'];
  const referer = req.headers.origin;

  console.log(referer);

  if (!appCheckToken || !referer) {
    res.status(401);
    return next('Unauthorized');
  }

  if (referer !== 'https://cheery-mochi-5c1fe8.netlify.app') {
    res.status(401);
    return next('Unauthorized');
  }

  try {
    await getAppCheck().verifyToken(appCheckToken);

    return next();
  } catch (err) {
    res.status(401);
    return next('Unauthorized');
  }
};

app.use(express.json());

app.use('/api/material', checkTokenApp, MaterialRoute);
app.use('/api/booking', checkTokenApp, BookingRoute);

module.exports = app;
