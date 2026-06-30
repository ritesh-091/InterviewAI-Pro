import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Mail, Lock, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, googleAuth } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const success = await login(email, password);
      if (success) navigate('/');
    } catch (err) {
      // AuthContext handles notifications
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleMock = async () => {
    try {
      const mockGoogleUser = {
        email: 'developer.demo@google.com',
        name: 'Demo Engineer',
        googleId: 'g_123456789',
        avatar: ''
      };
      await googleAuth(mockGoogleUser.email, mockGoogleUser.name, mockGoogleUser.googleId, mockGoogleUser.avatar);
      navigate('/');
    } catch (err) {
      console.error(err);
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
        <div className="glass-panel p-8 rounded-[20px] flex flex-col gap-6 relative border-white/5 bg-brand-card">
          
          {/* Header Branding */}
          <div className="text-center flex flex-col items-center gap-2">
            <div className="p-3 rounded-2xl bg-brand-indigo/10 border border-brand-indigo/20 text-brand-indigo shadow-[0_0_15px_rgba(99,102,241,0.25)]">
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white mt-2">InterviewAI <span className="text-gradient-ai">Pro</span></h2>
            <p className="text-xs text-brand-textSec">Sign in to start technical interview simulations</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-brand-textSec uppercase tracking-wider">Password</label>
                <Link to="/forgot-password" className="text-[11px] text-brand-indigo font-bold hover:text-brand-indigo/80">
                  Forgot?
                </Link>
              </div>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl btn-primary text-xs font-extrabold flex items-center justify-center gap-2"
            >
              <LogIn className="h-4 w-4" />
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Social Google Login */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-white/5"></div>
            <span className="flex-shrink mx-4 text-brand-textSec text-[9px] uppercase font-bold tracking-widest">Or Continue With</span>
            <div className="flex-grow border-t border-white/5"></div>
          </div>

          <button
            onClick={handleGoogleMock}
            className="w-full py-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-white text-xs font-bold hover:bg-white/[0.06] flex items-center justify-center gap-2.5 transition-all"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.74 5.74 0 0 1-2.48 3.77v3.13h4.01c2.34-2.16 3.69-5.32 3.69-8.75z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-4.01-3.13c-1.12.75-2.55 1.19-3.95 1.19-3.04 0-5.61-2.05-6.53-4.82H1.31v3.23A12 12 0 0 0 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.47 14.33A7.16 7.16 0 0 1 5.07 12c0-.81.14-1.6.39-2.33V6.44H1.31A12 12 0 0 0 0 12c0 2.29.6 4.45 1.66 6.44l3.81-2.11z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43A11.93 11.93 0 0 0 12 0 12 12 0 0 0 1.31 6.44l4.16 3.23c.92-2.77 3.49-4.82 6.53-4.82z"
              />
            </svg>
            Google Identity Screen
          </button>

          {/* Registration Redirect */}
          <p className="text-center text-xs text-brand-textSec mt-2">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-indigo font-bold hover:text-brand-indigo/80">
              Sign Up
            </Link>
          </p>

        </div>
      </motion.div>
    </div>
  );
};

export default Login;

