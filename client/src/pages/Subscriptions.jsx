import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import { useNotification } from '../context/NotificationContext';
import { apiRequest } from '../utils/api';
import { Check, ShieldCheck, Sparkles, CreditCard, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Subscriptions = () => {
  const { user, refreshUser } = useAuth();
  const { addToast } = useNotification();
  
  // Modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [paymentStep, setPaymentStep] = useState('input'); // input, processing, success
  const [upgrading, setUpgrading] = useState(null); // pro, premium

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleOpenCheckout = async (plan) => {
    if (plan === 'free') {
      setUpgrading('free');
      try {
        const res = await apiRequest('/subscriptions/checkout', {
          method: 'POST',
          body: JSON.stringify({ plan: 'free' })
        });
        addToast('Subscription Updated', res.message, 'success');
        await refreshUser();
      } catch (err) {
        addToast('Failed to switch', err.message, 'error');
      } finally {
        setUpgrading(null);
      }
      return;
    }

    setUpgrading(plan);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        addToast('Razorpay Load Error', 'Failed to load Razorpay payment gateway script.', 'error');
        return;
      }

      const orderData = await apiRequest('/subscriptions/razorpay/order', {
        method: 'POST',
        body: JSON.stringify({ plan })
      });

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'InterviewAI Pro',
        description: `Upgrade membership to ${plan.toUpperCase()}`,
        order_id: orderData.orderId,
        handler: async function (response) {
          setShowPaymentModal(true);
          setPaymentStep('processing');
          try {
            const verifyRes = await apiRequest('/subscriptions/razorpay/verify', {
              method: 'POST',
              body: JSON.stringify({
                plan,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            setPaymentStep('success');
            addToast('Upgrade Successful', verifyRes.message, 'success');
            await refreshUser();
          } catch (verifyErr) {
            setPaymentStep('input');
            setShowPaymentModal(false);
            addToast('Verification Failed', verifyErr.message, 'error');
          }
        },
        prefill: {
          name: user?.profile?.name || '',
          email: user?.email || ''
        },
        theme: {
          color: '#6366f1'
        },
        modal: {
          ondismiss: function () {
            setUpgrading(null);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      addToast('Order Creation Failed', err.message, 'error');
    } finally {
      setUpgrading(null);
    }
  };

  const tiers = [
    {
      id: 'free',
      name: 'Free Starter',
      price: '$0',
      description: 'Test driving basic interview features.',
      features: [
        '2 AI mock interviews',
        '1 ATS resume optimization scan',
        'Basic performance charts',
        'Standard text-based responses only'
      ]
    },
    {
      id: 'pro',
      name: 'Professional',
      price: '$19',
      sub: '/ month',
      description: 'Accelerate interview preparation with core tools.',
      features: [
        '15 AI mock interviews / mo',
        '10 ATS resume optimizations',
        'Syllabus & company roadmaps access',
        'Speech-to-text response features',
        'Advanced performance analytics'
      ],
      popular: true
    },
    {
      id: 'premium',
      name: 'Premium Expert',
      price: '$49',
      sub: '/ month',
      description: 'Unlimited AI power for advanced preparation.',
      features: [
        'Unlimited AI mock interviews',
        'Unlimited ATS resume optimizations',
        'Full system design & coding compilation',
        'High-quality voice readings (TTS)',
        'Priority AI response processing',
        'Global Leaderboard rankings'
      ]
    }
  ];

  const currentPlan = user?.subscription?.plan || 'free';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Page Header */}
      <div className="border-b border-white/5 pb-4 text-center max-w-xl mx-auto">
        <h2 className="text-2xl font-black text-white flex items-center justify-center gap-2">
          <Sparkles className="h-6 w-6 text-brand-indigo" /> Choose Your Plan
        </h2>
        <p className="text-xs text-brand-textSec mt-2">
          Upgrade to unlock voice-simulated mock rounds, custom corporate modules, and unlimited ATS scanning passes
        </p>
      </div>

      {/* Pricing Sheets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {tiers.map(tier => {
          const isActive = currentPlan.toLowerCase() === tier.id;
          return (
            <GlassCard
              key={tier.id}
              className={`flex flex-col justify-between border-white/5 relative bg-brand-card ${
                tier.popular ? 'border-brand-indigo/50 shadow-xl shadow-brand-indigo/[0.05]' : ''
              }`}
            >
              
              {/* Popular Badge banner */}
              {tier.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-brand-indigo text-white text-[9px] font-black uppercase tracking-wider shadow-lg shadow-brand-indigo/25">
                  Most Popular
                </span>
              )}

              <div className="space-y-4">
                
                {/* Info */}
                <div>
                  <h3 className="font-extrabold text-white text-base">{tier.name}</h3>
                  <p className="text-[11px] text-brand-textSec mt-1 leading-relaxed">{tier.description}</p>
                </div>

                {/* Pricing values */}
                <div className="flex items-baseline gap-1 py-2">
                  <span className="text-3xl font-black text-white font-outfit">{tier.price}</span>
                  {tier.sub && <span className="text-xs text-brand-textSec font-semibold">{tier.sub}</span>}
                </div>

                {/* Features List */}
                <ul className="space-y-3 border-t border-white/5 pt-4 text-xs leading-relaxed text-brand-textSec">
                  {tier.features.map((feat, idx) => (
                    <li key={idx} className="flex gap-2.5 items-start">
                      <Check className="h-4 w-4 text-brand-indigo flex-shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

              </div>

              {/* Action Button */}
              <div className="pt-6">
                {isActive ? (
                  <div className="w-full py-3 rounded-xl border border-brand-emerald/20 bg-brand-emerald/10 text-brand-emerald text-xs font-extrabold flex items-center justify-center gap-1.5">
                    <ShieldCheck className="h-4.5 w-4.5" /> Active Subscription
                  </div>
                ) : (
                  <button
                    onClick={() => handleOpenCheckout(tier.id)}
                    className={`w-full py-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                      tier.popular
                        ? 'btn-primary text-white'
                        : 'btn-secondary text-white'
                    }`}
                  >
                    <CreditCard className="h-4 w-4" />
                    Get {tier.name}
                  </button>
                )}
              </div>

            </GlassCard>
          );
        })}
      </div>

      {/* STRIPE / SECURE PAYMENT PORTAL OVERLAY */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/85 backdrop-blur-md p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-brand-card p-6 rounded-[20px] border border-white/5 flex flex-col gap-5 relative shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            >
              <button
                onClick={() => setShowPaymentModal(false)}
                className="absolute top-4.5 right-4.5 text-brand-textSec hover:text-white text-xs font-bold"
              >
                ✕
              </button>

              {paymentStep === 'input' && (
                <form onSubmit={handleProcessPayment} className="space-y-4">
                  <div className="flex flex-col gap-1 text-center border-b border-white/5 pb-4">
                    <h3 className="text-base font-black text-white flex items-center justify-center gap-1.5">
                      <CreditCard className="h-5 w-5 text-brand-indigo" /> Secure Stripe Gateway
                    </h3>
                    <p className="text-[10px] text-brand-textSec">Upgrading subscription to {selectedPlan?.toUpperCase()} tier</p>
                  </div>

                  <div className="space-y-3.5 text-xs text-brand-textSec leading-relaxed">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-bold text-white">Cardholder Name</label>
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        value={cardName}
                        onChange={e => setCardName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-brand-dark border border-white/5 focus:outline-none focus:border-brand-indigo/40 text-white placeholder-brand-textSec/30"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-bold text-white">Card Number</label>
                      <input
                        type="text"
                        required
                        maxLength={19}
                        placeholder="4111 2222 3333 4444"
                        value={cardNumber}
                        onChange={e => setCardNumber(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-brand-dark border border-white/5 focus:outline-none focus:border-brand-indigo/40 text-white placeholder-brand-textSec/30"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="font-bold text-white">Expiration Date</label>
                        <input
                          type="text"
                          required
                          maxLength={5}
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={e => setCardExpiry(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-brand-dark border border-white/5 focus:outline-none focus:border-brand-indigo/40 text-white placeholder-brand-textSec/30 text-center"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="font-bold text-white">Security Code (CVV)</label>
                        <input
                          type="password"
                          required
                          maxLength={3}
                          placeholder="123"
                          value={cardCvv}
                          onChange={e => setCardCvv(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-brand-dark border border-white/5 focus:outline-none focus:border-brand-indigo/40 text-white placeholder-brand-textSec/30 text-center"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-4 py-3 rounded-xl btn-primary font-extrabold text-xs flex items-center justify-center gap-1.5"
                  >
                    Pay Securely via Stripe
                  </button>
                </form>
              )}

              {paymentStep === 'processing' && (
                <div className="py-12 flex flex-col items-center gap-4 text-center">
                  <RefreshCw className="h-10 w-10 text-brand-indigo animate-spin" />
                  <h3 className="font-bold text-sm text-white">Authorizing Payment...</h3>
                  <p className="text-[10px] text-brand-textSec max-w-xs leading-relaxed">Contacting credit card networks. Do not refresh or exit the page.</p>
                </div>
              )}

              {paymentStep === 'success' && (
                <div className="py-10 flex flex-col items-center gap-5 text-center">
                  <div className="h-14 w-14 rounded-full bg-brand-emerald/10 border border-brand-emerald/30 text-brand-emerald flex items-center justify-center font-bold text-2xl animate-bounce">
                    ✓
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Upgrade Complete!</h3>
                    <p className="text-xs text-brand-textSec mt-1.5 max-w-xs leading-relaxed">Your plan features are now active. Re-routing you back to the main console.</p>
                  </div>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="px-6 py-2.5 rounded-xl btn-primary text-xs font-bold"
                  >
                    Got it
                  </button>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Subscriptions;

