// Socket.IO client configuration
console.log('Loading socket-client.js v6 - FIXED VERSION');
console.log('WebSocket URL:', 'wss://greatgriftoff-websocket-production.up.railway.app/ws');

const SOCKET_SERVER_URL = 'wss://greatgriftoff-websocket-production.up.railway.app/ws';

let socket = null;
let pollingInterval = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 5000;
let connectionReadyCallbacks = [];
let messageQueue = [];

function onConnectionReady(callback) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        callback();
    } else {
        connectionReadyCallbacks.push(callback);
    }
}

function sendMessage(message) {
    console.log('Attempting to send message:', message);
    if (socket && socket.readyState === WebSocket.OPEN) {
        console.log('WebSocket is open, sending message immediately');
        socket.send(JSON.stringify(message));
    } else {
        console.log('WebSocket not ready, queueing message');
        messageQueue.push(message);
    }
}

function processMessageQueue() {
    console.log('Processing message queue:', messageQueue);
    while (messageQueue.length > 0 && socket && socket.readyState === WebSocket.OPEN) {
        const message = messageQueue.shift();
        console.log('Sending queued message:', message);
        socket.send(JSON.stringify(message));
    }
}

function handleWebSocketError(error, type) {
    console.error(`WebSocket error for ${type} client:`, {
        error: error,
        readyState: socket ? socket.readyState : 'socket is null',
        url: SOCKET_SERVER_URL,
        timestamp: new Date().toISOString(),
        browser: navigator.userAgent
    });

    // Log additional error details if available
    if (error.target) {
        console.error('Error target details:', {
            readyState: error.target.readyState,
            url: error.target.url,
            protocol: error.target.protocol
        });
    }

    // Check if the error is related to SSL/TLS
    if (error.message && error.message.includes('SSL')) {
        console.error('SSL/TLS connection error detected');
    }

    // Check if the error is related to network connectivity
    if (!navigator.onLine) {
        console.error('No internet connection detected');
    }

    // Log the current page URL and protocol
    console.error('Current page details:', {
        url: window.location.href,
        protocol: window.location.protocol,
        hostname: window.location.hostname
    });
}

function createSocketConnection(type = 'public') {
    console.log('Initializing WebSocket connection...');
    console.log('Hostname:', window.location.hostname);
    console.log('Protocol:', window.location.protocol);
    console.log('WebSocket URL:', SOCKET_SERVER_URL);
    console.log('Client type:', type);
    
    try {
        // Use the configured URL directly since it's already set up for the correct protocol
        const wsUrl = SOCKET_SERVER_URL;
        console.log('Final WebSocket URL:', wsUrl);
        
        socket = new WebSocket(`${wsUrl}?type=${type}`);
        console.log('WebSocket object created, readyState:', socket.readyState);

        socket.onopen = () => {
            console.log('Connected to WebSocket server successfully');
            console.log('WebSocket readyState:', socket.readyState);
            reconnectAttempts = 0; // Reset reconnect attempts on successful connection
            // Request initial data
            socket.send(JSON.stringify({ type: 'getInitialData' }));
            // Process any queued messages
            processMessageQueue();
            // Call any pending callbacks
            connectionReadyCallbacks.forEach(callback => callback());
            connectionReadyCallbacks = [];
        };

        socket.onclose = (event) => {
            console.log('WebSocket connection closed:', event);
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                console.log(`Attempting to reconnect (${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})...`);
                setTimeout(() => {
                    reconnectAttempts++;
                    createSocketConnection(type);
                }, RECONNECT_DELAY);
            } else {
                console.error('Max reconnection attempts reached');
            }
        };

        socket.onerror = (error) => {
            handleWebSocketError(error, type);
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('Received message:', data);
                if (window.handleWebSocketMessage) {
                    window.handleWebSocketMessage(data);
                } else {
                    console.warn('No message handler defined');
                }
            } catch (error) {
                console.error('Error processing message:', error);
            }
        };

        return socket;
    } catch (error) {
        console.error('Error creating WebSocket connection:', error);
        handleWebSocketError(error, type);
        return null;
    }
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

// Export functions to global scope
window.createSocketConnection = createSocketConnection;
window.onConnectionReady = onConnectionReady;
window.sendMessage = sendMessage; 