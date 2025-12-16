// frontend/src/utils/sounds.js
import { Howl } from 'howler';

// Получаем базовый путь (на localhost это '/', на GitHub Pages это '/имя-репо/')
const BASE_URL = import.meta.env.BASE_URL;

const soundFiles = {
    click: `${BASE_URL}sounds/click.mp3`,
    pop: `${BASE_URL}sounds/pop.mp3`,
    whoosh: `${BASE_URL}sounds/whoosh.mp3`,
    start: `${BASE_URL}sounds/start.mp3`,
    ding: `${BASE_URL}sounds/ding.mp3`,
    buzz: `${BASE_URL}sounds/buzz.mp3`,
    
    // --- НОВЫЕ ЗВУКИ ---
    slider: `${BASE_URL}sounds/slider.mp3`, // Тот, что мы чинили шагом ранее
    join: `${BASE_URL}sounds/join.mp3`,     // Для входа игрока
    leave: `${BASE_URL}sounds/leave.mp3`,    // Для выхода игрока
    ping: `${BASE_URL}sounds/ping.mp3`, // Тот, что мы чинили шагом ранее
    correct: `${BASE_URL}sounds/correct.mp3`,     // Для входа игрока
    miss: `${BASE_URL}sounds/miss.mp3`,    // Для выхода игрока
};

const sounds = {};

// Инициализация звуков
Object.keys(soundFiles).forEach(key => {
    sounds[key] = new Howl({
        src: [soundFiles[key]],
        volume: 0.5, // Громкость по умолчанию (50%)
        preload: true, // Предзагрузка, чтобы не было задержек
    });
});

// Состояние звука (читаем из localStorage при старте)
let isMuted = localStorage.getItem('isMuted') === 'true';

export const playSound = (name) => {
    if (isMuted || !sounds[name]) return;
    
    // Если это "шлейфовый" звук типа whoosh, стопаем предыдущий, чтобы не накладывался грязно
    if (name === 'whoosh') {
        sounds[name].stop();
    }
    
    // Немного рандомизируем "pop", чтобы когда голосуют много людей, звучало живее
    if (name === 'pop') {
        sounds[name].rate(0.9 + Math.random() * 0.3); 
    } else {
        sounds[name].rate(1.0);
    }

    sounds[name].play();
};

export const toggleMute = () => {
    isMuted = !isMuted;
    localStorage.setItem('isMuted', isMuted);
    return isMuted; // Возвращаем новое состояние
};

export const getMuteState = () => {
    return isMuted;
};