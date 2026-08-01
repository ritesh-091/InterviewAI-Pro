import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';
import { Sun, Moon, Bell, Languages, CheckCheck, Sparkles, MessageSquare, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const { locale, toggleLanguage, t } = useLanguage();
  const { user } = useAuth();
  
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchNotifications = async () => {
    try {
      const data = await apiRequest('/notifications');
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 45000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const markAllAsRead = async () => {
    try {
      await apiRequest('/notifications/read-all', { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="h-16 border-b border-white/5 bg-brand-dark/40 backdrop-blur-xl sticky top-0 z-40 flex items-center justify-between px-8">
      {/* Brand & Welcome Info */}
      <div className="flex items-center gap-4">
        <h1 className="text-base font-extrabold text-white flex items-center gap-2">
          {t('welcomeBack')}, <span className="text-gradient-ai font-black">{user?.profile?.name || 'User'}</span>
        </h1>
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-5">
        
        {/* Mock Search Input for aesthetic look */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-brand-textSec" />
          <input
            type="text"
            readOnly
            placeholder="Quick search commands..."
            className="w-48 pl-10 pr-4 py-1.5 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-white placeholder-brand-textSec/60 focus:outline-none focus:border-brand-indigo/40 cursor-default transition-all"
          />
        </div>

        {/* Language Selection */}
        <button
          onClick={toggleLanguage}
          title="Switch Language"
          className="px-3 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-white transition-all flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider"
        >
          <Languages className="h-3.5 w-3.5 text-brand-cyan" />
          <span>{locale}</span>
        </button>

        {/* Dark/Light Theme Selection */}
        <button
          onClick={toggleTheme}
          title="Switch Theme"
          className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-white transition-all"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-brand-amber" /> : <Moon className="h-4 w-4 text-brand-indigo" />}
        </button>

        {/* Notifications Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-white transition-all relative flex items-center justify-center"
          >
            <Bell className="h-4 w-4 text-brand-indigo" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-brand-rose ring-2 ring-brand-dark animate-pulse shadow-[0_0_8px_#EF4444]"></span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="absolute right-0 mt-3 w-80 rounded-[20px] border border-white/5 bg-brand-darkSec/95 backdrop-blur-2xl shadow-2xl p-4 flex flex-col gap-3 z-50"
              >
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="font-bold text-xs text-white uppercase tracking-wider">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[10px] text-brand-cyan font-bold hover:text-brand-cyan/85 transition-colors flex items-center gap-1"
                    >
                      <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2 flex-1 pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-[11px] text-brand-textSec text-center py-6">No new notifications.</p>
                  ) : (
                    notifications.map(notif => (
                      <div
                        key={notif._id}
                        className={`p-2.5 rounded-xl border text-[11px] transition-colors leading-relaxed ${
                          notif.isRead
                            ? 'bg-white/[0.01] border-white/5 text-brand-textSec/60'
                            : 'bg-brand-indigo/[0.04] border-brand-indigo/15 text-white'
                        }`}
                      >
                        <p className="font-bold">{notif.title}</p>
                        <p className="text-[10px] text-brand-textSec mt-0.5">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

