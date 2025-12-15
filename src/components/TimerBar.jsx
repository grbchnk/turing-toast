import React from 'react';

export const TimerBar = ({ current, total, color = 'bg-cyan-400' }) => {
  const percent = (current / total) * 100;
  
  return (
    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
      <div 
        className={`h-full ${color} transition-all duration-1000 ease-linear shadow-[0_0_10px_currentColor]`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
};