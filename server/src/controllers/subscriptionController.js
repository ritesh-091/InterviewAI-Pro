const User = require('../models/User');
const Notification = require('../models/Notification');
const { createRazorpayOrder, verifyRazorpaySignature } = require('../services/paymentService');

// Prices in INR for Razorpay Checkout
const PLAN_PRICES = {
  pro: 1499,
  premium: 3999
};

// 1. Create a Razorpay Order
const createOrder = async (req, res, next) => {
  try {
    const { plan } = req.body;
    if (!plan || !['pro', 'premium'].includes(plan.toLowerCase())) {
      return res.status(400).json({ message: 'A valid pro or premium plan tier is required' });
    }

    const price = PLAN_PRICES[plan.toLowerCase()];
    const order = await createRazorpayOrder(plan, price, req.user._id);

    res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID || 'mock_razorpay_key_id'
    });
  } catch (error) {
    next(error);
  }
};

// 2. Verify Razorpay Payment and Upgrade Plan
const verifyPayment = async (req, res, next) => {
  try {
    const { plan, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!plan || !razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ message: 'Order ID, payment ID, and target plan are required' });
    }

    // Verify cryptographic signature
    const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid payment signature. Authority check failed.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const planLower = plan.toLowerCase();

    // 30 days active access
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    user.subscription.plan = planLower;
    user.subscription.status = 'active';
    user.subscription.expiresAt = expiresAt;
    await user.save();

    // Notify user
    await Notification.create({
      userId: user._id,
      title: 'Upgrade Successful!',
      message: `Your payment was successfully verified. Welcome to ${plan.toUpperCase()}!`,
      type: 'success'
    });

    res.status(200).json({
      message: `Successfully verified signature and upgraded subscription to ${planLower}`,
      subscription: user.subscription
    });
  } catch (error) {
    next(error);
  }
};

// 3. Checkout / Upgrade Subscription (Billing Simulator Fallback)
const checkoutSubscription = async (req, res, next) => {
  try {
    const { plan } = req.body; // pro, premium, free
    if (!plan || !['free', 'pro', 'premium'].includes(plan.toLowerCase())) {
      return res.status(400).json({ message: 'A valid target subscription plan tier is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const planLower = plan.toLowerCase();

    // Setup active subscription expiry (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    user.subscription.plan = planLower;
    user.subscription.status = planLower === 'free' ? 'none' : 'active';
    user.subscription.expiresAt = planLower === 'free' ? null : expiresAt;
    await user.save();

    // Create success alert notification
    await Notification.create({
      userId: user._id,
      title: 'Subscription Upgraded!',
      message: `Your account has successfully been transitioned to the ${plan.toUpperCase()} plan. Thank you for using InterviewAI Pro!`,
      type: 'success'
    });

    res.status(200).json({
      message: `Successfully updated subscription to ${planLower}`,
      subscription: user.subscription
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  checkoutSubscription
};
