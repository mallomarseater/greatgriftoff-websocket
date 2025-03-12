// Market phases
const PHASES = {
    CLOSED: 'Markets Closed',
    TRADING: 'Trading Open'
};

// Phase button click handler
function handlePhaseButtonClick() {
    const phaseDisplay = document.getElementById('phaseDisplay');
    const phaseButton = document.getElementById('phaseButton');
    const currentPhase = phaseDisplay.textContent;
    
    if (currentPhase === PHASES.CLOSED) {
        // Open trading
        updatePhase(PHASES.TRADING, 60);
        phaseButton.textContent = 'Close Markets';
        
        // Enable buy and sell buttons
        document.getElementById('buyButton').disabled = false;
        document.getElementById('sellButton').disabled = false;
        
        // Hide notices
        document.getElementById('buyingNotice').style.display = 'none';
        document.getElementById('sellingNotice').style.display = 'none';
        
        // Show transaction controls
        document.getElementById('transactionButtons').style.display = 'block';
    } else {
        // Close markets
        updatePhase(PHASES.CLOSED, 60);
        phaseButton.textContent = 'Open Trading';
        
        // Disable buy and sell buttons
        document.getElementById('buyButton').disabled = true;
        document.getElementById('sellButton').disabled = true;
        
        // Show notices
        document.getElementById('buyingNotice').style.display = 'block';
        document.getElementById('buyingNotice').textContent = 'Trading is only allowed when markets are open';
        document.getElementById('sellingNotice').style.display = 'block';
        document.getElementById('sellingNotice').textContent = 'Trading is only allowed when markets are open';
        
        // Hide transaction controls
        document.getElementById('transactionButtons').style.display = 'none';
    }
}

// Initialize phases
function initializePhases() {
    const phaseButton = document.getElementById('phaseButton');
    if (phaseButton) {
        phaseButton.textContent = 'Open Trading';
        phaseButton.addEventListener('click', handlePhaseButtonClick);
    }
    
    // Start with markets closed
    updatePhase(PHASES.CLOSED, 60);
}

// Export functions
window.initializePhases = initializePhases;
window.PHASES = PHASES;