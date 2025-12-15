import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { Button } from '../components/Button';
import { Avatar } from '../components/Avatar';
import { Toast } from '../components/Toast';
import { playSound, toggleMute, getMuteState } from '../utils/sounds';
import { 
    Users, Copy, Settings, ListFilter, AlertTriangle, 
    Volume2, VolumeX, BookOpen, Edit2, Check, X, Info, Share2 
} from 'lucide-react';
import WebApp from '@twa-dev/sdk';

// [CONFIG] Замените на вашу прямую ссылку (t.me/your_bot/appname)
// Если вы еще не создали Direct Link, можно использовать просто ссылку на бота: https://t.me/your_bot?start=
const BOT_APP_LINK = 'https://t.me/turingtoast_bot/turingtoast'; 

export const Home = () => {
  const navigate = useNavigate();
  
  // UI State
  const [view, setView] = useState('menu'); 
  const [toastMsg, setToastMsg] = useState(null);
  const [showRules, setShowRules] = useState(false);
  
  // Звук
  const [isMuted, setIsMuted] = useState(getMuteState());

  // Name Editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  
  // Game Data State
  const [roomId, setRoomId] = useState(null);
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  
  // Auto Join Ref to prevent double join
  const hasAutoJoined = useRef(false);

  // Settings State
  const [rounds, setRounds] = useState(5);
  const [timeLimit, setTimeLimit] = useState(60);
  const [availableTopics, setAvailableTopics] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]); 

  const [myProfile, setMyProfile] = useState(() => {
    const saved = localStorage.getItem('toast_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    const tgUser = WebApp.initDataUnsafe?.user;
    return {
      id: tgUser?.id ? String(tgUser.id) : 'guest',
      name: tgUser?.first_name || tgUser?.username || 'Загрузка...',
      avatar: tgUser?.photo_url || null
    };
  });

  // --- [NEW] AUTO JOIN LOGIC ---
  useEffect(() => {
      // 1. Расширяем WebApp при запуске
      WebApp.expand();

      // 2. Проверяем start_param (пришел ли юзер по ссылке приглашения)
      const startParam = WebApp.initDataUnsafe?.start_param;
      
      if (startParam && !hasAutoJoined.current) {
          console.log("Auto-joining room:", startParam);
          setJoinCode(startParam);
          hasAutoJoined.current = true; // Ставим флаг, чтобы не пытаться войти дважды
          
          // Небольшая задержка, чтобы сокет успел инициализироваться
          setTimeout(() => {
              socket.emit('join_room', { roomId: startParam.toUpperCase() });
          }, 500);
      }
  }, []);

  // --- SOCKET LISTENERS ---
  useEffect(() => {
    socket.emit('get_topics');

    socket.on('topics_list', (list) => {
        setAvailableTopics(list);
        if (selectedTopics.length === 0) {
            setSelectedTopics(list.slice(0, 3).map(t => t.id));
        }
    });

    socket.on('room_created', (room) => {
        setRoomId(room.id);
        setPlayers(room.players);
        setIsHost(true);
        setView('lobby');
        playSound('whoosh');
    });

    socket.on('profile', (serverProfile) => {
        if (!serverProfile) return;
        const updated = {
            id: String(serverProfile.id),
            name: serverProfile.name,
            avatar: serverProfile.avatar || null
        };
        localStorage.setItem('toast_profile', JSON.stringify(updated));
        setMyProfile(updated);
    });

    socket.on('joined_room', (room) => {
        setRoomId(room.id);
        setPlayers(room.players);
        setIsHost(false);
        setView('lobby');
        playSound('whoosh');
    });

    socket.on('update_players', (updatedPlayers) => {
        if (updatedPlayers.length > players.length && view === 'lobby') {
            playSound('pop');
        }
        setPlayers(updatedPlayers);
    });

    socket.on('error', (msg) => {
        setToastMsg(msg);
        playSound('buzz');
        // Если была ошибка при авто-входе, сбрасываем вид на меню
        if (view !== 'lobby') setView('menu');
    });

    socket.on('game_started', () => {
        playSound('start');
        navigate('/game', { state: { roomId, myProfile, isHost } });
    });

    return () => {
        socket.off('topics_list');
        socket.off('room_created');
        socket.off('joined_room');
        socket.off('update_players');
        socket.off('error');
        socket.off('game_started');
        socket.off('profile');
    };
  }, [roomId, myProfile, isHost, navigate, selectedTopics, players.length, view]);

  // --- HANDLERS ---
  
  const handleToggleMute = () => {
      const newState = toggleMute();
      setIsMuted(newState);
      if (!newState) playSound('click');
  };

  const handleCreateRoom = () => {
    playSound('click');
    socket.emit('create_room'); 
  };

  const handleJoinRoom = () => {
    if (!joinCode) return;
    playSound('click');
    socket.emit('join_room', { 
        roomId: joinCode.toUpperCase()
    });
  };

  const handleStartGame = () => {
      if (!isHost) return;
      playSound('click');
      socket.emit('start_game', { 
          roomId, 
          settings: { rounds, timeLimit, topics: selectedTopics } 
      });
  };

  const handleCopyCode = () => {
      playSound('click');
      navigator.clipboard.writeText(roomId);
      setToastMsg("Код скопирован!");
  };

  // [NEW] Share / Invite Friends Handler
  const handleInviteFriends = () => {
      playSound('click');
      
      // Формируем ссылку для запуска с параметром
      // Пример: https://t.me/MyBot/MyApp?startapp=X7Y99
      const inviteLink = `${BOT_APP_LINK}?startapp=${roomId}`;
      
      const text = `Залетай в Тост Тьюринга! Код комнаты: ${roomId}`;
      
      // Формируем Telegram Share Link
      // https://t.me/share/url?url={link}&text={text}
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(text)}`;
      
      // Открываем нативную шторку Telegram
      WebApp.openTelegramLink(shareUrl);
  };

  const toggleTopic = (id) => {
      if (!isHost) return;
      playSound('click');
      setSelectedTopics(prev => 
          prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
      );
  };

  const saveName = () => {
    const newName = tempName.trim().substring(0, 12);
    if (!newName) return;

    playSound('click');
    setMyProfile(prev => {
        const updated = { ...prev, name: newName };
        localStorage.setItem('toast_profile', JSON.stringify(updated));
        return updated;
    });

    socket.emit('update_profile', { name: newName });
    setIsEditingName(false);
  };

  const startEditing = () => {
      playSound('click');
      setTempName(myProfile.name);
      setIsEditingName(true);
  };

  // --- COMPONENT: RULES MODAL ---
  const RulesModal = () => (
      <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
          <div className="glass bg-slate-900/90 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto border border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.2)]">
              <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 uppercase">
                          Правила Игры
                      </h2>
                      <button onClick={() => { playSound('click'); setShowRules(false); }} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
                  </div>
                  {/* ... (содержимое правил без изменений) ... */}
                  <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
                      <section>
                          <h3 className="flex items-center gap-2 font-bold text-white mb-2 uppercase tracking-wider text-xs">
                              <Info size={14} className="text-cyan-400" /> Суть игры
                          </h3>
                          <p>
                                Это цифровой тест Тьюринга. Среди игроков скрывается нейросеть по имени <b>Тост</b>. 
                                Твоя задача — вычислить, какой из ответов принадлежит боту, и одновременно постараться запутать остальных.
                                Каждый сам за себя!
                          </p>
                      </section>

                      <section>
                          <h3 className="flex items-center gap-2 font-bold text-white mb-2 uppercase tracking-wider text-xs">
                              <ListFilter size={14} className="text-purple-400" /> Ход раунда
                          </h3>
                          <ol className="list-decimal pl-4 space-y-2 marker:text-slate-500">
                              <li><b>Ответ:</b> Все получают вопрос. У тебя есть время, чтобы придумать смешной или умный ответ.</li>
                              <li><b>Голосование:</b> Ты видишь все ответы анонимно. Попробуй угадать, какой ответ написал Бот, а какие — твои друзья.</li>
                              <li><b>Результаты:</b> Вскрываем карты и раздаем баллы.</li>
                          </ol>
                      </section>

                      <section className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
                          <h3 className="flex items-center gap-2 font-bold text-white mb-3 uppercase tracking-wider text-xs">
                              <AlertTriangle size={14} className="text-yellow-400" /> Начисление очков
                          </h3>
                          <div className="grid grid-cols-1 gap-2">
                              <div className="flex justify-between items-center border-b border-white/5 pb-1">
                                  <span>🕵️ Нашел Бота</span>
                                  <span className="font-bold text-green-400">+100</span>
                              </div>
                              <div className="flex justify-between items-center border-b border-white/5 pb-1">
                                  <span>🤝 Угадал друга</span>
                                  <span className="font-bold text-cyan-400">+25</span>
                              </div>
                              <div className="flex justify-between items-center border-b border-white/5 pb-1">
                                  <span>🎭 Тебя спутали с Ботом</span>
                                  <span className="font-bold text-purple-400">+108</span>
                              </div>
                              <div className="flex justify-between items-center">
                                  <span>❌ Ошибся</span>
                                  <span className="font-bold text-red-400">-50</span>
                              </div>
                          </div>
                      </section>
                  </div>

                  <div className="mt-8">
                      <Button onClick={() => { playSound('click'); setShowRules(false); }}>ПОНЯТНО, ПОГНАЛИ!</Button>
                  </div>
              </div>
          </div>
      </div>
  );

  // --- RENDER ---
  if (view === 'menu') {
    return (
      <div className="flex flex-col h-screen p-6 justify-center items-center relative overflow-hidden">
        {showRules && <RulesModal />}

        {/* Верхняя панель */}
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-20">
            {/* Профиль */}
            <div className="flex items-center gap-3 animate-fade-in-down">
                <div className="relative group cursor-pointer" onClick={startEditing}>
                    <div className="ring-2 ring-purple-500/50 rounded-full p-0.5 hover:ring-cyan-400 transition-all">
                        <Avatar
                            name={myProfile.name}
                            avatarUrl={myProfile.avatar}
                            size="md"
                        />
                    </div>
                </div>
                
                {isEditingName ? (
                    <div className="flex items-center gap-2 bg-slate-800/80 p-1 pl-3 rounded-xl border border-purple-500/50 animate-scale-in">
                        <input 
                            autoFocus
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveName()}
                            className="bg-transparent border-none outline-none text-white font-bold w-24 text-sm"
                            placeholder="Имя..."
                        />
                        <button onClick={saveName} className="p-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500 hover:text-white transition-all">
                            <Check size={14} />
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-start">
                        <div className="flex items-center gap-2 group">
                             <span className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">{myProfile.name}</span>
                             <button onClick={startEditing} className="text-slate-500 hover:text-white transition-colors">
                                 <Edit2 size={14} />
                             </button>
                        </div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Игрок</span>
                    </div>
                )}
            </div>

            {/* Настройки */}
            <div className="flex items-center gap-3 animate-fade-in-down delay-100">
                <button 
                    onClick={handleToggleMute} 
                    className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${isMuted ? 'bg-slate-800 text-red-400 border-red-900/50' : 'bg-slate-800/50 text-slate-400 border-white/10 hover:bg-slate-700 hover:text-white'}`}
                >
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <button 
                    onClick={() => { playSound('click'); setShowRules(true); }}
                    className="w-10 h-10 rounded-full bg-slate-800/50 border border-white/10 text-cyan-400 flex items-center justify-center hover:bg-cyan-500/20 hover:border-cyan-400 transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                >
                    <BookOpen size={18} />
                </button>
            </div>
        </div>

        <div className="text-center z-10 mb-12 flex flex-col items-center animate-fade-in-up">
          <img src="./toast.png" alt="Toast" className="w-40 h-40 object-contain mb-4 animate-float drop-shadow-[0_0_25px_rgba(192,132,252,0.4)]" />
          <h1 className="text-6xl font-black italic tracking-tighter text-neon-outline uppercase leading-[0.9]">
            ТОСТ<br/>ТЬЮРИНГА
          </h1>
          <p className="text-cyan-200/70 mt-4 text-sm uppercase tracking-[0.3em]">Neural Party Game</p>
        </div>

        <div className="w-full space-y-4 z-10 max-w-xs animate-fade-in-up delay-100">
          <Button variant="neon" onClick={handleCreateRoom}>СОЗДАТЬ КОМНАТУ</Button>
          <Button variant="secondary" onClick={() => { playSound('click'); setView('join_code_input'); }}>ПРИСОЕДИНИТЬСЯ</Button>
        </div>
      </div>
    );
  }
  
  if (view === 'join_code_input') {
      return (
          <div className="flex flex-col h-screen p-6 justify-center">
              <h2 className="text-2xl font-bold text-center mb-6">Введи код</h2>
              <input 
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="X7Y99" 
                className="bg-slate-800/80 border border-slate-600 p-4 text-white text-center text-2xl mb-6 uppercase tracking-widest focus:border-cyan-400 focus:outline-none" 
              />
              <Button onClick={handleJoinRoom}>Войти</Button>
              <Button variant="secondary" className="mt-4" onClick={() => { playSound('click'); setView('menu'); }}>Назад</Button>
          </div>
      )
  }

  // --- LOBBY VIEW ---
  return (
    <div className="flex flex-col h-screen relative">
      <Toast message={toastMsg} onClose={() => setToastMsg(null)} />

      {/* Header Lobby */}
      <div className="p-6 pb-2 flex justify-between items-start z-10">
         <button onClick={() => { playSound('click'); setView('menu'); }} className="text-slate-400 hover:text-white transition-colors text-sm font-bold flex items-center gap-1">
             ← Меню
         </button>
         
         <div className="text-right">
             <button 
                onClick={handleCopyCode}
                className="active:scale-95 transition-transform bg-slate-800/60 backdrop-blur px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-3 hover:bg-slate-700/60"
             >
                 <div className="flex flex-col items-end leading-none">
                     <span className="text-[9px] text-slate-500 uppercase font-bold">Код комнаты</span>
                     <span className="text-xl font-mono font-bold text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">
                        {roomId || '...'}
                     </span>
                 </div>
                 <Copy size={16} className="text-slate-400"/>
             </button>
         </div>
      </div>

      <div className="px-6 py-2">
          {/* Заголовок и кнопка приглашения */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2 text-purple-300 font-bold text-sm uppercase tracking-wide">
                <Users size={16} /> <span>Игроки ({players.length})</span>
            </div>
            {/* [NEW] INVITE BUTTON */}
            <button 
                onClick={handleInviteFriends}
                className="flex items-center gap-1.5 bg-green-600/20 hover:bg-green-600/40 text-green-400 text-[10px] font-bold uppercase py-1 px-2.5 rounded-lg border border-green-500/30 transition-all active:scale-95"
            >
                <Share2 size={12} />
                <span>Пригласить</span>
            </button>
          </div>
          
          <div className="flex flex-wrap gap-1 overflow-y-auto max-h-[15vh]">
              {players.map((p, index) => (
                  <div key={p.id || index} className="flex flex-col items-center animate-fade-in-up flex-grow basis-14 min-w-[3.5rem]">
                      <div className="relative">
                        <Avatar
                            name={p.name}
                            avatarUrl={p.avatar || p.avatar_url}
                            size="sm"
                            />
                        {p.socketId === players[0]?.socketId && (
                           <div className="absolute -top-1 -right-1 text-[10px]">👑</div>
                        )}
                      </div>
                      <span className="text-[9px] mt-1 text-slate-300 font-bold uppercase truncate w-full text-center">{p.name}</span>
                  </div>
              ))}
          </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-24">
          {isHost ? (
              <>
                <div className="mb-4 p-4 rounded-xl glass">
                    <div className="flex items-center gap-2 mb-3 text-cyan-300 font-bold text-xs uppercase tracking-wide">
                        <Settings size={14} /> <span>Настройки</span>
                    </div>
                    
                    <div className="mb-4">
                        <div className="flex justify-between text-[10px] mb-1 text-slate-400 font-bold">
                            <span>РАУНДОВ</span>
                            <span className="text-white">{rounds}</span>
                        </div>
                        <input 
                           type="range" min="1" max="10" value={rounds} 
                           onChange={(e) => setRounds(e.target.value)}
                           className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between text-[10px] mb-1 text-slate-400 font-bold">
                            <span>ВРЕМЯ НА ОТВЕТ</span>
                            <span className="text-white">{timeLimit} сек</span>
                        </div>
                        <input 
                           type="range" min="30" max="120" step="10" value={timeLimit} 
                           onChange={(e) => setTimeLimit(e.target.value)}
                           className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-400"
                        />
                    </div>
                </div>

                <div>
                     <div className="flex items-center gap-2 mb-3 text-pink-300 font-bold text-sm uppercase tracking-wide">
                        <ListFilter size={16} /> <span>Темы вопросов</span>
                    </div>
                    
                    {availableTopics.length === 0 ? (
                        <div className="text-center text-slate-500 text-xs py-4">Загрузка тем...</div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            {availableTopics.map(topic => {
                                const isSelected = selectedTopics.includes(topic.id);
                                return (
                                    <button 
                                      key={topic.id}
                                      onClick={() => toggleTopic(topic.id)}
                                      className={`
                                          relative p-2 pl-3 rounded-xl border text-left flex flex-row items-center gap-3 transition-all
                                          ${isSelected 
                                              ? 'bg-purple-900/30 border-purple-400/60 shadow-[0_0_10px_rgba(192,132,252,0.2)]' 
                                              : 'bg-slate-800/40 border-slate-700 opacity-60 hover:opacity-100'
                                          }
                                      `}
                                    >
                                        <div className={`text-xl ${isSelected ? 'scale-110' : 'grayscale'}`}>
                                            {topic.emoji}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className={`text-[11px] font-bold leading-tight truncate ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                                                {topic.name}
                                            </div>
                                            <div className="text-[8px] text-slate-500 truncate">{topic.desc}</div>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>
              </>
          ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-60 animate-pulse">
                  <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                      <Settings className="text-slate-500" size={32} />
                  </div>
                  <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-300">Ожидание запуска игры...</p>
                      <p className="text-xs text-slate-500 max-w-[200px] mx-auto">
                          Да что там такое? Когда все зайдут? Давайте запускайте уже!
                      </p>
                  </div>
              </div>
          )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 pt-4 bg-gradient-to-t from-black via-black/95 to-transparent z-20">
        {!isHost && <div className="text-center text-slate-500 animate-pulse text-xs font-mono py-2 mb-2">ХОСТ НАСТРАИВАЕТ ИГРУ...</div>}
        
        {isHost ? (
             <Button onClick={handleStartGame} variant="primary" className="shadow-[0_0_25px_rgba(6,182,212,0.4)]">
                 НАЧАТЬ ИГРУ
             </Button>
        ) : (
            <Button variant="secondary" disabled>ОЖИДАНИЕ ХОСТА</Button>
        )}
      </div>
    </div>
  );
};