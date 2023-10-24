const express = require('express');
const router = express.Router();
const bookingCtrl = require('../controllers/booking');

router.get('/', bookingCtrl.getAllData);
router.get('/:id', bookingCtrl.getDataById);
router.get('/unavailableDates/:id', bookingCtrl.getUnavailableDates);
router.put('/:id', bookingCtrl.updateBooking);
router.put('/markAsPaid/:id', bookingCtrl.markAsPaid);
router.post('/', bookingCtrl.createBooking);
router.delete('/:id', bookingCtrl.deleteBookingById);

module.exports = router;
