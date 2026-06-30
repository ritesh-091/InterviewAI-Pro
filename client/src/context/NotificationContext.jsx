import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((title, message, type = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, title, message, type }]);

    // Automatically remove toast after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ addToast, removeToast, toasts }}>
      {children}
      
      {/* Dynamic Floating Toast Container */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 w-full max-w-sm">
        {toasts.map(toast => (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className={`p-4 rounded-xl border glass-panel shadow-lg flex flex-col cursor-pointer transition-all duration-300 transform translate-x-0 hover:scale-[1.02] border-l-4 ${
              toast.type === 'success' ? 'border-l-teal-500 border-teal-500/20' :
              toast.type === 'error' ? 'border-l-rose-500 border-rose-500/20' :
              toast.type === 'warning' ? 'border-l-amber-500 border-amber-500/20' :
              'border-l-cyan-500 border-cyan-500/20'
            }`}
          >
            <div className="flex justify-between items-start">
              <h4 className="font-bold text-sm text-slate-100">{toast.title}</h4>
              <span className="text-xs text-slate-400 font-bold hover:text-slate-100">✕</span>
            </div>
            <p className="text-xs text-slate-300 mt-1">{toast.message}</p>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
