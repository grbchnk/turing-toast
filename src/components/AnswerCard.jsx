import React from 'react';
import { Avatar } from './Avatar';
import { HelpCircle, Check, X, Drama } from 'lucide-react';
import { playSound } from '../utils/sounds';

export const AnswerCard = ({
    answer,
    myId,
    myProfile,
    phase,
    revealedCount,
    index,
    myAnswerText,
    guesses,
    players,
    roundResults,
    hasVoted,
    onSelect,
}) => {
    const isRevealPhase = phase === 'reveal';
    const isRevealed = isRevealPhase && index <= revealedCount;
    
    // Кто владелец
    const isMyOwn = answer.authorId === myId;
    const reallyMyOwn = isRevealed ? isMyOwn : (answer.text === myAnswerText);

    // Догадка
    const myGuess = guesses[answer.id];

    // Автор
    const realAuthor = answer.authorId === 'ai' 
        ? { name: 'Тостик', isAi: true, isOnline: true } 
        : players.find(p => p.id === answer.authorId);

    // Группы голосов
    const othersForThis = isRevealed ? (roundResults.votes[answer.id] || []) : [];
    const deceivedVoters = othersForThis.filter(v => v.isDeceived);
    const correctVoters = othersForThis.filter(v => v.isCorrect);
    const wrongVoters = othersForThis.filter(v => !v.isCorrect && !v.isDeceived);

    const deceptionPoints = reallyMyOwn ? deceivedVoters.length * 108 : 0;

    // --- СТИЛИ ---
    let scoreDelta = 0;
    
    // min-w-[100px] чтобы совсем короткие сообщения не выглядели сплюснутыми
    // Убрали паддинги снизу под список, так как он теперь снаружи
    let bubbleClass = 'relative p-3 sm:p-4 text-sm leading-relaxed rounded-2xl transition-all duration-500 min-w-[100px]';
    let cardWrapperClass = 'transition-all duration-500 ease-out border max-w-[75%] sm:max-w-[70%]';

    if (isRevealed) {
        if (myGuess) {
            if (myGuess.type === 'ai' && answer.authorId === 'ai') scoreDelta = 100;
            else if (myGuess.type === 'human' && myGuess.playerId === answer.authorId) scoreDelta = 25;
            else scoreDelta = -50;
        }

        cardWrapperClass += ' card-revealed-shadow';

        if (reallyMyOwn) {
            if (deceivedVoters.length > 0) {
                bubbleClass += ' bg-purple-900/40 border border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.25)] text-purple-100';
            } else {
                bubbleClass += ' bg-indigo-900/30 border border-indigo-500/40 text-indigo-100';
            }
        } else if (myGuess) {
            if (scoreDelta > 0) bubbleClass += ' bg-green-900/30 border border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.15)] text-green-100';
            else bubbleClass += ' bg-red-900/30 border border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)] text-red-100';
        } else if (answer.authorId === 'ai') {
            bubbleClass += ' bg-slate-800 border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.15)]';
        } else {
            bubbleClass += ' bg-slate-800 border-slate-700';
        }

    } else {
        cardWrapperClass += ' shadow-none opacity-90 hover:opacity-100';
        if (reallyMyOwn) bubbleClass += ' bg-indigo-600/10 border border-indigo-500/30 text-indigo-100';
        else if (myGuess) bubbleClass += myGuess.type === 'ai' ? ' bg-purple-900/20 border border-purple-500/50' : ' bg-cyan-900/20 border border-cyan-500/50';
        else bubbleClass += ' glass hover:bg-slate-800 border-slate-700';
    }

    // Старый аватар
    let prevAvatarContent;
    if (reallyMyOwn) {
        prevAvatarContent = <Avatar name={myProfile.name} avatarUrl={myProfile.avatar} size="sm" />;
    } else if (myGuess) {
        if (myGuess.type === 'ai') prevAvatarContent = <Avatar isAi={true} size="sm" />;
        else {
            const gPlayer = players.find(p => p.id === myGuess.playerId);
            prevAvatarContent = <Avatar name={gPlayer?.name} avatarUrl={gPlayer?.avatar} size="sm" />;
        }
    } else {
        prevAvatarContent = (
            <div className="w-full h-full rounded-full bg-slate-700/50 border border-slate-600 flex items-center justify-center text-slate-500">
                <HelpCircle size={14} />
            </div>
        );
    }

    // Рендер группы голосов (ЧИПСЫ)
    const renderVoterGroup = (voters, icon, colorClass, borderColorClass, delayBase = 0) => {
        if (!voters || voters.length === 0) return null;
        return (
            <div className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded-full border ${borderColorClass} bg-slate-900/80 backdrop-blur-sm shadow-sm animate-fade-in-up`}>
                <div className={`${colorClass} p-0.5 rounded-full`}>
                    {icon}
                </div>
                <div className="flex -space-x-2">
                    {voters.map((v, i) => {
                        const p = players.find(pl => pl.id === v.playerId);
                        return (
                            <div key={v.playerId} className="relative z-10 border border-slate-900 rounded-full transition-transform hover:scale-110 hover:z-20"
                                 style={{ animationDelay: `${delayBase + (i * 100)}ms` }}>
                                <Avatar name={p?.name} avatarUrl={p?.avatar} size="xs" />
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        // Увеличили mb-4 -> mb-8, чтобы свисающие элементы не налезли на следующее сообщение
        <div className={`flex w-full mb-8 ${reallyMyOwn ? 'justify-end' : 'justify-start'}`}>
            
            <div className={`flex items-start gap-3 ${reallyMyOwn ? 'flex-row-reverse' : 'flex-row'} max-w-full`}>
                
                {/* АВАТАР (3D) */}
                <div className="avatar-perspective shrink-0 mt-0"> 
                    <div className={isRevealed ? 'animate-flip-out' : 'absolute inset-0'}>
                         {prevAvatarContent}
                    </div>
                    {isRevealed && (
                        <div className="animate-flip-in">
                             <Avatar name={realAuthor?.name} isAi={realAuthor?.isAi} avatarUrl={realAuthor?.avatar} size="sm" />
                        </div>
                    )}
                </div>

                {/* БАБЛ */}
                <div 
                    onClick={() => { if (!isRevealed && !reallyMyOwn && !hasVoted) { playSound('click'); onSelect(answer.id); }}}
                    className={`
                        ${bubbleClass} 
                        ${cardWrapperClass}
                        ${reallyMyOwn ? 'rounded-tr-none' : 'rounded-tl-none'}
                        ${hasVoted && !isRevealed ? 'cursor-default' : 'cursor-pointer'}
                    `}
                >
                    {/* ИМЯ */}
                    {!reallyMyOwn && (
                        // 1. Было h-3, ставим h-5 (чтобы новый размер шрифта поместился)
                        <div className="mb-1 h-5 flex items-center"> 
                            {isRevealed ? (
                                // 2. Было text-[10px], ставим text-xs (12px) или даже text-sm (14px)
                                <span className={`text-xs font-bold uppercase tracking-wider animate-name-fade ${realAuthor?.isAi ? 'text-purple-400' : 'text-slate-400'}`}>
                                    {realAuthor?.isAi ? 'Тостик AI' : realAuthor?.name}
                                </span>
                            ) : (
                                // 3. У заглушки меняем размер точно так же, чтобы не прыгало
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 select-none">
                                    ??????
                                </span>
                            )}
                        </div>
                    )}

                    {/* ТЕКСТ */}
                    <div className="break-words relative z-10 text-shadow-sm">
                        {answer.text}
                    </div>

                    {/* ВЕРХНИЕ БЕЙДЖИ ОЧКОВ */}
                    {isRevealed && myGuess && !reallyMyOwn && (
                        <div className={`absolute -top-3 -right-2 px-3 py-1 rounded-full text-xs font-black border shadow-lg transform rotate-6 z-20 animate-scale-in ${scoreDelta > 0 ? 'bg-green-500 border-green-400 text-black' : 'bg-red-500 border-red-600 text-white'}`}>
                            {scoreDelta > 0 ? '+' : ''}{scoreDelta}
                        </div>
                    )}

                    {isRevealed && reallyMyOwn && deceptionPoints > 0 && (
                        <div className="absolute -top-3 -left-2 px-3 py-1 rounded-full bg-purple-500 border border-purple-400 text-white text-xs font-black shadow-[0_0_15px_rgba(168,85,247,0.6)] transform -rotate-3 z-20 flex items-center gap-1 animate-scale-in">
                             <Drama size={14} /> <span>+{deceptionPoints}</span>
                        </div>
                    )}

                    {/* 
                        НИЖНЯЯ ПАНЕЛЬ ГОЛОСОВ (ABSOLUTE)
                        Теперь они висят на нижней границе сообщения.
                    */}
                    {isRevealed && othersForThis.length > 0 && (
                        <div className={`
                            absolute -bottom-4 z-30 flex items-center gap-2 whitespace-nowrap
                            ${reallyMyOwn ? 'right-0 flex-row-reverse' : 'left-0 flex-row'}
                        `}>
                            {/* Группа 1: Обманутые (Фиолетовые) */}
                            {renderVoterGroup(deceivedVoters, <Drama size={10} className="text-purple-300" />, 'bg-purple-500/20', 'border-purple-500/30')}
                            
                            {/* Группа 2: Угадавшие (Зеленые) */}
                            {renderVoterGroup(correctVoters, <Check size={10} className="text-green-300" />, 'bg-green-500/20', 'border-green-500/30', 100)}

                            {/* Группа 3: Ошибшиеся (Красные) */}
                            {renderVoterGroup(wrongVoters, <X size={10} className="text-red-300" />, 'bg-red-500/20', 'border-red-500/30', 200)}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};