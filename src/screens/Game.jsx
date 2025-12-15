import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { socket } from '../socket';
import { Button } from '../components/Button';
import { Avatar } from '../components/Avatar';
import { TimerBar } from '../components/TimerBar';
import { LiveLeaderboard } from '../components/LiveLeaderboard';
import { playSound } from '../utils/sounds'; 
import { CheckCircle, XCircle, HelpCircle, X, Trophy, Drama } from 'lucide-react';

// Фразы для загрузки
const LOADING_TEXTS = [
    "Тостик жарит факты...",
    "Намазываю масло на нейросеть...",
    "Тост придумывает ответ...",
    "Хрустящая корочка генерируется...",
    "Ищу смешные ответы в интернете..."
];

// Набор реакций (6 штук)
const REACTIONS_LIST = ['😂', '❤️', '🔥', '💩', '🤡', '👏'];

export const Game = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { roomId, myProfile, isHost: initialIsHost } = location.state || {};

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
  const [loadingText, setLoadingText] = useState(LOADING_TEXTS[0]);

  const [reactions, setReactions] = useState([]);

  const prevPlayersRef = useRef([]);

  // --- INIT & SOCKETS ---
  useEffect(() => {
      if (!roomId || !myProfile) navigate('/');
  }, [roomId, myProfile, navigate]);

  useEffect(() => {
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
    });

    socket.on('round_results', (data) => {
        setPhase('reveal');
        
        const myDelta = data.deltas[myProfile?.id] || 0;
        if (myDelta > 0) playSound('ding');
        else if (myDelta < 0) playSound('buzz');
        else playSound('whoosh');

        setRoundResults(data);
        if (data.fullAnswers) setShuffledAnswers(data.fullAnswers);
        setPlayers(data.players);
    });
    
    socket.on('game_over_stats', (data) => {
        setPhase('game_over');
        playSound('start'); 
        setPlayers(data.players);
        setFinalStats(data.achievements);
    });

    socket.on('animate_reaction', (data) => {
        const element = document.getElementById(`player-node-${data.senderId}`);
        
        let startX = window.innerWidth / 2; 
        let startY = window.innerHeight - 100;

        if (element) {
            const rect = element.getBoundingClientRect();
            // [UPDATED] Берем точный центр аватарки
            startX = rect.left + (rect.width / 2);
            startY = rect.top + (rect.height / 2);
        }

        // [UPDATED] Параметры для рандомного полета
        const drift = (Math.random() - 0.5) * 150; // Разброс по горизонтали (-75px до +75px)
        const rotation = (Math.random() - 0.5) * 45; // Легкий наклон
        const scale = 0.8 + Math.random() * 0.5; // Рандомный размер

        const reactionObj = { 
            ...data, 
            x: startX, 
            y: startY, 
            drift, 
            rotation,
            scale,
            id: Math.random() 
        };

        setReactions(prev => [...prev, reactionObj]);

        // Удаляем через время анимации (2с)
        setTimeout(() => {
            setReactions(prev => prev.filter(r => r.id !== reactionObj.id));
        }, 2000);
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
        socket.off('animate_reaction');
    };
  }, [navigate, roomId, myProfile]);

  // --- TIMER ---
  useEffect(() => {
      if (!endTime || phase === 'game_over') return;
      const interval = setInterval(() => {
          const now = Date.now();
          const diff = Math.ceil((endTime - now) / 1000);
          setTimer(diff > 0 ? diff : 0);
      }, 1000);
      return () => clearInterval(interval);
  }, [endTime, phase]);

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
      if (initialIsHost) {
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

          if (existingKey === ansId) {
              delete newState[ansId];
              return newState;
          }
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

  // --- STYLES FOR ANIMATION ---
  // Вставляем стили анимации
  const animationStyles = `
    @keyframes floatUpFade {
      0% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0);
      }
      10% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1.2);
      }
      100% {
        opacity: 0;
        transform: translate(calc(-50% + var(--drift)), -300px) rotate(var(--rot)) scale(1);
      }
    }
  `;

  // --- RENDER HEADER ---
  const renderHeader = (color = "text-cyan-400", barColor = "bg-cyan-400") => (
    <div className="bg-slate-900/90 z-20 sticky top-0 shadow-lg shadow-cyan-900/10 backdrop-blur-md">
         <div className="flex justify-between items-center px-6 pt-4 mb-2">
            <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1 rounded-full border border-white/5">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Вопрос</span>
                <span className="text-sm font-black text-cyan-400 font-mono tracking-wider">{currentRound}<span className="text-slate-600">/</span>{totalRounds}</span>
            </div>
            <span className={`text-xl font-mono font-bold ${timer < 10 ? 'text-red-400 animate-pulse' : color}`}>
                {timer}
            </span>
        </div>
        <div className="px-6 mb-2">
            <TimerBar current={timer} total={maxTime} color={barColor} />
        </div>
        <LiveLeaderboard 
            players={players} 
            submittedIds={['writing', 'voting'].includes(phase) ? submittedIds : []} 
            roundDeltas={phase === 'reveal' ? roundResults.deltas : {}} 
        />
    </div>
  );

  if (phase === 'loading') return <div className="flex h-screen items-center justify-center bg-slate-900 text-white animate-pulse">Загрузка...</div>;

  // AI LOADING SCREEN
  if (phase === 'ai_processing') {
      return (
        <div className="flex flex-col h-screen justify-center items-center p-6 space-y-8 bg-slate-900 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900 to-slate-900"></div>
            <div className="relative z-10 flex flex-col items-center animate-float">
                <img src="./loading.png" alt="Loading" className="w-32 h-32 object-contain drop-shadow-[0_0_30px_rgba(168,85,247,0.5)]" />
            </div>
            <div className="z-10 text-center space-y-2">
                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 animate-pulse">
                    {loadingText}
                </h2>
                <div className="flex justify-center gap-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-0"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-200"></div>
                </div>
            </div>
        </div>
      );
  }
  
  // GAME OVER SCREEN
  if (phase === 'game_over') {
      const sorted = [...players].sort((a,b) => b.score - a.score);
      const winner = sorted[0];
      
      return (
          <div className="flex flex-col h-screen bg-slate-900 overflow-y-auto">
              <div className="p-6 pt-10 pb-4 text-center">
                  <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 to-orange-500 uppercase italic tracking-tighter mb-2">ПОБЕДА!</h1>
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Игра завершена</p>
              </div>

              <div className="flex items-end justify-center gap-4 mb-8 px-4 h-48">
                  {sorted[1] && (
                      <div className="flex flex-col items-center animate-fade-in-up delay-100">
                          <div className="mb-2 relative">
                               <Avatar name={sorted[1].name} size="md" avatarUrl={sorted[1].avatar}/>
                               <div className="absolute -bottom-2 inset-x-0 flex justify-center"><span className="bg-slate-700 text-white text-[10px] px-2 rounded-full border border-slate-600">#2</span></div>
                          </div>
                          <div className="w-20 h-24 bg-gradient-to-t from-slate-800 to-slate-700 rounded-t-lg flex items-start justify-center pt-2 border-t border-slate-500">
                               <span className="font-bold text-slate-300">{sorted[1].score}</span>
                          </div>
                      </div>
                  )}
                  {winner && (
                      <div className="flex flex-col items-center z-10 animate-fade-in-up">
                           <div className="mb-2 relative">
                               <Trophy size={32} className="text-yellow-400 absolute -top-8 left-1/2 -translate-x-1/2 animate-bounce" />
                               <div className="ring-4 ring-yellow-500/50 rounded-full">
                                    <Avatar name={winner.name} size="lg" avatarUrl={winner.avatar}/>
                               </div>
                               <div className="absolute -bottom-3 inset-x-0 flex justify-center"><span className="bg-yellow-500 text-black font-black text-xs px-3 py-0.5 rounded-full border-2 border-slate-900 shadow-lg">#1</span></div>
                          </div>
                          <div className="w-24 h-32 bg-gradient-to-t from-yellow-600/20 to-yellow-500/20 border-t-2 border-yellow-500 rounded-t-xl flex items-start justify-center pt-4 relative overflow-hidden">
                               <div className="absolute inset-0 bg-yellow-500/10 animate-pulse"></div>
                               <span className="font-black text-2xl text-yellow-400 relative z-10">{winner.score}</span>
                          </div>
                      </div>
                  )}
                  {sorted[2] && (
                      <div className="flex flex-col items-center animate-fade-in-up delay-200">
                          <div className="mb-2 relative">
                               <Avatar name={sorted[2].name} size="md" avatarUrl={sorted[2].avatar}/>
                               <div className="absolute -bottom-2 inset-x-0 flex justify-center"><span className="bg-amber-900 text-amber-100 text-[10px] px-2 rounded-full border border-amber-800">#3</span></div>
                          </div>
                          <div className="w-20 h-16 bg-gradient-to-t from-amber-900/40 to-amber-800/40 rounded-t-lg flex items-start justify-center pt-2 border-t border-amber-800">
                               <span className="font-bold text-amber-500">{sorted[2].score}</span>
                          </div>
                      </div>
                  )}
              </div>

              <div className="px-6 pb-24 space-y-3">
                  <h3 className="text-center text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Достижения</h3>
                  {finalStats && finalStats.map((ach, idx) => {
                      const player = players.find(p => p.id === ach.playerId);
                      if (!player) return null;
                      
                      return (
                          <div key={idx} className="glass p-3 rounded-xl flex items-center gap-4 animate-scale-in" style={{animationDelay: `${idx * 150 + 500}ms`}}>
                              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xl shadow-inner">
                                  {ach.title.split(' ')[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-center mb-1">
                                      <span className="font-bold text-white text-sm">{ach.title}</span>
                                      <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded text-slate-300">{ach.count} раз</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 mb-2">{ach.desc}</p>
                                  <div className="flex items-center gap-2 bg-slate-800/50 p-1.5 rounded-lg border border-slate-700/50">
                                      <Avatar name={player.name} size="sm" avatarUrl={player.avatar}/>
                                      <span className="text-xs font-bold text-cyan-300 truncate">{player.name}</span>
                                  </div>
                              </div>
                          </div>
                      );
                  })}
              </div>

              <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent">
                  <Button onClick={() => { playSound('click'); navigate('/'); }} variant="primary">В МЕНЮ</Button>
              </div>
          </div>
      )
  }

  // --- VOTING PHASE ---
  if (phase === 'voting') {
    return (
        <div className="flex flex-col h-screen relative">
            {renderHeader("text-purple-400", "bg-purple-500")}
            <div 
                onClick={() => { playSound('click'); setSelectedAnswerId(null); }} 
                className={`fixed inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity duration-300 z-[55] ${selectedAnswerId ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            ></div>

            <div className={`flex-1 overflow-y-auto px-4 py-6 space-y-6 pb-28 transition-all duration-500 ${hasVoted ? 'opacity-60 grayscale-[50%]' : ''}`}>
                <div className="p-4 bg-slate-800/50 rounded-xl mb-4 border border-white/5">
                    <p className="text-sm text-slate-300 italic text-center">"{question}"</p>
                </div>

                {shuffledAnswers.map((ans) => {
                    const isMyOwn = ans.text === myAnswer;
                    const myGuess = guesses[ans.id];
                    
                    let iconContent;
                    if (isMyOwn) {
                        iconContent = <Avatar name={myProfile.name} size="sm" avatarUrl={myProfile.avatar}/>;
                    } else if (myGuess) {
                        if (myGuess.type === 'ai') {
                            iconContent = <Avatar isAi={true} size="sm" />;
                        } else {
                            const guessedPlayer = players.find(p => p.id === myGuess.playerId);
                            iconContent = (<Avatar name={guessedPlayer?.name} avatarUrl={guessedPlayer?.avatar} size="sm"/>);
                        }
                    } else {
                        iconContent = <div className="w-8 h-8 rounded-full bg-slate-700/50 border border-slate-600 flex items-center justify-center text-slate-500"><HelpCircle size={14} /></div>;
                    }

                    return (
                        <div key={ans.id} className={`flex w-full transition-opacity ${isMyOwn ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex items-start gap-3 max-w-[85%] ${isMyOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className="shrink-0">
                                    {iconContent}
                                </div>
                                <div 
                                    onClick={() => {
                                        if (!isMyOwn && !hasVoted) {
                                            playSound('click');
                                            setSelectedAnswerId(ans.id);
                                        }
                                    }}
                                    className={`
                                        p-4 text-sm leading-relaxed shadow-md transition-all duration-200
                                        ${isMyOwn 
                                            ? 'bg-indigo-600/20 border border-indigo-500/30 rounded-2xl rounded-tr-none text-indigo-100 pointer-events-none' 
                                            : 'glass rounded-2xl rounded-tl-none border-slate-700 cursor-pointer hover:bg-slate-800 active:scale-95'
                                        }
                                        ${myGuess && !isMyOwn ? (myGuess.type === 'ai' ? '!border-purple-500/50 !bg-purple-900/20' : '!border-cyan-500/50 !bg-cyan-900/20') : ''}
                                        ${hasVoted ? 'pointer-events-none' : ''}
                                    `}
                                >
                                    {ans.text}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* MODAL VOTING */}
            {selectedAnswerId && selectedAnswerObj && (
                <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-6 pointer-events-none">
                    <div className="w-full max-w-sm pointer-events-auto animate-enter">
                        <div className="glass-panel backdrop-blur-xl rounded-3xl p-4 mb-6 flex items-center justify-start gap-3 overflow-x-auto hide-scrollbar border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
                            <button 
                                onClick={() => handleSelectVote(selectedAnswerId, 'ai')} 
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
                            {players.filter(p => p.id !== myId).map(p => {
                                const isVotedHere = guesses[selectedAnswerId]?.playerId === p.id;
                                const isUsedElsewhere = !isVotedHere && Object.values(guesses).some(g => g.playerId === p.id && g.type === 'human');
                                return (
                                    <button 
                                        key={p.id} 
                                        onClick={() => handleSelectVote(selectedAnswerId, 'human', p.id)} 
                                        className={`flex flex-col items-center min-w-[64px] gap-2 transition-all duration-300 group
                                            ${isVotedHere ? 'scale-110 opacity-100' : 'opacity-60 hover:opacity-100'} 
                                            ${isUsedElsewhere && !isVotedHere ? 'opacity-40' : ''}` 
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
                        <div className="glass-panel p-6 rounded-3xl text-center mb-8 border border-white/10 relative overflow-hidden shadow-2xl">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
                            <p className="text-xl text-white font-medium leading-relaxed drop-shadow-md">"{selectedAnswerObj.text}"</p>
                        </div>
                        <div className="flex justify-center">
                            <button 
                                onClick={() => { playSound('click'); setSelectedAnswerId(null); }} 
                                className="w-14 h-14 rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center border border-white/10 transition-all active:scale-90 backdrop-blur-md shadow-lg group"
                            >
                                <X size={24} className="text-slate-400 group-hover:text-white transition-colors" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent z-50 transition-all duration-300">
                 {hasVoted ? (
                     <div className="flex flex-col gap-2">
                        <Button variant="secondary" disabled className="opacity-70 bg-slate-800/80 border-slate-600">ОЖИДАНИЕ ИГРОКОВ...</Button>
                     </div>
                 ) : (
                     <Button className="shadow-2xl shadow-cyan-500/20" onClick={confirmVotes}>ПОДТВЕРДИТЬ ВЫБОР</Button>
                 )}
            </div>
        </div>
    );
  }

  // --- REVEAL PHASE ---
  if (phase === 'reveal') {
      return (
        <div className="flex flex-col h-screen relative">
             <div className="bg-slate-900/95 backdrop-blur z-20 sticky top-0 shadow-lg border-b border-white/10">
                <div className="p-4 text-center">
                    <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400">РЕЗУЛЬТАТЫ</h2>
                </div>
                 <LiveLeaderboard players={players} submittedIds={[]} roundDeltas={roundResults.deltas} />
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 pb-24">
                {shuffledAnswers.map(ans => {
                    const isMyOwn = ans.authorId === myId;
                    const author = ans.authorId === 'ai' ? { name: 'AI', isAi: true, isOnline: true } : players.find(p => p.id === ans.authorId);
                    const myGuess = guesses[ans.id];
                    const othersForThis = roundResults.votes[ans.id] || [];
                    const getVoter = (playerId) => players.find(pl => pl.id === playerId);
                    
                    let scoreDelta = 0;
                    if (myGuess) {
                        if (myGuess.type === 'ai' && ans.authorId === 'ai') scoreDelta = 100;
                        else if (myGuess.type === 'human' && myGuess.playerId === ans.authorId) scoreDelta = 25;
                        else scoreDelta = -50;
                    }

                    const deceivedCount = othersForThis.filter(v => v.isDeceived).length;
                    const deceptionPoints = isMyOwn ? deceivedCount * 108 : 0;

                    let cardStyleClass = 'bg-slate-800 border-slate-700 shadow-none'; 
                    if (!isMyOwn && myGuess) {
                        if (scoreDelta > 0) cardStyleClass = 'bg-green-900/50 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)]';
                        else cardStyleClass = 'bg-red-900/50 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]';
                    }
                    if (ans.authorId === 'ai') {
                         if (!myGuess) cardStyleClass = 'bg-slate-800 border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.2)]';
                    }

                    const correctVotes = othersForThis.filter(v => v.isCorrect);
                    const deceivedVotes = othersForThis.filter(v => !v.isCorrect && v.isDeceived);
                    const wrongVotes = othersForThis.filter(v => !v.isCorrect && !v.isDeceived);

                    return (
                        <div key={ans.id} className={`flex w-full ${isMyOwn ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex items-start gap-3 max-w-[98%] ${isMyOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className="shrink-0 flex flex-col items-center">
                                    <div className={`transition-all duration-500 ${!author?.isOnline && !author?.isAi ? 'grayscale opacity-50' : ''}`}>
                                        <Avatar name={author?.name} isAi={author?.isAi} avatarUrl={author?.avatar} size="sm"/>
                                    </div>
                                    {!author?.isOnline && !author?.isAi && (
                                        <span className="text-[8px] text-red-400 font-bold bg-black/50 px-1 rounded mt-[-5px] z-10">OFFLINE</span>
                                    )}
                                </div>
                                <div className={`relative p-4 rounded-2xl border min-w-[140px] w-full transition-all duration-500 ${isMyOwn ? 'bg-slate-800/50 border-slate-600 rounded-tr-none text-slate-300' : `rounded-tl-none ${cardStyleClass}`}`}>
                                    {!isMyOwn && <div className={`text-[10px] font-bold mb-1 uppercase tracking-wide ${author?.isAi ? 'text-purple-400' : 'text-slate-400'}`}>{author?.isAi ? 'Тостик' : author?.name}</div>}
                                    <p className="text-sm text-white leading-relaxed">{ans.text}</p>
                                    
                                    {myGuess && !isMyOwn && <div className={`absolute -top-3 -right-2 px-2 py-1 rounded-lg border shadow-lg transform rotate-6 font-black text-sm z-10 flex items-center gap-1 ${scoreDelta > 0 ? 'bg-green-500 text-black border-green-400' : 'bg-red-500 text-white border-red-600'}`}>{scoreDelta > 0 ? '+' : ''}{scoreDelta}</div>}
                                    
                                    {isMyOwn && deceptionPoints > 0 && (
                                         <div className="absolute -top-4 -left-2 px-2 py-1 rounded-lg bg-purple-600 border border-purple-400 text-white text-xs font-bold shadow-lg transform -rotate-3 z-10 flex items-center gap-1">
                                             <Drama size={12} /> <span>+{deceptionPoints}</span>
                                         </div>
                                    )}

                                    {(othersForThis.length > 0) && (
                                        <div className="mt-3 pt-2 border-t border-white/5 flex flex-wrap gap-y-2 gap-x-4">
                                            {correctVotes.length > 0 && (
                                                <div className="flex items-center gap-1">
                                                    <CheckCircle size={14} className="text-green-500/70" />
                                                    <div className="flex -space-x-2">
                                                        {correctVotes.map((vote, i) => {
                                                            const voter = getVoter(vote.playerId);
                                                            return <div key={i} className="rounded-full border-2 border-slate-900 relative z-10"><Avatar name={voter?.name} avatarUrl={voter?.avatar} size="xs" /></div>;
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                            {deceivedVotes.length > 0 && (
                                                <div className="flex items-center gap-1">
                                                    <Drama size={14} className="text-purple-400/80" />
                                                    <div className="flex -space-x-2">
                                                        {deceivedVotes.map((vote, i) => {
                                                            const voter = getVoter(vote.playerId);
                                                            return <div key={i} className="rounded-full border-2 border-purple-900/50 ring-1 ring-purple-500 relative z-10 grayscale-[30%]"><Avatar name={voter?.name} avatarUrl={voter?.avatar} size="xs" /></div>;
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                            {wrongVotes.length > 0 && (
                                                <div className="flex items-center gap-1">
                                                    <XCircle size={14} className="text-red-500/70" />
                                                    <div className="flex -space-x-2">
                                                        {wrongVotes.map((vote, i) => {
                                                            const voter = getVoter(vote.playerId);
                                                            return <div key={i} className="rounded-full border-2 border-slate-900 relative z-10 grayscale opacity-70"><Avatar name={voter?.name} avatarUrl={voter?.avatar} size="xs" /></div>;
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* --- [UPDATED] REACTION BAR --- */}
                <div className="fixed bottom-24 left-0 right-0 z-50 pointer-events-none animate-fade-in-up">
                     <div className="flex justify-center">
                        <div className="pointer-events-auto flex gap-3 px-4 py-3 rounded-full bg-slate-900/40 backdrop-blur-xl border border-white/10 shadow-xl">
                            {REACTIONS_LIST.map(emoji => (
                                <button
                                    key={emoji}
                                    onClick={() => sendReaction(emoji)}
                                    className="
                                        w-10 h-10 flex items-center justify-center rounded-full text-xl
                                        bg-white/5 border border-white/5 shadow-inner
                                        hover:bg-white/20 hover:scale-110 active:scale-95
                                        transition-all duration-300 ease-out
                                    "
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 z-30">
                {initialIsHost ? (
                    <Button onClick={handleNextRoundRequest} variant="primary">{currentRound < totalRounds ? 'СЛЕДУЮЩИЙ РАУНД' : 'ЗАВЕРШИТЬ ИГРУ'}</Button>
                ) : (
                    <div className="text-center text-slate-500 text-xs animate-pulse uppercase tracking-widest">Ожидание хоста...</div>
                )}
            </div>

            {/* --- [UPDATED] FLOATING REACTIONS RENDERER --- */}
            <style>{animationStyles}</style>
            <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
                {reactions.map(r => (
                    <div 
                        key={r.id} 
                        className="absolute text-4xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]" 
                        style={{ 
                            left: r.x,    
                            top: r.y,     
                            '--drift': `${r.drift}px`,
                            '--rot': `${r.rotation}deg`,
                            animation: 'floatUpFade 2s ease-out forwards'
                        }}
                    >
                        {r.emoji}
                    </div>
                ))}
            </div>
        </div>
      );
  }

  // --- WRITING PHASE ---
  return (
      <div className="flex flex-col h-screen relative">
        {renderHeader("text-cyan-400", "bg-cyan-400")}

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
                    {initialIsHost && (
                        <button onClick={() => socket.emit('dev_skip_timer', { roomId })} className="px-4 py-2 rounded-full border border-slate-700 text-xs text-slate-500 hover:text-white hover:border-white transition-colors">Dev: Skip Timer ⏩</button>
                    )}
                </div>
            )}
        </div>
        <style>{animationStyles}</style>
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
            {reactions.map(r => (
                <div 
                    key={r.id} 
                    className="absolute text-4xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]" 
                    style={{ 
                        left: r.x,    
                        top: r.y,     
                        '--drift': `${r.drift}px`,
                        '--rot': `${r.rotation}deg`,
                        animation: 'floatUpFade 2s ease-out forwards'
                    }}
                >
                    {r.emoji}
                </div>
            ))}
        </div>
      </div>
  );
};