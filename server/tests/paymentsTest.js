const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const { createStripeSession, createRazorpayOrder, verifyRazorpaySignature } = require('../src/services/paymentService');

async function testPayments() {
  console.log('=== RUNNING PAYMENTS GATEWAY VERIFICATION ===\n');

  // 1. Test Stripe Checkout Session
  try {
    console.log('[Test 1/3] Generating Stripe Checkout Session...');
    const session = await createStripeSession('pro', 29, 'test_user_123');
    console.log('✓ Stripe checkout session token generated successfully.');
    console.log(`Session ID: ${session.id} | Redirect URL: ${session.url}\n`);
  } catch (error) {
    console.error('✗ Stripe check failed:', error.message);
  }

  // 2. Test Razorpay Order Creation
  try {
    console.log('[Test 2/3] Generating Razorpay Order...');
    const order = await createRazorpayOrder('premium', 2499, 'test_user_123');
    console.log('✓ Razorpay order structure compiled successfully.');
    console.log(`Order ID: ${order.id} | Currency: ${order.currency} | Amount in Subunits: ${order.amount}\n`);
  } catch (error) {
    console.error('✗ Razorpay order check failed:', error.message);
  }

  // 3. Test Razorpay Signature Verification
  try {
    console.log('[Test 3/3] Verifying Razorpay payment HMAC signature...');
    const orderId = 'mock_order_123';
    const paymentId = 'pay_123';
    const fakeSignature = 'fake_signature_hash';
    const isValid = verifyRazorpaySignature(orderId, paymentId, fakeSignature);
    console.log(`✓ Signature verify helper evaluated: ${isValid ? 'VALID' : 'INVALID'}\n`);
  } catch (error) {
    console.error('✗ Signature verify check failed:', error.message);
  }

  console.log('=== PAYMENTS GATEWAY VERIFICATION COMPLETE ===');
}

testPayments();
