import React from 'react';

export const Button = ({ children, onClick, variant = 'primary', disabled = false, className = '' }) => {
  // Неоновые стили
  const variants = {
    primary: "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-400/30",
    secondary: "bg-slate-800/80 border border-slate-600 text-slate-300 hover:bg-slate-700",
    danger: "bg-red-500/10 text-red-400 border border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]",
    neon: "bg-transparent border-2 border-purple-500 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.4)] hover:bg-purple-500/10"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`w-full py-4 px-6 rounded-full font-bold tracking-wide transition-all active:scale-95 disabled:opacity-50 disabled:grayscale ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};