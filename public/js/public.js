// Game state
let gameState = {
    phase: 'Not Started',
    timeRemaining: 0,
    stocks: [],
    players: [],
    newsItems: []
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("Public view initialized");
    initializeWebSocket();
    initializeEventListeners();
});

// Initialize WebSocket connection
function initializeWebSocket() {
    console.log('Initializing WebSocket connection...');
    socket = createSocketConnection('public');
    
    // Wait for WebSocket connection before initializing
    onConnectionReady(() => {
        console.log("WebSocket connected, initializing public view");
        updateUI();
    });
}

// Initialize event listeners
function initializeEventListeners() {
    // Add window focus handler to reconnect if needed
    window.onfocus = () => {
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            console.log('Window focused, checking connection...');
            initializeWebSocket();
        }
    };
}

// Handle WebSocket messages
function handleWebSocketMessage(data) {
    console.log('Received WebSocket message:', data);
    switch(data.type) {
        case 'initialState':
            gameState = data.state;
            updateUI();
            break;
        case 'phaseUpdate':
            gameState.phase = data.phase;
            gameState.timeRemaining = data.timeRemaining;
            updatePhaseDisplay();
            break;
        case 'stockUpdate':
            updateStocks(data.stocks);
            break;
        case 'playerUpdate':
            updatePlayers(data.players);
            break;
        case 'newsUpdate':
            updateNews(data.news);
            break;
    }
}

// Update the entire UI
function updateUI() {
    updatePhaseDisplay();
    updateStocks(gameState.stocks);
    updatePlayers(gameState.players);
    updateNews(gameState.newsItems);
}

// Update phase display
function updatePhaseDisplay() {
    document.getElementById('currentPhase').textContent = gameState.phase;
    document.getElementById('timer').textContent = formatTime(gameState.timeRemaining);
}

// Format time as MM:SS
function formatTime(seconds) {
    if (!seconds && seconds !== 0) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Update stocks display
function updateStocks(stocks) {
    const stockList = document.getElementById('stockList');
    stockList.innerHTML = stocks.map(stock => {
        const priceClass = stock.priceChange > 0 ? 'price-up' : 
                          stock.priceChange < 0 ? 'price-down' : '';
        return `
            <div class="stock">
                <div class="stock-name">${stock.name}</div>
                <div class="stock-price ${priceClass}">
                    $${stock.price.toFixed(2)}
                    ${stock.priceChange ? ` (${stock.priceChange > 0 ? '+' : ''}${stock.priceChange.toFixed(2)}%)` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Update players display
function updatePlayers(players) {
    const playerList = document.getElementById('playerList');
    // Sort players by portfolio value
    const sortedPlayers = [...players].sort((a, b) => b.portfolioValue - a.portfolioValue);
    playerList.innerHTML = sortedPlayers.map(player => `
        <div class="player">
            <div class="player-name">${player.name}</div>
            <div class="player-value">$${player.portfolioValue.toFixed(2)}</div>
        </div>
    `).join('');
}

// Update news ticker
function updateNews(newsItems) {
    const newsTicker = document.getElementById('newsTicker');
    if (newsItems && newsItems.length > 0) {
        const newsText = newsItems.map(item => item.text).join(' • ');
        newsTicker.textContent = newsText;
    } else {
        newsTicker.textContent = 'Welcome to The Great Grift Off - Where fortunes are made and lost in the blink of an eye!';
    }
} 