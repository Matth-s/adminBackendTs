const express = require('express');
const router = express.Router();
const messagingCtrl = require('../controllers/messaging');

router.post('/', messagingCtrl.postMessage);
router.post('/create', messagingCtrl.createBooking);
router.get('/', messagingCtrl.getAllMessage);
router.get('/:id', messagingCtrl.getMessageById);
router.put('/:id', messagingCtrl.changeStatus);
router.delete('/:id', messagingCtrl.deleteMessage);

module.exports = router;
