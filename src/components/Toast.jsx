import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

export const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 2000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!message) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in-down">
      <div className="glass bg-slate-900/90 px-6 py-3 rounded-full flex items-center gap-3 shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-white/10">
        {type === 'success' ? <CheckCircle size={18} className="text-green-400" /> : <AlertCircle size={18} className="text-red-400" />}
        <span className="text-sm font-bold text-white tracking-wide">{message}</span>
      </div>
    </div>
  );
};