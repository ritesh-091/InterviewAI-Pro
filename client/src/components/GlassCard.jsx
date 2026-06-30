import React from 'react';
import { motion } from 'framer-motion';

const GlassCard = ({ children, className = '', hoverable = false, onClick }) => {
  return (
    <motion.div
      onClick={onClick}
      whileHover={hoverable ? { y: -4, scale: 1.01, borderColor: 'rgba(99, 102, 241, 0.35)' } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`glass-panel p-6 rounded-[20px] transition-all duration-350 ${
        hoverable ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;

