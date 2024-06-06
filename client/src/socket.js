// client/src/socket.js
import { io } from 'socket.io-client';

const URL = process.env.NODE_ENV === 'production'
    ? 'https://gamevo-server.onrender.com'
    : 'http://localhost:4000';  // or your local server URL during development

export const socket = io(URL, {
    transports: ['websocket'],
});
