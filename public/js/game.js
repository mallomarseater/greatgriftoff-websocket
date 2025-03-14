// Constants
const STARTING_PLAYER_MONEY = 100000;
const STARTING_FUND_VALUE = 1000;

// Game modes
const GAME_MODE = {
    SETUP: 'setup',
    RUNNING: 'running',
    ENDED: 'ended'
};

// Game state
let gameState = {
    phase: 'Markets Closed',
    timeRemaining: 60,
    funds: [],
    players: [],
    pendingMarketImpacts: []
};

let gameMode = GAME_MODE.SETUP;
let gameInterval = null;
let socket = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    console.log("Document loaded, initializing game");
    
    // Ensure socket-client.js is loaded
    if (typeof createSocketConnection !== 'function') {
        console.error('socket-client.js must be loaded before game.js');
        return;
    }

    // Initialize WebSocket first
    socket = createSocketConnection('admin');
    
    // Wait for WebSocket connection before proceeding
    onConnectionReady(() => {
        console.log("WebSocket connected, initializing game components");
        initializeGameComponents();
        initializePhases();
    });
});

// Initialize game components
function initializeGameComponents() {
    // Make sure buy and sell buttons are enabled during setup
    const buyButton = document.getElementById('buyButton');
    const sellButton = document.getElementById('sellButton');
    if (buyButton) buyButton.disabled = false;
    if (sellButton) sellButton.disabled = false;
    
    // Hide market status initially
    const marketStatus = document.getElementById('marketStatus');
    if (marketStatus) marketStatus.style.display = 'none';
    
    // Add event listeners
    const startButton = document.getElementById('startButton');
    const addPlayerButton = document.getElementById('addPlayerButton');
    
    if (startButton) startButton.addEventListener('click', startGame);
    if (addPlayerButton) addPlayerButton.addEventListener('click', addPlayer);
    if (buyButton) buyButton.addEventListener('click', buyShares);
    if (sellButton) sellButton.addEventListener('click', sellShares);
    
    console.log("Game initialized in setup mode");
}

function startGame() {
    console.log('Starting game...');
    gameMode = GAME_MODE.RUNNING;
    
    // Apply any pending market impacts
    applyPendingMarketImpacts();
    
    // Update UI
    document.getElementById('gameStatus').textContent = 'Status: Game Running';
    document.getElementById('gameMode').textContent = 'GAME RUNNING';
    document.getElementById('gameMode').className = 'game-mode running-mode';
    document.getElementById('setupNotice').style.display = 'none';
    document.getElementById('phasePanel').style.display = 'block';
    
    // Notify server
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'startGame'
        }));
    }
}

function resetGame() {
    console.log('Resetting game...');
    gameMode = GAME_MODE.SETUP;
    gameState.pendingMarketImpacts = [];
    
    // Update UI
    document.getElementById('gameStatus').textContent = 'Status: Setup Mode';
    document.getElementById('gameMode').textContent = 'SETUP MODE';
    document.getElementById('gameMode').className = 'game-mode setup-mode';
    document.getElementById('setupNotice').style.display = 'block';
    document.getElementById('phasePanel').style.display = 'none';
    
    // Notify server
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'resetGame'
        }));
    }
}

function logMessage(message) {
    const logDiv = document.getElementById('log');
    const entry = document.createElement('div');
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logDiv.insertBefore(entry, logDiv.firstChild);
    console.log(message); // Also log to console for debugging
}

// Apply pending market impacts
function applyPendingMarketImpacts() {
    console.log('Applying pending market impacts...');
    if (gameState.pendingMarketImpacts && gameState.pendingMarketImpacts.length > 0) {
        gameState.pendingMarketImpacts.forEach(impact => {
            const fund = gameState.funds.find(f => f.id === impact.fundId);
            if (fund) {
                fund.price *= impact.multiplier;
                console.log(`Applied ${impact.event} to ${fund.name}: ${fund.price}`);
            }
        });
        gameState.pendingMarketImpacts = [];
    }
}

// Add market impact
function addMarketImpact(fundId, multiplier, event) {
    console.log('Adding market impact:', { fundId, multiplier, event });
    gameState.pendingMarketImpacts.push({
        fundId,
        multiplier,
        event
    });
}

// End game
function endGame() {
    console.log('Ending game...');
    gameMode = GAME_MODE.ENDED;
    
    // Update UI
    document.getElementById('gameStatus').textContent = 'Status: Game Ended';
    document.getElementById('gameMode').textContent = 'GAME ENDED';
    document.getElementById('gameMode').className = 'game-mode ended-mode';
    
    // Notify server
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'endGame'
        }));
    }
}

// Export functions
window.startGame = startGame;
window.endGame = endGame;
window.resetGame = resetGame;
window.addMarketImpact = addMarketImpact;
window.applyPendingMarketImpacts = applyPendingMarketImpacts;