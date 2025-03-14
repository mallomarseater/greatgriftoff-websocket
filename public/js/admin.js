// Game state
let gameState = {
    phase: 'Markets Closed',
    timeRemaining: 60,
    funds: [],
    players: [],
    pendingMarketImpacts: []
};

// Handle WebSocket messages
function handleWebSocketMessage(data) {
    console.log('Received WebSocket message:', data);
    switch(data.type) {
        case 'initialData':
            gameState = data;
            updateUI();
            break;
        case 'fundsUpdate':
            gameState.funds = data.funds;
            updateFundsList();
            break;
        case 'playerUpdate':
            handlePlayerUpdate(data.player);
            break;
        case 'phaseUpdate':
            gameState.phase = data.phase;
            gameState.timeRemaining = data.timeRemaining;
            updatePhaseDisplay();
            break;
        case 'newOrder':
            handleNewOrder(data.order);
            break;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    console.log("Document loaded, initializing admin view");
    
    // Ensure socket-client.js is loaded
    if (typeof createSocketConnection !== 'function') {
        console.error('socket-client.js must be loaded before admin.js');
        return;
    }

    // Initialize WebSocket first
    socket = createSocketConnection('admin');
    
    // Wait for WebSocket connection before proceeding
    onConnectionReady(() => {
        console.log("WebSocket connected, initializing admin components");
        initializeAdminComponents();
    });

    // Add QR code updating function
    document.getElementById('updateQrBtn').addEventListener('click', function() {
        const buyUrl = document.getElementById('buyFormUrl').value.trim();
        const sellUrl = document.getElementById('sellFormUrl').value.trim();
        
        if (buyUrl) localStorage.setItem('buyFormUrl', buyUrl);
        if (sellUrl) localStorage.setItem('sellFormUrl', sellUrl);
        
        alert('QR codes updated on public view!');
    });

    // Add window focus handler to reconnect if needed
    window.onfocus = () => {
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            console.log('Window focused, checking connection...');
            socket = createSocketConnection('admin');
        }
    };
});

// Initialize admin components
function initializeAdminComponents() {
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
    
    // Initialize phases
    initializePhases();
    
    console.log("Admin view initialized in setup mode");
}

// Update UI with current game state
function updateUI() {
    console.log('Updating UI with game state:', gameState);
    updateFundsList(gameState.funds);
    updatePlayersList();
    updatePhaseDisplay();
}

// Update phase information
function updatePhaseInfo(phase, timeRemaining) {
    console.log('Updating phase info:', { phase, timeRemaining });
    const phaseDisplay = document.getElementById('phaseDisplay');
    const phaseTimer = document.getElementById('phaseTimer');
    if (phaseDisplay) phaseDisplay.textContent = phase;
    if (phaseTimer) phaseTimer.textContent = timeRemaining + 's';
    
    // Update order type options based on phase
    const orderType = document.getElementById('orderType');
    if (orderType) {
        if (phase === 'Buying') {
            orderType.value = 'buy';
            orderType.disabled = true;
        } else if (phase === 'Selling') {
            orderType.value = 'sell';
            orderType.disabled = true;
        } else {
            orderType.disabled = false;
        }
    }
    console.log('Phase info updated');
}

// Update funds list
function updateFundsList(funds) {
    if (!funds) {
        console.warn('No funds data provided to updateFundsList');
        return;
    }
    console.log('Updating funds list:', funds);
    
    // Store previous prices before updating
    const previousPrices = {};
    if (gameState.funds) {
        gameState.funds.forEach(fund => {
            previousPrices[fund.id] = fund.price;
        });
    }
    
    gameState.funds = funds;
    
    // Update all fund select elements
    const fundSelects = document.querySelectorAll('select[id$="FundSelect"]');
    fundSelects.forEach(select => {
        select.innerHTML = funds.map(fund => 
            `<option value="${fund.id}">${fund.name} ($${fund.price.toFixed(2)})</option>`
        ).join('');
    });
    
    // Update funds list display
    const fundsList = document.getElementById('fundsList');
    if (fundsList) {
        fundsList.innerHTML = funds.map(fund => {
            const previousPrice = previousPrices[fund.id] || fund.price;
            const priceChange = fund.price - previousPrice;
            const colorClass = priceChange > 0 ? 'price-up' : priceChange < 0 ? 'price-down' : '';
            const arrow = priceChange > 0 ? '↑' : priceChange < 0 ? '↓' : '';
            
            return `
                <div class="fund-item">
                    <span class="fund-name">${fund.name}</span>
                    <span class="fund-price ${colorClass}">
                        $${fund.price.toFixed(2)} ${arrow}
                        ${Math.abs(priceChange) > 0 ? ` (${(priceChange > 0 ? '+' : '')}${priceChange.toFixed(2)})` : ''}
                    </span>
                </div>
            `;
        }).join('');
    }
    
    console.log('Funds list updated');
}

// Get fund name from ID
function getFundName(fundId) {
    const fund = gameState.funds.find(f => f.id === fundId);
    return fund ? fund.name : 'Unknown Fund';
}

// Handle new order
function handleNewOrder(order) {
    console.log('\n=== Handling New Order ===');
    console.log('Order details:', order);
    
    const pendingContainer = document.getElementById('pendingTransactions');
    console.log('Found pending container:', pendingContainer);
    
    if (!pendingContainer) {
        console.error('Pending transactions container not found!');
        return;
    }
    
    // Validate order object
    if (!order || !order.playerName || !order.fundId || !order.shares) {
        console.error('Invalid order object:', order);
        return;
    }
    
    // Ensure orderType exists and is valid
    const orderType = (order.orderType || 'buy').toLowerCase();
    if (orderType !== 'buy' && orderType !== 'sell') {
        console.error('Invalid order type:', orderType);
        return;
    }
    
    // Remove "No pending transactions" message if it exists
    const noPending = pendingContainer.querySelector('.no-pending');
    if (noPending) {
        noPending.remove();
    }
    
    const transactionDiv = document.createElement('div');
    transactionDiv.className = 'transaction';
    transactionDiv.innerHTML = `
        <div class="transaction-info">
            <span class="player-name">${order.playerName}</span>
            <span class="order-type">${orderType.toUpperCase()}</span>
            <span class="fund-name">${getFundName(order.fundId)}</span>
            <span class="shares">${order.shares} shares</span>
        </div>
        <div class="transaction-actions">
            <button onclick="processOrder('${order.playerName}', '${orderType}', '${order.fundId}', ${order.shares})">Process</button>
            <button onclick="rejectOrder('${order.playerName}')">Reject</button>
        </div>
    `;
    
    pendingContainer.appendChild(transactionDiv);
    console.log('Added transaction to pending container');
    console.log('=== End Handling New Order ===\n');
}

// Process order
function processOrder(playerName, orderType, fundId, shares) {
    console.log('Processing order:', { playerName, orderType, fundId, shares });
    
    // Get the fund price
    const fund = gameState.funds.find(f => f.id === fundId);
    if (!fund) {
        console.error('Fund not found:', fundId);
        return;
    }
    
    // Calculate total cost
    const totalCost = fund.price * shares;
    
    // Get or create player
    let player = getOrCreatePlayer(playerName);
    if (!player) {
        console.error('Could not get or create player:', playerName);
        return;
    }
    
    // Process the order
    if (orderType === 'buy') {
        // Check if player has enough money
        if (player.money < totalCost) {
            console.error('Player does not have enough money');
            return;
        }
        // Update player's money and shares
        player.money -= totalCost;
        player.shares[fundId] = (player.shares[fundId] || 0) + shares;
    } else if (orderType === 'sell') {
        // Check if player has enough shares
        if (!player.shares[fundId] || player.shares[fundId] < shares) {
            console.error('Player does not have enough shares');
            return;
        }
        // Update player's money and shares
        player.money += totalCost;
        player.shares[fundId] -= shares;
    }
    
    // Remove the transaction from pending
    const pendingContainer = document.getElementById('pendingTransactions');
    const transactions = pendingContainer.getElementsByClassName('transaction');
    for (let transaction of transactions) {
        if (transaction.querySelector('.player-name').textContent === playerName) {
            transaction.remove();
            break;
        }
    }
    
    // Update the UI
    updatePlayersList();
    
    // Broadcast player update to all clients
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'playerUpdate',
            player: player
        }));
    }
    
    // Add to log
    addToLog(`${playerName} ${orderType}ed ${shares} shares of ${getFundName(fundId)}`);
    
    console.log('Order processed successfully');
}

// Reject order
function rejectOrder(playerName) {
    console.log('Rejecting order for player:', playerName);
    // Remove the transaction from pending
    const pendingContainer = document.getElementById('pendingTransactions');
    const transactions = pendingContainer.getElementsByClassName('transaction');
    for (let transaction of transactions) {
        if (transaction.querySelector('.player-name').textContent === playerName) {
            transaction.remove();
            break;
        }
    }
    // TODO: Notify player of rejection
    console.log('Order rejected');
}

// Update phase
function updatePhase(phase, timeRemaining) {
    console.log('Updating phase:', { phase, timeRemaining });
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'updatePhase',
            phase: phase,
            timeRemaining: timeRemaining
        }));
    } else {
        console.warn('WebSocket not connected, attempting to reconnect...');
        // Create new connection and wait for it to be ready
        socket = createSocketConnection('admin');
        onConnectionReady(() => {
            console.log('WebSocket reconnected, sending phase update');
            socket.send(JSON.stringify({
                type: 'updatePhase',
                phase: phase,
                timeRemaining: timeRemaining
            }));
        });
    }
}

// Update funds
function updateFunds(funds) {
    console.log('Updating funds:', funds);
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'updateFunds',
            funds: funds
        }));
    } else {
        console.warn('WebSocket not connected, cannot update funds');
    }
}

// Add to log function
function addToLog(message) {
    const log = document.getElementById('log');
    if (log) {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        log.insertBefore(entry, log.firstChild);
    }
}

// Get or create player
function getOrCreatePlayer(playerName) {
    // Try to find existing player
    let player = gameState.players.find(p => p.name === playerName);
    
    // If player doesn't exist, create new one
    if (!player) {
        player = {
            name: playerName,
            money: 50000, // Starting money
            shares: {}
        };
        gameState.players.push(player);
        
        // Update player select dropdowns
        updatePlayerSelects();
        
        // Broadcast player update to all clients
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'playerUpdate',
                player: player
            }));
        }
    }
    
    return player;
}

// Update player select dropdowns
function updatePlayerSelects() {
    const buyPlayerSelect = document.getElementById('buyPlayerSelect');
    const sellPlayerSelect = document.getElementById('sellPlayerSelect');
    
    if (buyPlayerSelect) {
        buyPlayerSelect.innerHTML = gameState.players.map(player => 
            `<option value="${player.name}">${player.name} ($${player.money.toFixed(2)})</option>`
        ).join('');
    }
    
    if (sellPlayerSelect) {
        sellPlayerSelect.innerHTML = gameState.players.map(player => 
            `<option value="${player.name}">${player.name} ($${player.money.toFixed(2)})</option>`
        ).join('');
    }
}

// Update players list display
function updatePlayersList() {
    const playersList = document.getElementById('playersList');
    if (!playersList) return;
    
    playersList.innerHTML = gameState.players.map(player => {
        // Calculate portfolio value using current fund prices
        const portfolioValue = player.shares ? Object.entries(player.shares).reduce((total, [fundId, shares]) => {
            const fund = gameState.funds.find(f => f.id === fundId);
            return total + (fund ? fund.price * shares : 0);
        }, 0) : 0;
        
        const totalValue = player.money + portfolioValue;
        
        // Calculate value change indicators
        const previousPortfolioValue = player.previousPortfolioValue || portfolioValue;
        const valueChange = portfolioValue - previousPortfolioValue;
        const valueChangeClass = valueChange > 0 ? 'price-up' : valueChange < 0 ? 'price-down' : '';
        const valueChangeArrow = valueChange > 0 ? '↑' : valueChange < 0 ? '↓' : '';
        
        // Store current portfolio value for next comparison
        player.previousPortfolioValue = portfolioValue;
        
        return `
            <div class="player-item" style="margin-bottom: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 4px;">
                <div class="player-header" style="font-weight: bold; margin-bottom: 5px;">
                    ${player.name}
                </div>
                <div class="player-values" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 5px;">
                    <div class="value-item">
                        <div class="value-label" style="color: #666; font-size: 0.9em;">Cash</div>
                        <div class="value-amount">$${player.money.toFixed(2)}</div>
                    </div>
                    <div class="value-item">
                        <div class="value-label" style="color: #666; font-size: 0.9em;">Portfolio Value</div>
                        <div class="value-amount ${valueChangeClass}">
                            $${portfolioValue.toFixed(2)} ${valueChangeArrow}
                            ${Math.abs(valueChange) > 0 ? ` (${(valueChange > 0 ? '+' : '')}${valueChange.toFixed(2)})` : ''}
                        </div>
                    </div>
                    <div class="value-item">
                        <div class="value-label" style="color: #666; font-size: 0.9em;">Total Value</div>
                        <div class="value-amount" style="font-weight: bold; color: #2196f3;">$${totalValue.toFixed(2)}</div>
                    </div>
                </div>
                <div class="player-holdings">
                    ${Object.entries(player.shares || {}).map(([fundId, shares]) => {
                        const fund = gameState.funds.find(f => f.id === fundId);
                        if (!fund || shares <= 0) return '';
                        
                        const holdingValue = fund.price * shares;
                        return `
                            <div class="holding-item" style="margin: 2px 0; padding: 3px; background-color: #fff; border-radius: 4px;">
                                <span class="fund-name" style="font-weight: bold;">${fund.name}</span>
                                <span class="holding-details">
                                    ${shares} shares @ $${fund.price.toFixed(2)} = $${holdingValue.toFixed(2)}
                                </span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }).join('');
    
    // Update player select dropdowns with new values
    updatePlayerSelects();
}

// Export functions
window.handleWebSocketMessage = handleWebSocketMessage;
window.processOrder = processOrder;
window.rejectOrder = rejectOrder;
window.updatePhase = updatePhase;
window.updateFunds = updateFunds;
window.addToLog = addToLog;
window.getOrCreatePlayer = getOrCreatePlayer; 