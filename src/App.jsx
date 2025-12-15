import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import { socket } from './socket';
import { Home } from './screens/Home';
import { Game } from './screens/Game';

function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Telegram SDK
    WebApp.ready();
    WebApp.expand();

    const initData = WebApp.initData;

    if (!initData) {
      console.warn('Telegram initData not ready yet');
      return;
    }

    socket.auth = { initData };
    socket.connect();

    setIsReady(true);

    return () => {
      socket.disconnect();
    };
  }, []);

  // 🔴 КРИТИЧНО: пока Telegram не готов — ничего не рендерим
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="max-w-md mx-auto min-h-screen shadow-2xl overflow-hidden">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game" element={<Game />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </div>
    </HashRouter>
  );
}

export default App;
