// Constants for data storage
const STORAGE_KEY = 'investmentGameData';
const REFRESH_INTERVAL = 1000; // Check for updates every second

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("Public view initialized");
    
    // Update QR codes initially
    updateQrCodes();
    
    // Start the update loop
    setInterval(checkForUpdates, REFRESH_INTERVAL);
    
    // Perform first update immediately
    checkForUpdates();
});

function checkForUpdates() {
    // Get data from localStorage
    const dataString = localStorage.getItem(STORAGE_KEY);
    if (!dataString) return;
    
    try {
        const data = JSON.parse(dataString);
        
        // Update UI elements with the data
        updatePhaseDisplay(data.currentPhase, data.phaseTimeRemaining);
        updateFundsList(data.funds);
        updatePlayersList(data.players);
        updateMarketStatus(data.currentPhase);
        
        // Check if QR codes need updating
        updateQrCodes();
    } catch (error) {
        console.error("Error parsing game data:", error);
    }
}

function updateQrCodes() {
    const buyFormUrl = localStorage.getItem('buyFormUrl');
    const sellFormUrl = localStorage.getItem('sellFormUrl');
    
    const buyQrCode = document.getElementById('buyQrCode');
    const sellQrCode = document.getElementById('sellQrCode');
    
    if (buyFormUrl) {
        buyQrCode.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(buyFormUrl)}`;
    }
    
    if (sellFormUrl) {
        sellQrCode.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(sellFormUrl)}`;
    }
}

function updatePhaseDisplay(phase, timeRemaining) {
    const phaseDisplay = document.getElementById('phaseDisplay');
    const phaseTimer = document.getElementById('phaseTimer');
    
    // Update phase name
    phaseDisplay.textContent = getPhaseName(phase);
    
    // Update phase timer
    phaseTimer.textContent = `${timeRemaining}s`;
    
    // Update phase styling
    phaseDisplay.className = 'phase-display';
    if (phase === 'buying') {
        phaseDisplay.classList.add('buying-phase');
    } else if (phase === 'selling') {
        phaseDisplay.classList.add('selling-phase');
    } else {
        phaseDisplay.classList.add('closed-phase');
    }
}

function updateFundsList(funds) {
    const fundsList = document.getElementById('fundsList');
    fundsList.innerHTML = '';
    
    Object.keys(funds).forEach(fundName => {
        const fund = funds[fundName];
        const fundDiv = document.createElement('div');
        
        // Calculate percent change
        const percentChange = (fund.value - fund.previousValue) / fund.previousValue * 100;
        const changeText = percentChange.toFixed(2);
        const arrow = percentChange >= 0 ? '↑' : '↓';
        const arrowClass = percentChange >= 0 ? 'up-arrow' : 'down-arrow';
        
        // Set appropriate class based on performance
        fundDiv.className = `fund-item ${getPerformanceClass(fund)}`;
        
        // Show frozen status if applicable
        const frozenText = fund.frozen ? ' [FROZEN]' : '';
        
        fundDiv.innerHTML = `
            ${fundName}: $${fund.value.toFixed(2)} 
            <span class="${arrowClass}">${arrow} ${Math.abs(changeText)}%</span>${frozenText}
        `;
        
        fundsList.appendChild(fundDiv);
    });
}

function updatePlayersList(players) {
    const playersList = document.getElementById('playersList');
    playersList.innerHTML = '';
    
    Object.keys(players).forEach(playerName => {
        const player = players[playerName];
        
        const playerDiv = document.createElement('div');
        playerDiv.style.marginBottom = '10px';
        playerDiv.style.padding = '8px';
        playerDiv.style.backgroundColor = '#f8f9fa';
        playerDiv.style.borderRadius = '4px';
        
        const playerHeader = document.createElement('div');
        playerHeader.style.fontWeight = 'bold';
        playerHeader.textContent = `${playerName} - Cash: $${player.cash.toLocaleString()} - Total value: $${player.totalValue.toLocaleString()}`;
        playerDiv.appendChild(playerHeader);
        
        // Add portfolio details if they have any
        let hasPortfolio = false;
        
        Object.keys(player.portfolio).forEach(fundName => {
            const shares = player.portfolio[fundName];
            if (shares > 0) {
                hasPortfolio = true;
                
                const holdingDiv = document.createElement('div');
                holdingDiv.style.marginLeft = '15px';
                holdingDiv.style.fontSize = '0.9em';
                holdingDiv.textContent = `${fundName}: ${shares} shares`;
                
                playerDiv.appendChild(holdingDiv);
            }
        });
        
        if (!hasPortfolio) {
            const noHoldingsDiv = document.createElement('div');
            noHoldingsDiv.style.marginLeft = '15px';
            noHoldingsDiv.style.fontStyle = 'italic';
            noHoldingsDiv.textContent = 'No holdings';
            playerDiv.appendChild(noHoldingsDiv);
        }
        
        playersList.appendChild(playerDiv);
    });
}

function updateMarketStatus(phase) {
    const marketStatus = document.getElementById('marketStatus');
    
    if (phase === 'markets_closed') {
        marketStatus.textContent = "ACTIVE";
        marketStatus.className = "market-status active";
    } else {
        marketStatus.textContent = "FROZEN";
        marketStatus.className = "market-status frozen";
    }
}

function getPerformanceClass(fund) {
    // Calculate percent change
    const percentChange = (fund.value - fund.previousValue) / fund.previousValue * 100;
    
    if (fund.frozen) return 'fund-frozen';
    
    // Determine visual class based on performance
    if (percentChange >= 5) return 'fund-up-strong';
    if (percentChange >= 1) return 'fund-up';
    if (percentChange <= -5) return 'fund-down-strong';
    if (percentChange <= -1) return 'fund-down';
    return 'fund-neutral';
}

function getPhaseName(phase) {
    switch (phase) {
        case 'markets_closed':
            return 'Markets Closed';
        case 'buying':
            return 'Buying Period';
        case 'selling':
            return 'Selling Period';
        default:
            return 'Unknown Phase';
    }
}

// Check for market events
function checkForMarketEvents() {
    const eventJson = localStorage.getItem('latestMarketEvent');
    if (!eventJson) return;
    
    try {
        const event = JSON.parse(eventJson);
        
        // Check if we've already displayed this event
        const lastEventTimestamp = localStorage.getItem('lastDisplayedEventTimestamp');
        if (lastEventTimestamp && lastEventTimestamp === event.timestamp) {
            return;
        }
        
        // Display the event
        displayMarketEvent(event);
        
        // Mark as displayed
        localStorage.setItem('lastDisplayedEventTimestamp', event.timestamp);
        
        // Clear from localStorage after displaying
        // localStorage.removeItem('latestMarketEvent');
    } catch (error) {
        console.error("Error parsing market event:", error);
    }
}

function displayMarketEvent(event) {
    const container = document.getElementById('marketEventContainer');
    const title = document.getElementById('eventTitle');
    const image = document.getElementById('eventImage');
    const description = document.getElementById('eventDescription');
    const fund = document.getElementById('eventFund');
    const effect = document.getElementById('eventEffect');
    
    // Set content
    title.textContent = event.title;
    image.src = event.image;
    description.textContent = event.description;
    fund.textContent = `${event.fund}: `;
    
    // Format effect
    const effectValue = (event.effect * 100).toFixed(0);
    const effectText = event.effect >= 0 ? `+${effectValue}%` : `${effectValue}%`;
    effect.textContent = effectText;
    effect.className = event.effect >= 0 ? 'positive-effect' : 'negative-effect';
    
    // Show the container
    container.style.display = 'block';
    
    // Automatically hide after 10 seconds
    setTimeout(() => {
        container.style.display = 'none';
    }, 10000);
}

// Add to your existing checkForUpdates function
function checkForUpdates() {
    // Existing code...
    
    // Also check for market events
    checkForMarketEvents();
}