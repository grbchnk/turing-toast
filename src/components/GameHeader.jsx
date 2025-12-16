import React from 'react';
import { TimerBar } from './TimerBar';
import { LiveLeaderboard } from './LiveLeaderboard';

export const GameHeader = ({
    currentRound,
    totalRounds,
    timer,
    maxTime,
    phase,
    players,
    submittedIds,
    roundResults,
    textColor = "text-cyan-400",
    barColor = "bg-cyan-400",
    isReveal = false
}) => {
    return (
        <div className="
            bg-slate-900/90 
            z-20 
            sticky top-0 
            backdrop-blur-md 
            transition-all duration-300 
            border-b border-white/10
            shadow-[0_15px_30px_0px_rgba(0,0,0,0.7)] 
        ">
            <div className="flex justify-between items-center px-6 pt-4 mb-2 min-h-[40px]">
                <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1 rounded-full border border-white/5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Вопрос</span>
                    <span className="text-sm font-black text-cyan-400 font-mono tracking-wider">
                        {currentRound}<span className="text-slate-600">/</span>{totalRounds}
                    </span>
                </div>

                {isReveal ? (
                    <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400 animate-fade-in tracking-widest uppercase">
                        РЕЗУЛЬТАТЫ
                    </span>
                ) : (
                    <span className={`text-xl font-mono font-bold ${timer < 10 ? 'text-red-400 animate-pulse' : textColor}`}>
                        {timer}
                    </span>
                )}
            </div>

            {/* Прогресс-бар скрываем прозрачностью */}
            <div className={`px-6 mb-2 transition-opacity duration-500 ${isReveal ? 'opacity-0' : 'opacity-100'}`}>
                <TimerBar current={timer} total={maxTime} color={barColor} />
            </div>

            <LiveLeaderboard
                players={players}
                submittedIds={['writing', 'voting'].includes(phase) ? submittedIds : []}
                roundDeltas={phase === 'reveal' ? roundResults?.deltas || {} : {}}
            />
        </div>
    );
};