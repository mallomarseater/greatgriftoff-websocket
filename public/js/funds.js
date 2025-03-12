// Initialize funds with trend factors
let funds = {
    "$$Trump Coin": { value: STARTING_FUND_VALUE, previousValue: STARTING_FUND_VALUE, frozen: false, trend: 0, volatility: 0.05 },
    "Checkpoint Therapeutics": { value: STARTING_FUND_VALUE, previousValue: STARTING_FUND_VALUE, frozen: false, trend: 0, volatility: 0.07 },
    "Boeing Co.": { value: STARTING_FUND_VALUE, previousValue: STARTING_FUND_VALUE, frozen: false, trend: 0, volatility: 0.04 },
    "Luigi Mangione Legal Fund": { value: STARTING_FUND_VALUE, previousValue: STARTING_FUND_VALUE, frozen: false, trend: 0, volatility: 0.06 },
    "Taylor Swift's Eras Tour Treasury": { value: STARTING_FUND_VALUE, previousValue: STARTING_FUND_VALUE, frozen: false, trend: 0, volatility: 0.08 }
};
// Pending price impacts (for setup mode)
let pendingPriceImpacts = {
    "$$Trump Coin": 0,
    "Checkpoint Therapeutics": 0,
    "Boeing Co.": 0,
    "Luigi Mangione Legal Fund": 0,
    "Taylor Swift's Eras Tour Treasury": 0
};

// Populate fund select dropdowns
function populateFundSelects() {
    const buyFundSelect = document.getElementById('buyFundSelect');
    const sellFundSelect = document.getElementById('sellFundSelect');
    
    // Clear existing options
    buyFundSelect.innerHTML = '';
    sellFundSelect.innerHTML = '';
    
    // Add fund options
    Object.keys(funds).forEach(fundName => {
        // For buy dropdown
        const buyOption = document.createElement('option');
        buyOption.value = fundName;
        buyOption.textContent = fundName;
        buyFundSelect.appendChild(buyOption);
        
        // For sell dropdown
        const sellOption = document.createElement('option');
        sellOption.value = fundName;
        sellOption.textContent = fundName;
        sellFundSelect.appendChild(sellOption);
    });
}

// Call this at game start to establish initial trend directions
function initializeTrends() {
    Object.keys(funds).forEach(fundName => {
        // Random trend between -0.03 and 0.03 (slight downward bias)
        funds[fundName].trend = (Math.random() * 0.06) - 0.03;
        
        logMessage(`Initial trend for ${fundName}: ${funds[fundName].trend > 0 ? 'Positive' : 'Negative'}`);
    });
}


function updateFundValues() {
    if (gameMode !== GAME_MODE.RUNNING) return;
    
    // Only update values during "Markets Closed" phase
    if (currentPhase !== PHASE.MARKETS_CLOSED) {
        // Skip updates during buying/selling phases
        return;
    }
    
    // Store previous values for comparison
    Object.keys(funds).forEach(fundName => {
        funds[fundName].previousValue = funds[fundName].value;
    });
    
    // Apply changes to fund values with trends
    Object.keys(funds).forEach(fundName => {
        // Skip frozen funds
        if (funds[fundName].frozen) return;
        
        const fund = funds[fundName];
        
        // Update trend with small random changes (trend persistence)
        fund.trend += (Math.random() * 0.01) - 0.005;
        
        // Keep trend in reasonable bounds
        fund.trend = Math.max(-0.05, Math.min(0.05, fund.trend));
        
        // Random noise based on volatility + trend component
        const noise = (Math.random() * 2 - 1) * fund.volatility;
        const change = noise + fund.trend;
        
        // Apply change
        fund.value = Math.max(1, fund.value * (1 + change));
        
        // Log significant changes
        if (Math.abs(change) > 0.05) {
            const direction = change > 0 ? "up" : "down";
            logMessage(`${fundName} ${direction} ${Math.abs(change * 100).toFixed(1)}% in market fluctuation`);
        }
    });
    
    // Update displays
    updateFundsList();
    updatePlayersList(); // To reflect new portfolio values
}

function getPerformanceClass(fund) {
    // Calculate percent change
    const percentChange = (fund.value - fund.previousValue) / fund.previousValue * 100;
    
    if (fund.frozen) return 'fund-frozen';
    
    // During setup mode, all funds are neutral
    if (gameMode === GAME_MODE.SETUP) return 'fund-neutral';
    
    // Determine visual class based on performance
    if (percentChange >= 5) return 'fund-up-strong';
    if (percentChange >= 1) return 'fund-up';
    if (percentChange <= -5) return 'fund-down-strong';
    if (percentChange <= -1) return 'fund-down';
    return 'fund-neutral';
}