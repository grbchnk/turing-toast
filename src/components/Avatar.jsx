import React from 'react';

export const Avatar = ({ name, size = 'md', isAi = false, avatarUrl }) => {
  const sizes = { 
    xs: 'w-5 h-5 text-[8px]', 
    sm: 'w-8 h-8 text-xs', 
    md: 'w-12 h-12 text-sm', 
    lg: 'w-20 h-20 text-xl',
    full: 'w-full h-full text-xs' 
  };

  if (isAi) {
    return (
      <div className={`${sizes[size]} rounded-full overflow-hidden bg-slate-900 border border-purple-500/50`}>
        <img src="./toast-avatar.png" className="w-full h-full object-cover" />
      </div>
    );
  }

  if (avatarUrl) {
    return (
      <div className={`${sizes[size]} rounded-full overflow-hidden border border-white/10`}>
        <img src={avatarUrl} className="w-full h-full object-cover" />
      </div>
    );
  }

  const colors = ['bg-red-500','bg-blue-500','bg-green-500','bg-yellow-500','bg-pink-500','bg-cyan-600'];
  const color = colors[(name?.length || 0) % colors.length];

  return (
    <div className={`${sizes[size]} ${color} rounded-full flex items-center justify-center font-bold text-white`}>
      {name?.slice(0, 2).toUpperCase()}
    </div>
  );
};