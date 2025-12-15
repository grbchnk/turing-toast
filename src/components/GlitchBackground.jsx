import React from 'react';

export const GlitchBackground = () => {
  return (
    <div className="glitch-bg-container">
       {/* 1. Космос (Глючит) */}
       <div className="glitch-galaxy-layer"></div>
       
       {/* 2. Полосы (Статичные, твой любимый код) */}
       <div className="scanlines"></div>
       
       {/* 3. Шум (Слегка заметный) */}
       <div className="bg-noise"></div>
    </div>
  );
};