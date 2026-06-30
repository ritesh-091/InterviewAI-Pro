import React, { createContext, useContext, useState } from 'react';

const translations = {
  en: {
    dashboard: 'Dashboard',
    resumeAnalyzer: 'Resume Analyzer',
    mockInterview: 'AI Mock Interview',
    codingPractice: 'Coding Practice',
    careerCoach: 'AI Career Coach',
    companyPrep: 'Company Prep',
    profile: 'User Profile',
    adminPanel: 'Admin Panel',
    subscriptions: 'Subscriptions',
    welcomeBack: 'Welcome Back',
    streak: 'Daily Streak',
    overallScore: 'Overall Interview Score',
    resumeScore: 'ATS Resume Score',
    recommendations: 'AI Recommendations',
    recentHistory: 'Recent Activity',
    upcomingSchedule: 'Upcoming Prep Schedule',
    performanceAnalytics: 'Performance Analytics',
    logout: 'Logout',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    verifyEmail: 'Verify Email',
    loading: 'Loading...'
  },
  es: {
    dashboard: 'Tablero',
    resumeAnalyzer: 'Analizador de Currículum',
    mockInterview: 'Entrevista de Simulacro',
    codingPractice: 'Práctica de Programación',
    careerCoach: 'Entrenador de Carrera',
    companyPrep: 'Prep de Compañías',
    profile: 'Perfil de Usuario',
    adminPanel: 'Panel de Admin',
    subscriptions: 'Suscripciones',
    welcomeBack: 'Bienvenido de nuevo',
    streak: 'Racha Diaria',
    overallScore: 'Puntuación General',
    resumeScore: 'Puntuación de Currículum ATS',
    recommendations: 'Recomendaciones de IA',
    recentHistory: 'Actividad Reciente',
    upcomingSchedule: 'Horario de Preparación',
    performanceAnalytics: 'Análisis de Rendimiento',
    logout: 'Cerrar Sesión',
    lightMode: 'Modo Claro',
    darkMode: 'Modo Oscuro',
    verifyEmail: 'Verificar Correo',
    loading: 'Cargando...'
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [locale, setLocale] = useState(() => {
    return localStorage.getItem('locale') || 'en';
  });

  const toggleLanguage = () => {
    const nextLocale = locale === 'en' ? 'es' : 'en';
    setLocale(nextLocale);
    localStorage.setItem('locale', nextLocale);
  };

  const t = (key) => {
    return translations[locale][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ locale, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
