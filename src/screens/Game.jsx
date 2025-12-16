import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { socket } from '../socket';
import { Button } from '../components/Button';
import { playSound } from '../utils/sounds'; 

// --- КОМПОНЕНТЫ ---
import { GameHeader } from '../components/GameHeader';
import { VotingModal } from '../components/VotingModal';
import { AnswerCard } from '../components/AnswerCard';
import { ReactionOverlay } from '../components/ReactionOverlay';

// --- ЭКРАНЫ ---
import { GameOverScreen } from '../components/screens/GameOverScreen';
import { AiProcessingScreen } from '../components/screens/AiProcessingScreen';
import { WritingScreen } from '../components/screens/WritingScreen';

// Фразы для загрузки (оставим тут для стейта)
const LOADING_TEXTS = [
    "Тостик жарит факты...",
    "Намазываю масло на нейросеть...",
    "Тост придумывает ответ...",
    "Хрустящая корочка генерируется...",
    "Ищу смешные ответы в интернете...",
    "Тостик подрумянивает правду...",
    "Крошки фактов разлетаются...",
    "Поджариваю логику до золотистой корочки...",
    "Тостик делает вид, что знает ответ...",
    "Ответ застрял в тостере...",
    "Добавляю джем из сомнений...",
    "Тостик путается в крошках истины...",
    "Переворачиваю ответ другой стороной...",
    "Нейросеть слегка пригорела...",
    "Тостик врёт с умным видом...",
    "Смешиваю факты и выдумку...",
    "Ответ почти готов, но это не точно...",
    "Тостик шепчется с тостером...",
    "Подрумяниваю абсурд...",
    "Ответ хрустит, но не факт что правильный..."
];

// Набор реакций
const REACTIONS_LIST = ['😂', '❤️', '💩', '🤯', '🎭', '🤡'];

export const Game = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { roomId, myProfile, isHost: initialIsHost } = location.state || {};
  const [isHost, setIsHost] = useState(initialIsHost || false);

  // --- STATE ---
  const [phase, setPhase] = useState('loading'); 
  const [timer, setTimer] = useState(0);
  const [maxTime, setMaxTime] = useState(60);
  const [endTime, setEndTime] = useState(null);
  
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(5);
  const [question, setQuestion] = useState(null);
  
  const [topicName, setTopicName] = useState('Загрузка...');
  const [topicEmoji, setTopicEmoji] = useState('✨');

  const [myAnswer, setMyAnswer] = useState('');
  const [submittedIds, setSubmittedIds] = useState([]);
  
  const [shuffledAnswers, setShuffledAnswers] = useState([]);
  const [guesses, setGuesses] = useState({});
  const [selectedAnswerId, setSelectedAnswerId] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  
  const [roundResults, setRoundResults] = useState({ deltas: {}, votes: {} });
  const [players, setPlayers] = useState([]);
  
  const [finalStats, setFinalStats] = useState(null);
  const [loadingText, setLoadingText] = useState("Тостик жарит факты...");
  
  const [revealedCount, setRevealedCount] = useState(-1);

  const prevPlayersRef = useRef([]);

  // --- INIT & SOCKETS ---
  useEffect(() => {
      if (!roomId || !myProfile) navigate('/');
  }, [roomId, myProfile, navigate]);

  useEffect(() => {
    // ... (ВЕСЬ БЛОК SOCKET.ON БЕЗ ИЗМЕНЕНИЙ) ...
    socket.on('update_players', (updatedPlayers) => {
        const prev = prevPlayersRef.current;
        if (prev.length > 0) {
            updatedPlayers.forEach(newP => {
                const oldP = prev.find(p => p.id === newP.id);
                if (oldP) {
                    if (oldP.isOnline && !newP.isOnline) playSound('leave'); 
                    else if (!oldP.isOnline && newP.isOnline) playSound('join');
                }
            });
        }
        prevPlayersRef.current = updatedPlayers;
        setPlayers(updatedPlayers);
    });

    socket.on('host_transferred', ({ newHostId }) => {
        if (myProfile.id === newHostId) {
            setIsHost(true);
            playSound('ding'); 
        } else {
            setIsHost(false);
        }
    });

    socket.on('reconnect_success', (data) => {
        if (data.isHost !== undefined) setIsHost(data.isHost);
    });
    
    socket.on('player_submitted', (playerId) => {
        setSubmittedIds(prev => [...prev, playerId]);
        playSound('pop'); 
    });

    socket.on('player_voted', (playerId) => {
        setSubmittedIds(prev => [...prev, playerId]);
        playSound('pop'); 
    });

    socket.on('new_round', (data) => {
        setPhase('writing');
        playSound('whoosh'); 
        setCurrentRound(data.round);
        setTotalRounds(data.totalRounds);
        setQuestion(data.question);
        setTopicName(data.topicName);
        setTopicEmoji(data.topicEmoji);
        setEndTime(data.endTime);
        setMaxTime(data.duration || 60);

        setMyAnswer('');
        setSubmittedIds([]); 
        setShuffledAnswers([]);
        setGuesses({});
        setHasVoted(false);
        setRoundResults({ deltas: {}, votes: {} });
        setRevealedCount(-1); 
    });

    socket.on('phase_change', (newPhase) => {
        setPhase(newPhase);
        if (newPhase === 'ai_processing') {
            playSound('whoosh'); 
            setLoadingText(LOADING_TEXTS[Math.floor(Math.random() * LOADING_TEXTS.length)]);
        }
    });

    socket.on('start_voting', (data) => {
        setPhase('voting');
        playSound('whoosh'); 
        setShuffledAnswers(data.answers);
        setEndTime(data.endTime);
        setMaxTime(data.duration || 60);
        setTimer(data.duration || 60);
        setSubmittedIds([]); 
        setRevealedCount(-1);
    });

    socket.on('round_results', (data) => {
        setShuffledAnswers(prev => prev.map(item => ({ ...item, ...data.fullAnswers.find(fa => fa.id === item.id) })));
        setRoundResults(data);
        setPlayers(data.players);
        
        setPhase('reveal');
        setRevealedCount(-1); 
    });
    
    socket.on('game_over_stats', (data) => {
        setPhase('game_over');
        playSound('start');  
        setPlayers(data.players);
        setFinalStats(data.achievements);
    });

    socket.emit('request_game_state', { roomId });

    return () => {
        socket.off('update_players');
        socket.off('player_submitted');
        socket.off('player_voted'); 
        socket.off('new_round');
        socket.off('phase_change');
        socket.off('start_voting');
        socket.off('round_results');
        socket.off('game_over_stats');
    };
  }, [navigate, roomId, myProfile]);

  // --- TIMER & REVEAL EFFECTS ---
  useEffect(() => {
      if (!endTime || phase === 'game_over') return;
      const interval = setInterval(() => {
          const now = Date.now();
          const diff = Math.ceil((endTime - now) / 1000);
          setTimer(diff > 0 ? diff : 0);
      }, 1000);
      return () => clearInterval(interval);
  }, [endTime, phase]);

  useEffect(() => {
      // Если фаза reveal и мы еще не открыли все карты
      if (phase === 'reveal' && revealedCount < shuffledAnswers.length) {
          const timer = setTimeout(() => {
              // Просто увеличиваем счетчик.
              setRevealedCount(prev => prev + 1);
          }, 1500); // Я поставил 1500, чтобы было чуть больше времени рассмотреть карту, верни 1000 если нужно быстрее
          return () => clearTimeout(timer);
      }
  }, [phase, revealedCount, shuffledAnswers.length]);

  useEffect(() => {
      // Срабатывает мгновенно при смене карточки
      if (phase === 'reveal' && revealedCount >= 0 && revealedCount < shuffledAnswers.length) {
          
          const currentAns = shuffledAnswers[revealedCount];
          const myVote = guesses[currentAns.id]; // Смотрим, голосовал ли я за эту карточку

          // Сценарий 1: Я НЕ голосовал за этот ответ -> Просто звук появления
          if (!myVote) {
              playSound('ping'); 
          } 
          // Сценарий 2: Я голосовал -> Проверяем, угадал или нет
          else {
              let isCorrect = false;
 
              // Логика проверки (такая же, как в AnswerCard)
              if (myVote.type === 'ai' && currentAns.authorId === 'ai') {
                  isCorrect = true; // Угадал ИИ
              } else if (myVote.type === 'human' && myVote.playerId === currentAns.authorId) {
                  isCorrect = true; // Угадал человека
              }

              if (isCorrect) {
                  playSound('correct'); // Звук успеха (убедись, что файл ding.mp3 есть и подключен)
              } else {
                  playSound('miss'); // Звук ошибки (убедись, что файл buzz.mp3 или error.mp3 есть)
              }
          }
      }
  }, [revealedCount, phase, shuffledAnswers, guesses]); // Важно добавить guesses и shuffledAnswers в зависимости

  // --- HANDLERS ---
  const handleMySubmit = () => {
      if (!myAnswer.trim() || myAnswer.length < 3) return; 
      playSound('click'); 
      socket.emit('submit_answer', { roomId, text: myAnswer });
      setSubmittedIds(prev => [...prev, myProfile.id]);
  };

  const confirmVotes = () => {
      playSound('click'); 
      socket.emit('submit_votes', { roomId, votes: guesses });
      setHasVoted(true);
  };
  
  const sendReaction = (emoji) => {
        playSound('pop'); 
        socket.emit('send_reaction', { roomId, emoji });
  };

  const handleNextRoundRequest = () => {
      if (isHost) {
          playSound('click'); 
          socket.emit('next_round_request', { roomId });
      }
  };

  const handleSelectVote = (ansId, type, playerId = null) => {
      if (hasVoted) return;
      playSound('click');
      setGuesses(prev => {
          const newState = { ...prev };
          const existingKey = Object.keys(newState).find(key => {
              const vote = newState[key];
              if (type === 'ai' && vote.type === 'ai') return true;
              if (type === 'human' && vote.type === 'human' && vote.playerId === playerId) return true;
              return false;
          });
          if (existingKey === ansId) { delete newState[ansId]; return newState; }
          if (existingKey) delete newState[existingKey];
          newState[ansId] = { type, playerId };
          return newState;
      });
  };

  const selectedAnswerObj = useMemo(() => {
      return shuffledAnswers.find(a => a.id === selectedAnswerId);
  }, [selectedAnswerId, shuffledAnswers]);

  const myId = myProfile?.id;
  const hasSubmitted = submittedIds.includes(myId);


  // ================= RENDER =================

  if (phase === 'loading') {
      return <div className="flex h-screen items-center justify-center bg-slate-900 text-white animate-pulse">Загрузка...</div>;
  }

  if (phase === 'ai_processing') {
      return <AiProcessingScreen loadingText={loadingText} />;
  }
  
if (phase === 'game_over') {
    return (
        <GameOverScreen 
            players={players} 
            finalStats={finalStats} 
            onExit={() => navigate('/')} 
            myProfile={myProfile} 
        />
    );
}

  if (phase === 'writing') {
      return (
          <WritingScreen 
              currentRound={currentRound}
              totalRounds={totalRounds}
              timer={timer}
              maxTime={maxTime}
              phase={phase}
              players={players}
              submittedIds={submittedIds}
              roundResults={roundResults}
              topicEmoji={topicEmoji}
              topicName={topicName}
              question={question}
              myAnswer={myAnswer}
              setMyAnswer={setMyAnswer}
              handleMySubmit={handleMySubmit}
              hasSubmitted={hasSubmitted}
              myProfile={myProfile}
              isHost={isHost}
              roomId={roomId}
          />
      );
  }

  // === VOTING & REVEAL PHASE (The Main Game Loop) ===
  const isRevealPhase = phase === 'reveal';

  return (
        <div className="flex flex-col h-screen relative">
            <ReactionOverlay /> 

            <GameHeader 
                currentRound={currentRound}
                totalRounds={totalRounds}
                timer={timer}
                maxTime={maxTime}
                phase={phase}
                players={players}
                submittedIds={submittedIds}
                roundResults={roundResults}
                textColor="text-purple-400"
                barColor="bg-purple-500"
                isReveal={isRevealPhase}
            />

            {!isRevealPhase && (
                <div 
                    onClick={() => { playSound('click'); setSelectedAnswerId(null); }} 
                    className={`fixed inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity duration-300 z-[55] ${selectedAnswerId ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                ></div>
            )}

            <div className={`flex-1 overflow-y-auto px-4 py-6 space-y-6 pb-40 transition-all duration-500 ${hasVoted && !isRevealPhase ? 'opacity-60 grayscale-[50%]' : ''}`}>
                <div className="p-4 bg-slate-800/50 rounded-xl mb-4 border border-white/5 transition-all duration-500">
                    <p className="text-sm text-slate-300 italic text-center">"{question}"</p>
                </div>

                {shuffledAnswers.map((ans, index) => (
                    <AnswerCard 
                        key={ans.id}
                        answer={ans}
                        myId={myId}
                        myProfile={myProfile}
                        phase={phase}
                        revealedCount={revealedCount}
                        index={index}
                        myAnswerText={myAnswer}
                        guesses={guesses}
                        players={players}
                        roundResults={roundResults}
                        hasVoted={hasVoted}
                        onSelect={setSelectedAnswerId}
                    />
                ))}

                {isRevealPhase && (
                    <div className="fixed bottom-24 left-0 right-0 z-50 pointer-events-none animate-fade-in-up">
                         <div className="flex justify-center">   
                            <div className="pointer-events-auto flex gap-2">
                                {REACTIONS_LIST.map(emoji => ( 
                                    <button
                                        key={emoji}
                                        onClick={() => sendReaction(emoji)}
                                        className="w-10 h-10 flex items-center justify-center rounded-full text-xl bg-white/5 border border-white/5 shadow-inner hover:bg-white/20 hover:scale-110 active:scale-95 transition-all duration-300 ease-out"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <VotingModal 
                isOpen={!isRevealPhase && !!selectedAnswerId && !!selectedAnswerObj}
                selectedAnswerId={selectedAnswerId}
                selectedAnswerText={selectedAnswerObj?.text}
                guesses={guesses}
                players={players}
                myId={myId}
                onVote={handleSelectVote}
                onClose={() => setSelectedAnswerId(null)}
            />
            
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent z-50 transition-all duration-300">
                 {!isRevealPhase ? (
                     hasVoted ? (
                        <Button variant="secondary" disabled className="opacity-70 bg-slate-800/80 border-slate-600">ОЖИДАНИЕ ИГРОКОВ...</Button>
                     ) : (
                        <Button className="shadow-2xl shadow-cyan-500/20" onClick={confirmVotes}>ПОДТВЕРДИТЬ ВЫБОР</Button>
                     )
                 ) : (
                     isHost ? (
                        <Button onClick={handleNextRoundRequest} variant="primary">{currentRound < totalRounds ? 'СЛЕДУЮЩИЙ РАУНД' : 'ЗАВЕРШИТЬ ИГРУ'}</Button>
                     ) : (
                        <div className="text-center text-slate-500 text-xs animate-pulse uppercase tracking-widest">Ожидание хоста...</div>
                     )
                 )}
            </div>
        </div>
    );
};