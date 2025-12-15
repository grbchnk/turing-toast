import React, { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import { socket } from './socket';
import { Home } from './screens/Home';
import { Game } from './screens/Game';

function App() {
  useEffect(() => {
    WebApp.ready();
    WebApp.expand();

    // initData может прийти позже — это нормально
    socket.auth = {
      initData: WebApp.initData || ''
    };

    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    // Обертка с relative, чтобы позиционировать фон
    // text-white задаем глобально, чтобы не писать везде
    <div className="relative min-h-screen overflow-hidden text-white selection:bg-cyan-500/30 font-sans">
      <HashRouter>
        <div className="max-w-md mx-auto min-h-screen relative z-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/game" element={<Game />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </div>
      </HashRouter>
    </div>
  );
}

export default App;