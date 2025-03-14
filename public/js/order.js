// Game state
let gameState = {
    phase: 'Not Started',
    timeRemaining: 0,
    stocks: [],
    currentPlayer: null
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("Order submission view initialized");
    initializeWebSocket();
    initializeEventListeners();
});

// Initialize WebSocket connection
function initializeWebSocket() {
    console.log('Initializing WebSocket connection...');
    socket = createSocketConnection('player');
    
    // Wait for WebSocket connection before initializing
    onConnectionReady(() => {
        console.log("WebSocket connected, initializing order view");
        updateConnectionStatus(true);
    });
}

// Update connection status display
function updateConnectionStatus(connected) {
    const statusElement = document.getElementById('connectionStatus');
    if (connected) {
        statusElement.className = 'status connected';
        statusElement.textContent = 'WebSocket Status: Connected';
    } else {
        statusElement.className = 'status disconnected';
        statusElement.textContent = 'WebSocket Status: Disconnected';
    }
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

    // Add form submit handler
    const orderForm = document.getElementById('orderForm');
    orderForm.addEventListener('submit', function(e) {
        e.preventDefault();
        submitOrder();
    });

    // Add stock selection change handler
    const stockSelect = document.getElementById('stock');
    stockSelect.addEventListener('change', function() {
        updateCurrentPrice();
    });

    // Try to restore player name from localStorage
    const savedName = localStorage.getItem('playerName');
    if (savedName) {
        document.getElementById('playerName').value = savedName;
    }
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
        case 'orderResponse':
            handleOrderResponse(data);
            break;
    }
}

// Update the entire UI
function updateUI() {
    updatePhaseDisplay();
    updateStocks(gameState.stocks);
    updateFormState();
}

// Update phase display
function updatePhaseDisplay() {
    document.getElementById('currentPhase').textContent = gameState.phase;
    document.getElementById('timeRemaining').textContent = formatTime(gameState.timeRemaining);
    updateFormState();
}

// Format time as MM:SS
function formatTime(seconds) {
    if (!seconds && seconds !== 0) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Update stocks in the dropdown
function updateStocks(stocks) {
    gameState.stocks = stocks;
    const stockSelect = document.getElementById('stock');
    stockSelect.innerHTML = stocks.map(stock => `
        <option value="${stock.id}">${stock.name} ($${stock.price.toFixed(2)})</option>
    `).join('');
    updateCurrentPrice();
}

// Update the current price display
function updateCurrentPrice() {
    const stockSelect = document.getElementById('stock');
    const selectedStock = gameState.stocks.find(s => s.id === stockSelect.value);
    const priceDisplay = document.getElementById('currentPrice');
    if (selectedStock) {
        priceDisplay.textContent = `$${selectedStock.price.toFixed(2)}`;
    } else {
        priceDisplay.textContent = '--';
    }
}

// Update form state based on game phase
function updateFormState() {
    const form = document.getElementById('orderForm');
    const submitButton = document.getElementById('submitButton');
    const orderStatus = document.getElementById('orderStatus');
    
    const canSubmitOrders = gameState.phase === 'Ordering';
    
    submitButton.disabled = !canSubmitOrders;
    Array.from(form.elements).forEach(element => {
        if (element !== submitButton) {
            element.disabled = !canSubmitOrders;
        }
    });

    if (!canSubmitOrders) {
        orderStatus.textContent = `Orders cannot be submitted during ${gameState.phase} phase`;
        orderStatus.className = 'error';
    } else {
        orderStatus.textContent = '';
    }
}

// Submit order
function submitOrder() {
    const playerName = document.getElementById('playerName').value.trim();
    const orderType = document.getElementById('orderType').value;
    const stockId = document.getElementById('stock').value;
    const quantity = parseInt(document.getElementById('quantity').value);
    
    if (!playerName || !orderType || !stockId || !quantity) {
        showStatus('Please fill in all fields', 'error');
        return;
    }

    // Save player name for future use
    localStorage.setItem('playerName', playerName);
    
    const selectedStock = gameState.stocks.find(s => s.id === stockId);
    if (!selectedStock) {
        showStatus('Selected stock not found', 'error');
        return;
    }

    const order = {
        playerName,
        type: orderType,
        stockId,
        stockName: selectedStock.name,
        quantity,
        price: selectedStock.price
    };
    
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'submitOrder',
            order: order
        }));
        showStatus('Submitting order...', 'info');
    } else {
        showStatus('Not connected to server', 'error');
        updateConnectionStatus(false);
    }
}

// Handle order response
function handleOrderResponse(data) {
    if (data.success) {
        showStatus('Order submitted successfully!', 'success');
        document.getElementById('quantity').value = '1';
    } else {
        showStatus(data.message || 'Failed to submit order', 'error');
    }
}

// Show status message
function showStatus(message, type = 'info') {
    const orderStatus = document.getElementById('orderStatus');
    orderStatus.textContent = message;
    orderStatus.className = type;
} 