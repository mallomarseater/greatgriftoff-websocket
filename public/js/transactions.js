function buyShares() {
    const playerName = document.getElementById('buyPlayerSelect').value;
    const fundId = document.getElementById('buyFundSelect').value;
    const shares = parseInt(document.getElementById('buySharesInput').value);
    
    if (!playerName || !fundId || !shares) {
        alert('Please fill in all fields');
        return;
    }
    
    if (shares <= 0) {
        alert("Please enter a valid number of shares");
        return;
    }
    
    // Create order
    const order = {
        playerName: playerName,
        orderType: 'buy',
        fundId: fundId,
        shares: shares
    };
    
    console.log('Sending buy order:', order);
    
    // Send order to server
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'newOrder',  // Changed from 'order' to 'newOrder' to match server expectation
            order: order
        }));
        console.log('Buy order sent:', order);
        
        // Clear input
        document.getElementById('buySharesInput').value = '1';
    } else {
        console.error('WebSocket not connected');
        alert('Error: Not connected to server');
    }
}

function sellShares() {
    const playerName = document.getElementById('sellPlayerSelect').value;
    const fundId = document.getElementById('sellFundSelect').value;
    const shares = parseInt(document.getElementById('sellSharesInput').value);
    
    if (!playerName || !fundId || !shares) {
        alert('Please fill in all fields');
        return;
    }
    
    if (shares <= 0) {
        alert("Please enter a valid number of shares");
        return;
    }
    
    // Create order
    const order = {
        playerName: playerName,
        orderType: 'sell',
        fundId: fundId,
        shares: shares
    };
    
    console.log('Sending sell order:', order);
    
    // Send order to server
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'newOrder',  // Changed from 'order' to 'newOrder' to match server expectation
            order: order
        }));
        console.log('Sell order sent:', order);
        
        // Clear input
        document.getElementById('sellSharesInput').value = '1';
    } else {
        console.error('WebSocket not connected');
        alert('Error: Not connected to server');
    }
}

function processAllOrders() {
    const pendingContainer = document.getElementById('pendingTransactions');
    const transactions = pendingContainer.getElementsByClassName('transaction');
    
    Array.from(transactions).forEach(transaction => {
        const playerName = transaction.querySelector('.player-name').textContent;
        const orderType = transaction.querySelector('.order-type').textContent.toLowerCase();
        const fundId = getFundIdFromName(transaction.querySelector('.fund-name').textContent);
        const shares = parseInt(transaction.querySelector('.shares').textContent);
        
        processOrder(playerName, orderType, fundId, shares);
    });
}

function processNextOrder() {
    const pendingContainer = document.getElementById('pendingTransactions');
    const transaction = pendingContainer.querySelector('.transaction');
    
    if (transaction) {
        const playerName = transaction.querySelector('.player-name').textContent;
        const orderType = transaction.querySelector('.order-type').textContent.toLowerCase();
        const fundId = getFundIdFromName(transaction.querySelector('.fund-name').textContent);
        const shares = parseInt(transaction.querySelector('.shares').textContent);
        
        processOrder(playerName, orderType, fundId, shares);
    }
}

function getFundIdFromName(fundName) {
    const fund = gameState.funds.find(f => f.name === fundName);
    return fund ? fund.id : null;
}

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
    
    // Initialize shares object if it doesn't exist
    if (!player.shares) {
        player.shares = {};
    }
    
    // Process the order
    if (orderType === 'buy') {
        // Check if player has enough money
        if (player.money < totalCost) {
            alert(`Insufficient funds. Cost: $${totalCost.toFixed(2)}, Available: $${player.money.toFixed(2)}`);
            return;
        }
        // Update player's money and shares
        player.money -= totalCost;
        player.shares[fundId] = (player.shares[fundId] || 0) + shares;
    } else if (orderType === 'sell') {
        // Check if player has enough shares
        if (!player.shares[fundId] || player.shares[fundId] < shares) {
            alert(`Not enough shares. Owned: ${player.shares[fundId] || 0}, Attempting to sell: ${shares}`);
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
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'playerUpdate',
            player: player
        }));
    }
    
    // Add to log
    addToLog(`${playerName} ${orderType}ed ${shares} shares of ${getFundName(fundId)} at $${fund.price.toFixed(2)} per share`);
    
    console.log('Order processed successfully');
}

// Export functions to make them available globally
window.buyShares = buyShares;
window.sellShares = sellShares;
window.processOrder = processOrder;
window.processAllOrders = processAllOrders;
window.processNextOrder = processNextOrder;
window.getFundIdFromName = getFundIdFromName;