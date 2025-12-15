// frontend/src/utils/sounds.js
import { Howl } from 'howler';

// Получаем базовый путь (на localhost это '/', на GitHub Pages это '/имя-репо/')
const BASE_URL = import.meta.env.BASE_URL;

const soundFiles = {
    // Склеиваем базу и путь к файлу. 
    // Обрати внимание: мы убрали слеш в начале имен файлов, так как BASE_URL уже содержит его в конце.
    click: `${BASE_URL}sounds/click.mp3`,
    pop: `${BASE_URL}sounds/pop.mp3`,
    whoosh: `${BASE_URL}sounds/whoosh.mp3`,
    start: `${BASE_URL}sounds/start.mp3`,
    ding: `${BASE_URL}sounds/ding.mp3`,
    buzz: `${BASE_URL}sounds/buzz.mp3`,
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
        sounds[name].rate(0.9 + Math.random() * 0.2); 
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