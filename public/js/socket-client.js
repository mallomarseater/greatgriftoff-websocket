// Socket.IO client configuration
const SOCKET_SERVER_URL = window.location.hostname === 'localhost' 
    ? 'ws://localhost:8080/ws'
    : 'wss://websocket.greatgriftoff.xyz/ws';

function createSocketConnection(type = 'public') {
    console.log('Initializing WebSocket connection...');
    console.log('Hostname:', window.location.hostname);
    console.log('WebSocket URL:', SOCKET_SERVER_URL);
    console.log('Client type:', type);
    
    const socket = new WebSocket(`${SOCKET_SERVER_URL}?type=${type}`);
    
    console.log('WebSocket object created, readyState:', socket.readyState);

    socket.onopen = () => {
        console.log('Connected to WebSocket server successfully');
        console.log('WebSocket readyState:', socket.readyState);
        // Request initial data
        socket.send(JSON.stringify({ type: 'getInitialData' }));
    };

    socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            console.log('Received WebSocket message:', data);
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
        // Log the full error object
        console.error('Full error object:', JSON.stringify(error, null, 2));
    };

    socket.onclose = (event) => {
        console.log('Disconnected from WebSocket server');
        console.log('Close event:', event);
        console.log('Reason:', event.reason);
        console.log('Code:', event.code);
        // Attempt to reconnect after a delay
        setTimeout(() => {
            console.log('Attempting to reconnect...');
            createSocketConnection(type);
        }, 5000);
    };

    return socket;
} 