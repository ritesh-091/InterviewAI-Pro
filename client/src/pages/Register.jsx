import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, User, Mail, Lock, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const success = await register(email, password, name);
      if (success) navigate('/');
    } catch (err) {
      // AuthContext handles toast warnings
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
        <div className="glass-panel p-8 rounded-[20px] flex flex-col gap-6 relative border-white/5 bg-brand-card">
          
          {/* Header Branding */}
          <div className="text-center flex flex-col items-center gap-2">
            <div className="p-3 rounded-2xl bg-brand-indigo/10 border border-brand-indigo/20 text-brand-indigo shadow-[0_0_15px_rgba(99,102,241,0.25)]">
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white mt-2">Create <span className="text-gradient-ai">Account</span></h2>
            <p className="text-xs text-brand-textSec">Join InterviewAI Pro to accelerate your technical skills</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-brand-textSec uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-textSec">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-white placeholder-brand-textSec/40 focus:outline-none focus:border-brand-indigo/40 transition-colors"
                />
              </div>
            </div>

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
              <label className="text-[10px] font-bold text-brand-textSec uppercase tracking-wider">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-textSec">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-white placeholder-brand-textSec/40 focus:outline-none focus:border-brand-indigo/40 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 rounded-xl btn-primary text-xs font-extrabold flex items-center justify-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          {/* Login Redirect */}
          <p className="text-center text-xs text-brand-textSec mt-2">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-indigo font-bold hover:text-brand-indigo/80">
              Sign In
            </Link>
          </p>

        </div>
      </motion.div>
    </div>
  );
};

export default Register;

