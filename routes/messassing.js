const express = require('express');
const router = express.Router();
const messassingCtrl = require('../controllers/messassing');

router.post('/', messassingCtrl.postMessage);

module.exports = router;
