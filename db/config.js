const admin = require("firebase-admin");
const dotenv = require("dotenv");
const { config } = require("../firebaseAdminConf");

dotenv.config();

admin.initializeApp({
  credential: admin.credential.cert(config),
  databaseURL: process.env.FIREBASE_DATA_BASE_URL_HTTP,
});

module.exports = admin;
