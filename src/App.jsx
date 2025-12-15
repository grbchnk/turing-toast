import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom'; 
import WebApp from '@twa-dev/sdk'; // <--- Импорт SDK
import { socket } from './socket';
import { Home } from './screens/Home';
import { Game } from './screens/Game';

function App() {
  useEffect(() => {
    // 1. Говорим Телеграму, что приложение загрузилось
    WebApp.ready();
    WebApp.expand(); // Раскрыть на весь экран

    // 2. Достаем строку инициализации (в ней зашифрованы данные юзера)
    const initData = WebApp.initData;

    // 3. Прикрепляем её к сокету
    socket.auth = { initData }; 
    
    // 4. Подключаемся
    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    // ИЗМЕНЕНИЕ: Используем HashRouter
    <HashRouter>
      <div className="max-w-md mx-auto min-h-screen shadow-2xl overflow-hidden">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game" element={<Game />} />
        </Routes>
      </div>
    </HashRouter>
  );
}

export default App;