const stripe = require('stripe');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Stripe if credential exists
let stripeClient = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripeClient = stripe(process.env.STRIPE_SECRET_KEY);
  console.log('Stripe Payment Gateway successfully configured.');
}

// Initialize Razorpay if credential exists
let razorpayClient = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpayClient = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
  console.log('Razorpay Payment Gateway successfully configured.');
}

/**
 * Creates a Stripe checkout session for Pro/Premium plan upgrades
 */
const createStripeSession = async (plan, priceAmount, userId) => {
  if (!stripeClient) {
    // Return simulated details if Stripe is not active
    return {
      id: `mock_stripe_session_${Date.now()}`,
      url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/subscriptions?success=true`
    };
  }

  try {
    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `InterviewAI Pro - ${plan.toUpperCase()} Plan`,
              description: `30-day access to ${plan} membership features.`
            },
            unit_amount: priceAmount * 100 // Amount in cents
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/subscriptions?success=true`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/subscriptions?cancel=true`,
      metadata: { userId, plan }
    });
    return session;
  } catch (error) {
    console.error('Stripe session creation failed:', error);
    throw new Error('Payment gateway error: ' + error.message);
  }
};

/**
 * Creates a Razorpay Order
 */
const createRazorpayOrder = async (plan, priceAmountInINR, userId) => {
  if (!razorpayClient) {
    // Return simulated details if Razorpay is not active
    return {
      id: `mock_razorpay_order_${Date.now()}`,
      amount: priceAmountInINR * 100,
      currency: 'INR',
      receipt: `receipt_${userId}_${Date.now()}`
    };
  }

  try {
    const options = {
      amount: priceAmountInINR * 100, // Amount in paise
      currency: 'INR',
      receipt: `receipt_${userId}_${Date.now()}`,
      notes: { userId, plan }
    };
    const order = await razorpayClient.orders.create(options);
    return order;
  } catch (error) {
    console.error('Razorpay order creation failed:', error);
    throw new Error('Payment gateway error: ' + error.message);
  }
};

/**
 * Verifies Razorpay payment signatures (SHA256 HMAC)
 */
const verifyRazorpaySignature = (orderId, paymentId, signature) => {
  if (!process.env.RAZORPAY_KEY_SECRET) {
    // If running in development fallback simulator, verify automatically
    return true;
  }

  try {
    const text = orderId + '|' + paymentId;
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    return generated_signature === signature;
  } catch (error) {
    console.error('Razorpay signature verification error:', error);
    return false;
  }
};

module.exports = {
  createStripeSession,
  createRazorpayOrder,
  verifyRazorpaySignature
};
