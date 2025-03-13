// Socket.IO client configuration
const SOCKET_SERVER_URL = window.location.hostname === 'localhost' 
    ? 'ws://localhost:8080/ws'
    : `wss://${window.location.host}/ws`;

let socket = null;
let pollingInterval = null;

function createSocketConnection(type = 'public') {
    console.log('Initializing WebSocket connection...');
    console.log('Hostname:', window.location.hostname);
    console.log('WebSocket URL:', SOCKET_SERVER_URL);
    console.log('Client type:', type);
    
    try {
        socket = new WebSocket(`${SOCKET_SERVER_URL}?type=${type}`);
        console.log('WebSocket object created, readyState:', socket.readyState);

        socket.onopen = () => {
            console.log('Connected to WebSocket server successfully');
            console.log('WebSocket readyState:', socket.readyState);
            // Request initial data
            socket.send(JSON.stringify({ type: 'getInitialData' }));
            // Clear polling if it was active
            if (pollingInterval) {
                clearInterval(pollingInterval);
                pollingInterval = null;
            }
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
            // Fallback to polling if WebSocket fails
            startPolling(type);
        };

        socket.onclose = (event) => {
            console.log('Disconnected from WebSocket server');
            console.log('Close event:', event);
            console.log('Reason:', event.reason);
            console.log('Code:', event.code);
            // Fallback to polling if WebSocket disconnects
            startPolling(type);
        };
    } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        // Fallback to polling if WebSocket creation fails
        startPolling(type);
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
        const response = await fetch(`${SOCKET_SERVER_URL.replace('ws', 'https')}/poll?type=${type}`);
        const data = await response.json();
        console.log('Received polling data:', data);
        handleWebSocketMessage(data);
    } catch (error) {
        console.error('Polling error:', error);
    }
}

// ... existing code ... 