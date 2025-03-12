const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// WebSocket handling for Edge Functions
const wss = new WebSocket.Server({ 
    noServer: true,
    perMessageDeflate: false
});

// Handle upgrade events
server.on('upgrade', async (request, socket, head) => {
    if (!request.url.startsWith('/ws')) {
        socket.destroy();
        return;
    }

    try {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    } catch (err) {
        console.error('WebSocket upgrade error:', err);
        socket.destroy();
    }
});

// Store connected clients
const clients = {
    admin: null,
    public: null,
    players: new Set()
};

// Game state
let gameState = {
    phase: 'Markets Closed',
    timeRemaining: 60,
    funds: [
        { id: 'trump_coin', name: 'Trump Coin', price: 100, trend: 0.02, volatility: 0.2 },
        { id: 'checkpoint', name: 'Checkpoint Therapeutics', price: 50, trend: -0.01, volatility: 0.1 },
        { id: 'boeing', name: 'Boeing Co.', price: 200, trend: -0.005, volatility: 0.05 },
        { id: 'luigi', name: 'Luigi Mangione Legal Fund', price: 75, trend: 0.015, volatility: 0.08 },
        { id: 'taylor', name: "Taylor Swift's Eras Tour Treasury", price: 150, trend: 0.03, volatility: 0.05 }
    ],
    pendingOrders: [],
    players: [],
    pendingMarketImpacts: []
};

let priceUpdateInterval = null;

// Market event handlers
const marketEvents = {
    trump_executive_order: (fund) => {
        fund.price *= 1.4;
        return 'Trump Executive Order (+40%)';
    },
    trump_rug_pull: (fund) => {
        fund.price *= 0.1;
        return 'Rug Pull (-90%)';
    },
    checkpoint_fda_rejection: (fund) => {
        fund.price *= 0.65;
        return 'FDA Rejection (-35%)';
    },
    boeing_no_chairs: (fund) => {
        fund.price *= 1.3;
        return 'No Chairs (+30%)';
    },
    boeing_doors_off: (fund) => {
        fund.price *= 0.8;
        return 'Doors Fall Off (-20%)';
    },
    luigi_green_sweater: (fund) => {
        fund.price *= 1.69;
        return 'Green Sweater (+69%)';
    },
    taylor_new_dates: (fund) => {
        fund.price *= 1.4;
        return 'New Tour Dates (+40%)';
    },
    taylor_engagement: (fund) => {
        fund.price *= 0.75;
        return 'Engagement Rumors (-25%)';
    }
};

// Update fund prices periodically
function updateFundPrices() {
    // Only update prices during "Markets Closed" phase
    if (gameState.phase === 'Markets Closed') {
        gameState.funds.forEach(fund => {
            // Calculate trend-based movement
            const trendMovement = fund.price * fund.trend;
            
            // Add random volatility
            const volatility = fund.price * fund.volatility;
            const randomMovement = (Math.random() - 0.5) * volatility;
            
            // Update price
            fund.price += trendMovement + randomMovement;
            
            // Ensure price doesn't go below 0.01
            fund.price = Math.max(0.01, fund.price);
        });
        
        // Broadcast updated funds to all clients
        broadcast({
            type: 'fundsUpdate',
            funds: gameState.funds
        });
        
        // Also broadcast player updates to reflect new portfolio values
        gameState.players.forEach(player => {
            broadcast({
                type: 'playerUpdate',
                player: player
            });
        });
    }
}

// Start price updates when game starts
function startGame() {
    console.log('Starting game...');
    gameState.phase = 'Markets Closed';
    gameState.timeRemaining = 60;
    gameState.pendingMarketImpacts = [];
    
    // Clear any existing interval
    if (priceUpdateInterval) {
        clearInterval(priceUpdateInterval);
    }
    
    // Start periodic price updates
    priceUpdateInterval = setInterval(updateFundPrices, 5000); // Update every 5 seconds
    
    // Broadcast game start to all clients
    broadcast({
        type: 'gameStarted',
        phase: gameState.phase,
        timeRemaining: gameState.timeRemaining,
        funds: gameState.funds
    });
}

// Handle market events
function handleMarketEvent(eventType, fundId) {
    const fund = gameState.funds.find(f => f.id === fundId);
    if (fund && marketEvents[eventType]) {
        const message = marketEvents[eventType](fund);
        
        // Broadcast the event and updated fund prices
        broadcast({
            type: 'marketEvent',
            event: message,
            fundId: fundId,
            newPrice: fund.price
        });
        
        broadcast({
            type: 'fundsUpdate',
            funds: gameState.funds
        });
    }
}

// Handle game state changes
function handleGameStateChange(type) {
    console.log('Handling game state change:', type);
    switch(type) {
        case 'startGame':
            startGame();
            break;
        case 'endGame':
            // Stop price updates
            if (priceUpdateInterval) {
                clearInterval(priceUpdateInterval);
                priceUpdateInterval = null;
            }
            broadcast({
                type: 'gameEnded'
            });
            break;
        case 'resetGame':
            // Reset game state
            if (priceUpdateInterval) {
                clearInterval(priceUpdateInterval);
                priceUpdateInterval = null;
            }
            gameState.phase = 'Markets Closed';
            gameState.timeRemaining = 60;
            gameState.pendingMarketImpacts = [];
            gameState.funds.forEach(fund => {
                fund.price = fund.initialPrice || fund.price;
            });
            broadcast({
                type: 'gameReset',
                funds: gameState.funds
            });
            break;
    }
}

// WebSocket connection handling
wss.on('connection', (ws, req) => {
    console.log('New client connected');
    
    // Parse client type from URL
    const urlParams = new URLSearchParams(req.url.split('?')[1]);
    const clientType = urlParams.get('type') || 'public';
    
    // Add client to appropriate list
    if (clientType === 'admin') {
        clients.admin = ws;
        console.log('Admin client connected');
    } else if (clientType === 'player') {
        clients.players.add(ws);
        console.log('Player client connected');
        console.log('Total players connected:', clients.players.size);
    } else {
        clients.public = ws;
        console.log('Public client connected');
    }
    
    // Send initial data
    ws.send(JSON.stringify({
        type: 'initialData',
        phase: gameState.phase,
        timeRemaining: gameState.timeRemaining,
        funds: gameState.funds,
        players: gameState.players
    }));
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Received message:', data);
            
            switch(data.type) {
                case 'getInitialData':
                    ws.send(JSON.stringify({
                        type: 'initialData',
                        phase: gameState.phase,
                        timeRemaining: gameState.timeRemaining,
                        funds: gameState.funds,
                        players: gameState.players
                    }));
                    break;
                    
                case 'startGame':
                    handleGameStateChange('startGame');
                    break;
                    
                case 'endGame':
                    handleGameStateChange('endGame');
                    break;
                    
                case 'resetGame':
                    handleGameStateChange('resetGame');
                    break;
                    
                case 'updatePhase':
                    gameState.phase = data.phase;
                    gameState.timeRemaining = data.timeRemaining;
                    broadcast({
                        type: 'phaseUpdate',
                        phase: gameState.phase,
                        timeRemaining: gameState.timeRemaining
                    });
                    break;
                    
                case 'marketEvent':
                    handleMarketEvent(data.eventType, data.fundId);
                    break;
                    
                case 'order':
                    handleOrderSubmission(data.order);
                    break;
                    
                case 'playerUpdate':
                    handlePlayerUpdate(data.player);
                    break;
                    
                case 'newOrder':
                    if (data.order) {
                        handleOrderSubmission(data.order);
                    }
                    break;
            }
        } catch (error) {
            console.error('Error handling message:', error);
        }
    });
    
    ws.on('close', () => {
        console.log('Client disconnected');
        if (clientType === 'admin') {
            clients.admin = null;
            console.log('Admin client removed');
        } else if (clientType === 'player') {
            clients.players.delete(ws);
            console.log('Player client removed');
            console.log('Remaining players:', clients.players.size);
        } else if (clientType === 'public') {
            clients.public = null;
            console.log('Public client removed');
        }
    });
});

// Handle order submission
function handleOrderSubmission(order) {
    console.log('Handling order submission:', order);
    
    if (!order || !order.playerName || !order.orderType || !order.fundId || !order.shares) {
        console.error('Invalid order:', order);
        return;
    }
    
    // Add order to pending orders
    gameState.pendingOrders.push(order);
    
    // Broadcast to admin client
    if (clients.admin) {
        clients.admin.send(JSON.stringify({
            type: 'newOrder',
            order: order
        }));
    }
}

// Handle player updates
function handlePlayerUpdate(player) {
    // Update or add player in game state
    const existingPlayerIndex = gameState.players.findIndex(p => p.name === player.name);
    if (existingPlayerIndex >= 0) {
        gameState.players[existingPlayerIndex] = player;
    } else {
        gameState.players.push(player);
    }
    
    // Broadcast player update to all clients
    broadcast({
        type: 'playerUpdate',
        player: player
    });
}

// Broadcast message to all connected clients
function broadcast(message) {
    const messageStr = JSON.stringify(message);
    console.log('Broadcasting to clients:', message); // Debug log
    
    if (clients.admin) {
        console.log('Sending to admin'); // Debug log
        try {
            clients.admin.send(messageStr);
            console.log('Message sent to admin successfully');
        } catch (error) {
            console.error('Error sending to admin:', error);
        }
    }
    if (clients.public) {
        console.log('Sending to public view'); // Debug log
        try {
            clients.public.send(messageStr);
            console.log('Message sent to public view successfully');
        } catch (error) {
            console.error('Error sending to public view:', error);
        }
    }
    clients.players.forEach(player => {
        console.log('Sending to player'); // Debug log
        try {
            player.send(messageStr);
            console.log('Message sent to player successfully');
        } catch (error) {
            console.error('Error sending to player:', error);
        }
    });
}

// Start server
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Listen on all network interfaces

server.listen(PORT, HOST, () => {
    // Get local IP address
    const networkInterfaces = require('os').networkInterfaces();
    let localIP = 'localhost';
    
    // Find the first non-internal IPv4 address
    for (const name of Object.keys(networkInterfaces)) {
        for (const interface of networkInterfaces[name]) {
            if (interface.internal === false && interface.family === 'IPv4') {
                localIP = interface.address;
                break;
            }
        }
        if (localIP !== 'localhost') break;
    }
    
    console.log('\n=== Server Started ===');
    console.log(`Local URL: http://localhost:${PORT}`);
    console.log(`Network URL: http://${localIP}:${PORT}`);
    console.log('\nAccess these pages:');
    console.log(`Order submission (for players): http://${localIP}:${PORT}/order-submit.html`);
    console.log(`Admin view: http://${localIP}:${PORT}/admin-view.html?type=admin`);
    console.log(`Public view: http://${localIP}:${PORT}/public-view.html?type=public`);
    console.log('\nMake sure your phone is on the same WiFi network as this computer.');
    console.log('If connection fails, try:');
    console.log('1. Using the Network URL instead of localhost');
    console.log('2. Making sure your phone is on the same WiFi network');
    console.log('3. Checking if your computer\'s WiFi is working');
    console.log('========================\n');
}); 