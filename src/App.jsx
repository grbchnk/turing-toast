import React, { useEffect, useState } from 'react';
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
