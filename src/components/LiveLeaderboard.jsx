import React from 'react';
import { Avatar } from './Avatar';
import { Check } from 'lucide-react';

export const LiveLeaderboard = ({ players, submittedIds = [], roundDeltas = {} }) => {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  const getBorderColor = (index) => {
    if (index === 0) return 'border-yellow-400 shadow-[0_0_10px_orange]';
    if (index === 1) return 'border-slate-300 shadow-[0_0_10px_silver]';
    if (index === 2) return 'border-amber-700 shadow-[0_0_10px_brown]';
    return 'border-transparent opacity-70 scale-90';
  };

  return (
    <div className="w-full bg-slate-900/80 backdrop-blur-md border-b border-white/5 py-2 overflow-x-auto hide-scrollbar z-20 transition-all">
      <div className="flex px-4 gap-4 min-w-max mx-auto justify-center items-end">
        {sortedPlayers.map((p, index) => {
            const isDone = submittedIds.includes(p.id);
            const delta = roundDeltas[p.id];

            return (
              <div key={p.id} id={`player-node-${p.id}`} className="flex flex-col items-center relative group transition-all duration-500 ease-out">
                
                {/* ПРАВКА №2: Имя игрока сверху */}
                <span className="text-[9px] font-bold text-slate-400 mb-1 max-w-[60px] truncate">
                    {p.id === 99 ? 'Вы' : p.name}
                </span>

                {/* Обертка аватарки */}
                <div className="relative">
                    <div className={`rounded-full border-2 p-[2px] transition-all duration-300 ${getBorderColor(index)}`}>
                        <div className={isDone ? "brightness-110" : ""}>
                            <Avatar name={p.name} size="sm" avatarUrl={p.avatar}/>
                        </div>
                    </div>

                    {isDone && (
                        <div className="absolute -bottom-1 -right-1 bg-green-500 text-black rounded-full p-[2px] border-2 border-slate-900 shadow-[0_0_8px_lime] animate-scale-in">
                            <Check size={10} strokeWidth={4} />
                        </div>
                    )}
                </div>

                {/* Счет снизу */}
                <div className="flex items-center gap-1 mt-1">
                    <span className="text-[10px] font-bold text-slate-300">{p.score}</span>
                    {delta !== undefined && delta !== 0 && (
                        <span className={`text-[9px] font-black animate-fade-in-up ${delta > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {delta > 0 ? '+' : ''}{delta}
                        </span>
                    )}
                </div>
              </div>
            );
        })}
      </div>
    </div>
  );
};