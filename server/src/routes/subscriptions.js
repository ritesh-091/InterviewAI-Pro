const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { checkoutSubscription, createOrder, verifyPayment } = require('../controllers/subscriptionController');

router.post('/checkout', protect, checkoutSubscription);
router.post('/razorpay/order', protect, createOrder);
router.post('/razorpay/verify', protect, verifyPayment);

module.exports = router;
