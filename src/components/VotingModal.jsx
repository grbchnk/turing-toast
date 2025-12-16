import React from 'react';
import { Avatar } from './Avatar';
import { X } from 'lucide-react';
import { playSound } from '../utils/sounds';

export const VotingModal = ({
    isOpen,
    selectedAnswerId,
    selectedAnswerText,
    guesses,
    players,
    myId,
    onVote,     // Функция handleSelectVote
    onClose     // Функция закрытия (setSelectedAnswerId(null))
}) => {
    if (!isOpen || !selectedAnswerId) return null;

    return (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-6 pointer-events-none">
            <div className="w-full max-w-sm pointer-events-auto animate-enter">
                <div className="glass-panel backdrop-blur-xl rounded-3xl p-4 mb-6 flex items-center justify-start gap-3 overflow-x-auto hide-scrollbar border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
                    
                    {/* Кнопка AI */}
                    <button
                        onClick={() => onVote(selectedAnswerId, 'ai')}
                        className={`flex flex-col items-center min-w-[64px] gap-2 transition-all duration-300 group
                        ${guesses[selectedAnswerId]?.type === 'ai' ? 'scale-110 opacity-100' : 'opacity-60 hover:opacity-100'}`}
                    >
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all 
                            ${guesses[selectedAnswerId]?.type === 'ai'
                                ? 'bg-purple-600 border-white shadow-[0_0_25px_purple]'
                                : 'bg-slate-800 border-slate-600 group-hover:border-purple-400'}`}
                        >
                            <Avatar isAi={true} size="md" />
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${guesses[selectedAnswerId]?.type === 'ai' ? 'text-purple-300' : 'text-slate-500'}`}>Bot</span>
                    </button>

                    <div className="w-[1px] h-10 bg-white/10 mx-2"></div>

                    {/* Кнопки игроков */}
                    {players.filter(p => p.id !== myId).map(p => {
                        const isVotedHere = guesses[selectedAnswerId]?.playerId === p.id;
                        // Проверяем, использован ли этот игрок в голосовании за ДРУГУЮ карточку
                        const isUsedElsewhere = !isVotedHere && Object.values(guesses).some(g => g.playerId === p.id && g.type === 'human');
                        
                        return (
                            <button
                                key={p.id}
                                onClick={() => onVote(selectedAnswerId, 'human', p.id)}
                                className={`flex flex-col items-center min-w-[64px] gap-2 transition-all duration-300 group
                                    ${isVotedHere ? 'scale-110 opacity-100' : 'opacity-60 hover:opacity-100'} 
                                    ${isUsedElsewhere ? 'opacity-40 grayscale-[30%]' : ''}`
                                }
                            >
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center overflow-hidden transition-all border-2
                                    ${isVotedHere
                                        ? 'border-cyan-400 shadow-[0_0_25px_cyan]'
                                        : 'border-slate-700 group-hover:border-cyan-400'}`
                                    }
                                >
                                    <Avatar name={p.name} avatarUrl={p.avatar} size="full" />
                                </div>
                                <span className={`text-[10px] font-bold truncate max-w-[64px] uppercase ${isVotedHere ? 'text-cyan-400' : 'text-slate-500'}`}>{p.name}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Текст карточки */}
                <div className="glass-panel p-6 rounded-3xl text-center mb-8 border border-white/10 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
                    <p className="text-xl text-white font-medium leading-relaxed drop-shadow-md">"{selectedAnswerText}"</p>
                </div>

                {/* Кнопка закрытия */}
                <div className="flex justify-center">
                    <button
                        onClick={() => { playSound('click'); onClose(); }}
                        className="w-14 h-14 rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center border border-white/10 transition-all active:scale-90 backdrop-blur-md shadow-lg group"
                    >
                        <X size={24} className="text-slate-400 group-hover:text-white transition-colors" />
                    </button>
                </div>
            </div>
        </div>
    );
};