import React from 'react';
import { Button } from '../Button';
import { Avatar } from '../Avatar';
import { CheckCircle } from 'lucide-react';
import { GameHeader } from '../GameHeader';
import { socket } from '../../socket';

export const WritingScreen = ({
    // Props для Header
    currentRound,
    totalRounds,
    timer,
    maxTime,
    phase,
    players,
    submittedIds,
    roundResults,
    
    // Props для контента
    topicEmoji,
    topicName,
    question,
    myAnswer,
    setMyAnswer,
    handleMySubmit,
    hasSubmitted,
    myProfile,
    isHost,
    roomId
}) => {
    return (
        <div className="flex flex-col h-screen relative">
            <GameHeader 
                currentRound={currentRound}
                totalRounds={totalRounds}
                timer={timer}
                maxTime={maxTime}
                phase={phase}
                players={players}
                submittedIds={submittedIds}
                roundResults={roundResults}
                textColor="text-cyan-400"
                barColor="bg-cyan-400"
                isReveal={false}
            />

            <div className="p-6 flex-1 flex flex-col">
                <div className="glass p-6 rounded-2xl mb-6 shadow-[0_0_20px_rgba(0,0,0,0.3)] border-t border-white/10">
                    <div className="flex items-center justify-center gap-2 mb-2 text-purple-300">
                        <span className="text-xl">{topicEmoji}</span>
                        <span className="text-xs font-bold uppercase tracking-widest">{topicName}</span>
                    </div>
                    <h2 className="text-xl font-bold text-center leading-relaxed text-white">{question || "Загрузка вопроса..."}</h2>
                </div>

                {!hasSubmitted ? (
                    <div className="flex-1 flex flex-col relative z-10 animate-fade-in-up">
                        <textarea
                            className="w-full bg-slate-800/50 text-white p-4 rounded-xl border border-slate-600 focus:border-cyan-400 outline-none text-lg resize-none mb-4 flex-1 placeholder:text-slate-600 shadow-inner"
                            placeholder="Напиши что-то смешное или умное..."
                            value={myAnswer}
                            onChange={(e) => setMyAnswer(e.target.value)}
                        />
                        <Button 
                            onClick={handleMySubmit} 
                            variant="primary" 
                            disabled={myAnswer.length < 3}
                            className={`shadow-[0_0_15px_rgba(6,182,212,0.4)] ${myAnswer.length < 3 ? 'opacity-50 grayscale' : ''}`}
                        >
                            ОТПРАВИТЬ
                        </Button>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center animate-fade-in">
                        <div className="relative mb-6">
                            <Avatar name={myProfile.name} avatarUrl={myProfile.avatar} size="lg"/>
                            <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2 border-4 border-slate-900 shadow-[0_0_10px_lime]"><CheckCircle size={24} className="text-black" strokeWidth={3}/></div>
                        </div>
                        <p className="text-xl text-white font-bold mb-2">Ответ принят!</p>
                        <p className="text-sm text-slate-400 mb-8">Ждем остальных...</p>
                        {isHost && (
                            <button onClick={() => socket.emit('dev_skip_timer', { roomId })} className="px-4 py-2 rounded-full border border-slate-700 text-xs text-slate-500 hover:text-white hover:border-white transition-colors">Dev: Skip Timer ⏩</button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};