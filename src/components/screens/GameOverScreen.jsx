import React, { useMemo } from 'react';
import { Button } from '../Button';
import { Avatar } from '../Avatar';
import { Trophy, Medal, Frown, Sparkles, PartyPopper } from 'lucide-react';
import { playSound } from '../../utils/sounds';

const RESULT_MESSAGES = {
    1: ["ЛЕГЕНДА! 👑", "НЕПОБЕДИМЫЙ!", "КОРОЛЬ ВЕЧЕРИНКИ!", "ПРОСТО МАШИНА!"],
    2: ["ПОЧТИ ДОЖАЛ! 🥈", "СЕРЕБРО ТОЖЕ ТОП!", "ДЫШИШЬ В СПИНУ!", "ДОСТОЙНО!"],
    3: ["В ТРОЙКЕ! 🥉", "БРОНЗОВЫЙ ПРИЗЕР!", "НА ПЬЕДЕСТАЛЕ!", "НЕПЛОХО, НЕПЛОХО!"],
    loser: ["ГЛАВНОЕ УЧАСТИЕ...", "НУ ТЫ ПЫТАЛСЯ 🗿", "ГЕНЕРАТОР СЛУЧАЙНОСТЕЙ", "ЗАТО ТЫ КРАСИВЫЙ", "В СЛЕДУЮЩИЙ РАЗ (НЕТ)"]
};

// Исправленная функция получения сообщения
const getRandomMessage = (rank) => {
    // Если ранг есть в ключах (1, 2, 3) - берем его. Иначе берем loser.
    // Это защищает от rank = 0 или undefined
    const list = RESULT_MESSAGES[rank] || RESULT_MESSAGES.loser;
    return list[Math.floor(Math.random() * list.length)];
};

export const GameOverScreen = ({ players, finalStats, onExit, myProfile }) => {
    // Сортируем игроков
    const sortedPlayers = useMemo(() => {
        return [...players].sort((a, b) => b.score - a.score);
    }, [players]);

    const winner = sortedPlayers[0];
    
    // Определяем мое место (безопасно)
    const myRank = useMemo(() => {
        if (!myProfile || !myProfile.id) return 999; // Если профиля нет
        const index = sortedPlayers.findIndex(p => p.id === myProfile.id);
        return index === -1 ? 999 : index + 1;
    }, [sortedPlayers, myProfile]);

    const titleText = useMemo(() => getRandomMessage(myRank), [myRank]);

    // Иконка результата
    const ResultIcon = myRank === 1 ? Trophy : (myRank === 2 || myRank === 3 ? Medal : Frown);

    return (
        <div className="flex flex-col h-screen bg-slate-950 overflow-hidden relative">
            {/* Фоновые эффекты */}
            <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-purple-900/20 to-transparent pointer-events-none" />
            
            <div className="flex-1 overflow-y-auto pb-32 scrollbar-hide">
                {/* ЗАГОЛОВОК С РЕЗУЛЬТАТОМ */}
                <div className="pt-12 pb-6 px-4 text-center z-10 relative">
                    <div className="inline-flex items-center justify-center p-3 mb-3 rounded-full bg-slate-800/50 ring-1 ring-white/10 shadow-lg animate-bounce-slow">
                        <ResultIcon size={32} className={`${myRank === 1 ? 'text-yellow-400' : myRank <= 3 ? 'text-cyan-400' : 'text-slate-400'}`} />
                    </div>
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-orange-500 uppercase italic tracking-tighter mb-1 drop-shadow-sm">
                        {titleText}
                    </h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">
                        {myRank > players.length ? 'Зритель' : (
                             <>Твое место: <span className="text-white">#{myRank}</span> из {players.length}</>
                        )}
                    </p>
                </div>

                {/* ПЬЕДЕСТАЛ (PODIUM) */}
                <div className="flex items-end justify-center gap-2 sm:gap-4 px-4 mb-10 min-h-[220px]">
                    {/* 2 МЕСТО */}
                    {sortedPlayers[1] && (
                        <div className="flex flex-col items-center animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                            <div className="mb-3 relative group">
                                <Avatar name={sortedPlayers[1].name} size="md" avatarUrl={sortedPlayers[1].avatar} className="ring-4 ring-slate-700 group-hover:scale-105 transition-transform" />
                                <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                                    <span className="bg-slate-600 text-slate-100 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-500 shadow-lg">#2</span>
                                </div>
                            </div>
                            <div className="w-20 sm:w-24 h-24 bg-gradient-to-t from-slate-800 to-slate-700/80 backdrop-blur-sm rounded-t-lg border-t-4 border-slate-500 flex flex-col items-center justify-start pt-3 shadow-2xl">
                                <span className="font-bold text-slate-300 text-lg">{sortedPlayers[1].score}</span>
                            </div>
                        </div>
                    )}

                    {/* 1 МЕСТО */}
                    {winner && (
                        <div className="flex flex-col items-center z-10 animate-fade-in-up relative -top-2">
                            <div className="mb-3 relative group">
                                <Sparkles className="absolute -top-6 -right-4 text-yellow-300 w-6 h-6 animate-pulse" />
                                <div className="ring-4 ring-yellow-500 shadow-yellow-500/50 shadow-lg rounded-full group-hover:scale-110 transition-transform duration-300">
                                    <Avatar name={winner.name} size="lg" avatarUrl={winner.avatar} />
                                </div>
                                <div className="absolute -bottom-3 inset-x-0 flex justify-center">
                                    <span className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-black text-xs px-3 py-1 rounded-full border-2 border-slate-900 shadow-xl flex items-center gap-1">
                                        <Trophy size={10} /> #1
                                    </span>
                                </div>
                            </div>
                            <div className="w-24 sm:w-28 h-36 bg-gradient-to-t from-yellow-600/30 to-yellow-500/30 backdrop-blur-md rounded-t-xl border-t-4 border-yellow-400 flex flex-col items-center justify-start pt-4 shadow-[0_0_30px_rgba(234,179,8,0.3)] relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-b from-yellow-400/10 to-transparent animate-pulse" />
                                <span className="font-black text-3xl text-yellow-300 relative z-10 drop-shadow-md">{winner.score}</span>
                                <span className="text-[10px] text-yellow-200/60 font-bold uppercase tracking-widest relative z-10">Очков</span>
                            </div>
                        </div>
                    )}

                    {/* 3 МЕСТО */}
                    {sortedPlayers[2] && (
                        <div className="flex flex-col items-center animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                            <div className="mb-3 relative group">
                                <Avatar name={sortedPlayers[2].name} size="md" avatarUrl={sortedPlayers[2].avatar} className="ring-4 ring-amber-900 group-hover:scale-105 transition-transform" />
                                <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                                    <span className="bg-amber-800 text-amber-100 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-700 shadow-lg">#3</span>
                                </div>
                            </div>
                            <div className="w-20 sm:w-24 h-16 bg-gradient-to-t from-amber-900/40 to-amber-800/40 backdrop-blur-sm rounded-t-lg border-t-4 border-amber-700 flex flex-col items-center justify-start pt-3 shadow-2xl">
                                <span className="font-bold text-amber-500 text-lg">{sortedPlayers[2].score}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* ДОСТИЖЕНИЯ */}
                <div className="px-6 space-y-4 pb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <PartyPopper size={14} />
                            Итоги игры
                        </h3>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
                    </div>

                    {/* Проверяем, что finalStats это массив */}
                    {Array.isArray(finalStats) && finalStats.length > 0 ? (
                        finalStats.map((ach, idx) => {
                            // ИСПРАВЛЕНИЕ: Если игрока нет в списке, создаем "фейкового" игрока, чтобы ачивка всё равно показалась
                            const foundPlayer = players.find(p => p.id === ach.playerId);
                            const player = foundPlayer || { 
                                name: 'Игрок (вышел)', 
                                avatar: null, 
                                id: ach.playerId 
                            };
                            
                            // Безопасная проверка title
                            const title = ach.title || 'Достижение';
                            const isGood = !title.toLowerCase().includes('худш') && !title.toLowerCase().includes('скучн');

                            return (
                                <div 
                                    key={idx} 
                                    className="group relative bg-slate-800/40 hover:bg-slate-800/60 border border-white/5 hover:border-white/10 p-3 rounded-2xl flex items-center gap-4 animate-scale-in transition-all duration-300" 
                                    style={{ animationDelay: `${idx * 150 + 500}ms`, animationFillMode: 'both' }}
                                >
                                    <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center text-2xl shadow-inner ${isGood ? 'bg-gradient-to-br from-purple-500/20 to-blue-500/20' : 'bg-slate-700/30'}`}>
                                        {title.includes(' ') ? title.split(' ')[0] : '🏆'} 
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`font-bold text-sm leading-tight ${isGood ? 'text-purple-300' : 'text-slate-400'}`}>
                                                {title}
                                            </span>
                                            <span className="text-[10px] bg-slate-900/80 px-2 py-1 rounded text-slate-400 font-mono border border-slate-700">
                                                {ach.count || 0}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 leading-tight mb-2 pr-2">
                                            {ach.desc || 'Описание отсутствует'}
                                        </p>
                                        
                                        <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-lg w-fit pr-3">
                                            <Avatar name={player.name} size="xs" avatarUrl={player.avatar} />
                                            <span className={`text-xs font-bold truncate ${player.id === myProfile?.id ? 'text-yellow-400' : 'text-slate-300'}`}>
                                                {player.id === myProfile?.id ? 'ЭТО ТЫ!' : player.name}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center text-slate-500 text-sm py-4">
                            Пока нет достижений...
                        </div>
                    )}
                </div>
            </div>

            {/* КНОПКА ВЫХОДА */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent z-50">
                <Button 
                    onClick={() => { playSound('click'); onExit(); }} 
                    variant="primary"
                    className="shadow-2xl shadow-purple-500/20 w-full py-4 text-lg font-bold tracking-widest"
                >
                    ГЛАВНОЕ МЕНЮ
                </Button>
            </div>
        </div>
    );
};