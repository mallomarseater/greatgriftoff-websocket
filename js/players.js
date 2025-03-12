// Initialize players
let players = {};

// Player management
function addPlayer() {
    console.log('addPlayer function called');
    const playerNameInput = document.getElementById('playerNameInput');
    const playerName = playerNameInput.value.trim();
    
    console.log('Player input element:', playerNameInput);
    
    if (!playerName) {
        alert('Please enter a player name');
        return;
    }
    
    console.log('Player name entered:', playerName);
    
    try {
        // Create player with starting money
        const startingMoney = 100000;
        console.log('Creating player with starting money:', startingMoney);
        
        // Get or create player using the game state
        const player = getOrCreatePlayer(playerName);
        
        // Update displays
        updatePlayersList();
        updatePlayerSelects();
        
        // Clear input
        playerNameInput.value = '';
        
        console.log('Player added successfully:', playerName);
    } catch (error) {
        console.error('Error adding player:', error);
        alert('Error adding player: ' + error.message);
    }
}

// Add event listener for the add player button
document.getElementById('addPlayerButton').addEventListener('click', addPlayer);

// Add event listener for Enter key in the player name input
document.getElementById('playerNameInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addPlayer();
    }
});

function calculatePlayerValue(playerName) {
    const player = players[playerName];
    let totalValue = player.cash;
    
    Object.keys(player.portfolio).forEach(fundName => {
        const shares = player.portfolio[fundName];
        const fundValue = funds[fundName].value;
        totalValue += shares * fundValue;
    });
    
    return totalValue;
}

function updatePlayerDropdowns() {
    const buyPlayerSelect = document.getElementById('buyPlayerSelect');
    const sellPlayerSelect = document.getElementById('sellPlayerSelect');
    
    // Clear existing options
    buyPlayerSelect.innerHTML = '';
    sellPlayerSelect.innerHTML = '';
    
    // Add default empty option
    const defaultOption1 = document.createElement('option');
    defaultOption1.value = '';
    defaultOption1.textContent = 'Select Player';
    buyPlayerSelect.appendChild(defaultOption1);
    
    const defaultOption2 = document.createElement('option');
    defaultOption2.value = '';
    defaultOption2.textContent = 'Select Player';
    sellPlayerSelect.appendChild(defaultOption2);
    
    // Add player options
    Object.keys(players).forEach(playerName => {
        const option1 = document.createElement('option');
        option1.value = playerName;
        option1.textContent = playerName;
        buyPlayerSelect.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = playerName;
        option2.textContent = playerName;
        sellPlayerSelect.appendChild(option2);
    });
}