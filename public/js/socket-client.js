// Socket.IO client configuration
const SOCKET_SERVER_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3001'
    : 'https://greatgriftoff-websocket-production.up.railway.app'; // Updated with Railway URL

function createSocketConnection(type = 'public') {
    const socket = io(SOCKET_SERVER_URL, {
        query: { type },
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        transports: ['websocket']
    });

    socket.on('connect', () => {
        console.log('Connected to Socket.IO server');
    });

    socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
    });

    socket.on('disconnect', (reason) => {
        console.log('Disconnected from Socket.IO server:', reason);
    });

    return socket;
} 