// Data sharing between admin and public views
// Add this file to your project and include it in your admin HTML

// Constants
const STORAGE_KEY = 'investmentGameData';
const SHARE_INTERVAL = 500; // Share data twice per second

// Initialize data sharing
let dataSharingInterval = null;

function startDataSharing() {
    // Clear any existing interval
    if (dataSharingInterval) {
        clearInterval(dataSharingInterval);
    }
    
    // Start new interval
    dataSharingInterval = setInterval(shareGameData, SHARE_INTERVAL);
    console.log("Data sharing started");
}

function stopDataSharing() {
    if (dataSharingInterval) {
        clearInterval(dataSharingInterval);
        dataSharingInterval = null;
    }
    console.log("Data sharing stopped");
}

function shareGameData() {
    // Prepare data package to share
    const gameData = {
        gameMode: gameMode,
        phase: gameState.phase,
        timeRemaining: gameState.timeRemaining,
        funds: gameState.funds,
        players: gameState.players.map(player => {
            // Calculate total portfolio value
            const portfolioValue = player.shares ? Object.entries(player.shares).reduce((total, [fundId, shares]) => {
                const fund = gameState.funds.find(f => f.id === fundId);
                return total + (fund ? fund.price * shares : 0);
            }, 0) : 0;
            
            return {
                ...player,
                portfolioValue: portfolioValue,
                totalValue: player.money + portfolioValue
            };
        })
    };
    
    // Save to localStorage for the public view to access
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameData));
}

// Helper function to calculate player's portfolio value
function calculatePortfolioValue(player) {
    if (!player.shares) return 0;
    
    return Object.entries(player.shares).reduce((total, [fundId, shares]) => {
        const fund = gameState.funds.find(f => f.id === fundId);
        return total + (fund ? fund.price * shares : 0);
    }, 0);
}

// Add event listeners to start/stop data sharing based on game state
document.addEventListener('DOMContentLoaded', function() {
    // Add these lines to your existing code in the appropriate places
    
    // In startGame function:
    // startDataSharing();
    
    // In endGame function:
    // stopDataSharing();
});