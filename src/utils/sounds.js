import { Howl } from 'howler';

const soundFiles = {
    click: '/sounds/click.mp3',
    pop: '/sounds/pop.mp3',
    whoosh: '/sounds/whoosh.mp3',
    start: '/sounds/start.mp3',
    ding: '/sounds/ding.mp3',
    buzz: '/sounds/buzz.mp3',
};

const sounds = {};

// Инициализация звуков
Object.keys(soundFiles).forEach(key => {
    sounds[key] = new Howl({
        src: [soundFiles[key]],
        volume: 0.5, // Громкость по умолчанию (50%)
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