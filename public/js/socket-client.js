// Socket.IO client configuration
const SOCKET_SERVER_URL = window.location.hostname === 'localhost' 
    ? 'ws://localhost:3001/ws'
    : 'wss://greatgriftoff-websocket-production.up.railway.app/ws';

function createSocketConnection(type = 'public') {
    const socket = new WebSocket(`${SOCKET_SERVER_URL}?type=${type}`);

    socket.onopen = () => {
        console.log('Connected to WebSocket server');
        // Request initial data
        socket.send(JSON.stringify({ type: 'getInitialData' }));
    };

    socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    };

    socket.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    socket.onclose = (event) => {
        console.log('Disconnected from WebSocket server:', event.reason);
        // Attempt to reconnect after a delay
        setTimeout(() => {
            console.log('Attempting to reconnect...');
            createSocketConnection(type);
        }, 5000);
    };

    return socket;
} 