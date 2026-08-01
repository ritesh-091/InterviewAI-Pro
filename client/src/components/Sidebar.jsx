import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  FileText, 
  Mic, 
  Code2, 
  MessageSquare, 
  Building2, 
  User, 
  ShieldAlert, 
  CreditCard,
  LogOut,
  Sparkles,
  Users,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const Sidebar = () => {
  const { logout, isAdmin, user } = useAuth();
  const { t } = useLanguage();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const links = [
    { to: '/', label: t('dashboard'), icon: LayoutDashboard },
    { to: '/resume-analyzer', label: t('resumeAnalyzer'), icon: FileText },
    { to: '/mock-interview', label: t('mockInterview'), icon: Mic },
    { to: '/coding-practice', label: t('codingPractice'), icon: Code2 },
    { to: '/career-coach', label: t('careerCoach'), icon: MessageSquare },
    { to: '/company-prep', label: t('companyPrep'), icon: Building2 },
    { to: '/profile', label: t('profile'), icon: User },
  ];

  return (
    <motion.aside 
      animate={{ width: isCollapsed ? 80 : 256 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="border-r border-white/5 bg-brand-darkSec/80 backdrop-blur-xl flex flex-col h-screen sticky top-0 text-brand-textSec z-30 select-none"
    >
      {/* Brand Header */}
      <div className="p-4 flex items-center justify-between border-b border-white/5 h-16 min-h-16">
        {!isCollapsed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3"
          >
            <div className="p-2 rounded-xl bg-brand-indigo/10 border border-brand-indigo/25 text-brand-indigo shadow-[0_0_15px_rgba(99,102,241,0.25)]">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-white leading-none tracking-wide">InterviewAI</h2>
              <span className="text-[9px] text-brand-indigo font-bold uppercase tracking-wider">Pro Suite</span>
            </div>
          </motion.div>
        )}
        
        {isCollapsed && (
          <div className="mx-auto p-2 rounded-xl bg-brand-indigo/10 text-brand-indigo border border-brand-indigo/25">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
        )}

        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg border border-white/5 hover:bg-white/5 text-white transition-colors"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {links.map(link => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 relative group ${
                  isActive
                    ? 'bg-brand-indigo/10 text-brand-indigo border-l-4 border-brand-indigo shadow-[0_0_20px_rgba(99,102,241,0.1)]'
                    : 'hover:bg-white/[0.03] hover:text-white'
                }`
              }
            >
              <Icon className="h-4.5 w-4.5 flex-shrink-0" />
              {!isCollapsed && <span>{link.label}</span>}
              {isCollapsed && (
                <div className="absolute left-16 bg-brand-darkSec border border-white/5 px-2 py-1 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
                  {link.label}
                </div>
              )}
            </NavLink>
          );
        })}

        {/* Recruiter Link if authorized */}
        {(user?.role === 'recruiter' || user?.role === 'admin') && (
          <NavLink
            to="/recruiter"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 relative group border-l-4 border-transparent ${
                isActive
                  ? 'bg-brand-cyan/10 text-brand-cyan border-l-brand-cyan shadow-[0_0_20px_rgba(6,182,212,0.1)]'
                  : 'hover:bg-white/[0.03] hover:text-brand-cyan'
              }`
            }
          >
            <Users className="h-4.5 w-4.5 flex-shrink-0" />
            {!isCollapsed && <span>Recruiter Panel</span>}
            {isCollapsed && (
              <div className="absolute left-16 bg-brand-darkSec border border-white/5 px-2 py-1 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
                Recruiter Panel
              </div>
            )}
          </NavLink>
        )}

        {/* Admin Link if authorized */}
        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 relative group border-l-4 border-transparent ${
                isActive
                  ? 'bg-brand-rose/10 text-brand-rose border-l-brand-rose shadow-[0_0_20px_rgba(239,68,68,0.1)]'
                  : 'hover:bg-white/[0.03] hover:text-brand-rose'
              }`
            }
          >
            <ShieldAlert className="h-4.5 w-4.5 flex-shrink-0" />
            {!isCollapsed && <span>{t('adminPanel')}</span>}
            {isCollapsed && (
              <div className="absolute left-16 bg-brand-darkSec border border-white/5 px-2 py-1 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
                {t('adminPanel')}
              </div>
            )}
          </NavLink>
        )}
      </nav>

      {/* User Status Profile Footer */}
      <div className="p-3 border-t border-white/5 flex flex-col gap-2 bg-white/[0.01]">
        {user && !isCollapsed && (
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="h-8 w-8 rounded-full bg-brand-indigo/20 border border-brand-indigo/30 flex items-center justify-center font-bold text-brand-indigo text-xs">
              {user?.profile?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-white truncate leading-none">{user.profile.name}</p>
            </div>
          </div>
        )}
        
        {user && isCollapsed && (
          <div className="mx-auto h-8 w-8 rounded-full bg-brand-indigo/20 border border-brand-indigo/30 flex items-center justify-center font-bold text-brand-indigo text-xs">
            {user?.profile?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
        
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs font-semibold hover:bg-brand-rose/10 text-brand-rose hover:text-red-400 transition-colors"
        >
          <LogOut className="h-4.5 w-4.5 flex-shrink-0" />
          {!isCollapsed && <span>{t('logout')}</span>}
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
