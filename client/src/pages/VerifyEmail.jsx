import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import { Mail, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('Verifying your email token, please wait...');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token in URL search parameters.');
      return;
    }

    const verify = async () => {
      try {
        const res = await apiRequest(`/auth/verify-email?token=${token}`);
        setStatus('success');
        setMessage(res.message || 'Your email address has been successfully verified!');
      } catch (err) {
        setStatus('error');
        setMessage(err.message || 'Verification token is invalid or has expired.');
      }
    };
    
    verify();
  }, [searchParams]);

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
        <div className="glass-panel p-8 rounded-[20px] flex flex-col items-center text-center gap-6 border-white/5 bg-brand-card">
          
          <div className="p-3.5 rounded-2xl bg-brand-indigo/10 border border-brand-indigo/25 text-brand-indigo shadow-[0_0_15px_rgba(99,102,241,0.25)]">
            <Mail className="h-8 w-8 animate-pulse" />
          </div>

          <h2 className="text-2xl font-black tracking-tight text-white">Email Verification</h2>

          <div className="text-xs text-brand-textSec leading-relaxed w-full">
            {status === 'verifying' && (
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-indigo"></div>
                <p className="text-brand-textSec">{message}</p>
              </div>
            )}

            {status === 'success' && (
              <div className="flex flex-col items-center gap-4 text-brand-emerald">
                <CheckCircle2 className="h-12 w-12" />
                <p className="text-brand-textSec font-semibold">{message}</p>
                <Link
                  to="/login"
                  className="w-full text-center py-2.5 rounded-xl btn-primary text-xs font-extrabold"
                >
                  Proceed to Login
                </Link>
              </div>
            )}

            {status === 'error' && (
              <div className="flex flex-col items-center gap-4 text-brand-rose">
                <XCircle className="h-12 w-12" />
                <p className="text-brand-textSec font-semibold">{message}</p>
                <Link
                  to="/register"
                  className="w-full text-center py-2.5 rounded-xl btn-secondary text-xs font-bold"
                >
                  Return to Sign Up
                </Link>
              </div>
            )}
          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;

