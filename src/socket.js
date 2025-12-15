import { io } from 'socket.io-client';

// Указываем URL сервера (для локальной разработки это localhost:3001)
const URL = 'https://turing-toast-server.onrender.com';

export const socket = io(URL, {
  autoConnect: false
});