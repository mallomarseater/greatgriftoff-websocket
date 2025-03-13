// Socket.IO client configuration
const SOCKET_SERVER_URL = window.location.hostname === 'localhost' 
    ? 'ws://localhost:8080/ws'
    : 'wss://websocket.greatgriftoff.xyz/ws';

function createSocketConnection(type = 'public') {
    console.log('Initializing WebSocket connection to:', SOCKET_SERVER_URL);
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
        // Log more details about the error
        if (error.target && error.target.readyState) {
            console.error('WebSocket readyState:', error.target.readyState);
        }
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