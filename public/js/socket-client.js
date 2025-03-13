// Socket.IO client configuration
const SOCKET_SERVER_URL = window.location.hostname === 'localhost' 
    ? (window.location.protocol === 'https:' ? 'wss://localhost:8080/ws' : 'ws://localhost:8080/ws')
    : 'wss://websocket.greatgriftoff.xyz:8080/ws';

let socket = null;
let pollingInterval = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 5000;
let connectionReadyCallbacks = [];

function onConnectionReady(callback) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        callback();
    } else {
        connectionReadyCallbacks.push(callback);
    }
}

function createSocketConnection(type = 'public') {
    console.log('Initializing WebSocket connection...');
    console.log('Hostname:', window.location.hostname);
    console.log('Protocol:', window.location.protocol);
    console.log('WebSocket URL:', SOCKET_SERVER_URL);
    console.log('Client type:', type);
    
    try {
        socket = new WebSocket(`${SOCKET_SERVER_URL}?type=${type}`);
        console.log('WebSocket object created, readyState:', socket.readyState);

        socket.onopen = () => {
            console.log('Connected to WebSocket server successfully');
            console.log('WebSocket readyState:', socket.readyState);
            reconnectAttempts = 0; // Reset reconnect attempts on successful connection
            // Request initial data
            socket.send(JSON.stringify({ type: 'getInitialData' }));
            // Clear polling if it was active
            if (pollingInterval) {
                clearInterval(pollingInterval);
                pollingInterval = null;
            }
            // Call all pending ready callbacks
            connectionReadyCallbacks.forEach(callback => callback());
            connectionReadyCallbacks = [];
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
            if (error.target && error.target.readyState) {
                console.error('WebSocket readyState:', error.target.readyState);
            }
            console.error('Full error object:', JSON.stringify(error, null, 2));
            
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                reconnectAttempts++;
                console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
                setTimeout(() => {
                    createSocketConnection(type);
                }, RECONNECT_DELAY);
            } else {
                console.log('Max reconnection attempts reached, falling back to polling');
                startPolling(type);
            }
        };

        socket.onclose = (event) => {
            console.log('Disconnected from WebSocket server');
            console.log('Close event:', event);
            console.log('Reason:', event.reason);
            console.log('Code:', event.code);
            
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                reconnectAttempts++;
                console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
                setTimeout(() => {
                    createSocketConnection(type);
                }, RECONNECT_DELAY);
            } else {
                console.log('Max reconnection attempts reached, falling back to polling');
                startPolling(type);
            }
        };
    } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
            setTimeout(() => {
                createSocketConnection(type);
            }, RECONNECT_DELAY);
        } else {
            console.log('Max reconnection attempts reached, falling back to polling');
            startPolling(type);
        }
    }

    return socket;
}

function startPolling(type) {
    console.log('Starting polling fallback...');
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }
    
    // Initial request
    fetchData(type);
    
    // Set up polling every 5 seconds
    pollingInterval = setInterval(() => {
        fetchData(type);
    }, 5000);
}

async function fetchData(type) {
    try {
        // Ensure we're using HTTPS for polling when the page is loaded over HTTPS
        const pollingUrl = SOCKET_SERVER_URL
            .replace(/^ws[s]?:/, window.location.protocol === 'https:' ? 'https:' : 'http:')
            .replace(':8080', '');
        console.log('Polling URL:', pollingUrl);
        const response = await fetch(`${pollingUrl}/poll?type=${type}`);
        const data = await response.json();
        console.log('Received polling data:', data);
        handleWebSocketMessage(data);
    } catch (error) {
        console.error('Polling error:', error);
    }
}

// Export functions
window.createSocketConnection = createSocketConnection;
window.onConnectionReady = onConnectionReady; 