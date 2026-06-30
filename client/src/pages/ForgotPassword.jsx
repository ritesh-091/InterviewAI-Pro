import React, { useState } from 'react';
import { apiRequest } from '../utils/api';
import { useNotification } from '../context/NotificationContext';
import { Mail, ArrowLeft, Send, Lock } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';

const ForgotPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { addToast } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (token) {
        if (password !== confirmPassword) {
          addToast('Validation Error', 'Passwords do not match.', 'warning');
          setLoading(false);
          return;
        }
        const res = await apiRequest('/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({ token, password })
        });
        setSuccess(true);
        addToast('Password Reset Complete', res.message, 'success');
      } else {
        const res = await apiRequest('/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email })
        });
        setSuccess(true);
        addToast('Reset Email Dispatched', res.message, 'success');
      }
    } catch (err) {
      addToast('Request Failed', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark p-4 relative overflow-hidden bg-mesh-grid">
      {/* Background Neon Glowing Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-brand-indigo/10 glow-orb animate-float-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-purple/10 glow-orb animate-float-medium" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md z-10"
      >
        <div className="glass-panel p-8 rounded-[20px] flex flex-col gap-6 border-white/5 bg-brand-card">
          
          <div className="flex items-center gap-2">
            <Link to="/login" className="p-2 rounded-xl hover:bg-white/[0.05] border border-transparent hover:border-white/5 text-brand-textSec hover:text-white transition-all">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h2 className="text-lg font-black tracking-tight text-white">
              {token ? 'Reset Password' : 'Recovery Password'}
            </h2>
          </div>

          {success ? (
            <div className="text-center space-y-4">
              <p className="text-xs text-brand-textSec leading-relaxed">
                {token 
                  ? 'Your password has been successfully reset. You can now login with your new credentials.' 
                  : 'A password reset instructions email has been sent successfully. Check your email or check the server console logs for recovery parameters.'}
              </p>
              <Link
                to="/login"
                className="w-full inline-block text-center py-2.5 rounded-xl btn-primary text-xs font-extrabold"
              >
                Return to Login
              </Link>
            </div>
          ) : token ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-brand-textSec leading-relaxed">
                Provide a new password for your account below.
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-brand-textSec uppercase tracking-wider">New Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-textSec">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-white placeholder-brand-textSec/40 focus:outline-none focus:border-brand-indigo/40 transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-brand-textSec uppercase tracking-wider">Confirm New Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-textSec">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-white placeholder-brand-textSec/40 focus:outline-none focus:border-brand-indigo/40 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl btn-primary text-xs font-extrabold flex items-center justify-center gap-2"
              >
                <Send className="h-4 w-4" />
                {loading ? 'Updating Credentials...' : 'Save New Password'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-brand-textSec leading-relaxed">
                Provide your registered email address and we will dispatch a password recovery link.
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-brand-textSec uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-textSec">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-white placeholder-brand-textSec/40 focus:outline-none focus:border-brand-indigo/40 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl btn-primary text-xs font-extrabold flex items-center justify-center gap-2"
              >
                <Send className="h-4 w-4" />
                {loading ? 'Sending Recovery...' : 'Send Recovery Link'}
              </button>
            </form>
          )}

        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;

