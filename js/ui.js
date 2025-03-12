function updatePlayersList() {
    const playersList = document.getElementById('playersList');
    playersList.innerHTML = '';
    
    Object.keys(players).forEach(playerName => {
        const player = players[playerName];
        const totalValue = calculatePlayerValue(playerName);
        
        const playerDiv = document.createElement('div');
        playerDiv.style.marginBottom = '10px';
        playerDiv.style.padding = '8px';
        playerDiv.style.backgroundColor = '#f8f9fa';
        playerDiv.style.borderRadius = '4px';
        
        const playerHeader = document.createElement('div');
        playerHeader.style.fontWeight = 'bold';
        playerHeader.textContent = `${playerName} - Cash: $${player.cash.toLocaleString()} - Total value: $${totalValue.toLocaleString()}`;
        playerDiv.appendChild(playerHeader);
        
        // Add portfolio details if they have any
        let hasPortfolio = false;
        
        Object.keys(player.portfolio).forEach(fundName => {
            const shares = player.portfolio[fundName];
            if (shares > 0) {
                hasPortfolio = true;
                const fundValue = funds[fundName].value;
                const holdingValue = shares * fundValue;
                
                const holdingDiv = document.createElement('div');
                holdingDiv.style.marginLeft = '15px';
                holdingDiv.style.fontSize = '0.9em';
                
                // Show pending sells if any
                let pendingText = '';
                if (player.pending && player.pending[fundName] > 0) {
                    pendingText = ` (${player.pending[fundName]} pending sell)`;
                }
                
                // Determine if the holding is profitable
                const performanceClass = getPerformanceClass(funds[fundName]);
                holdingDiv.textContent = `${fundName}: ${shares} shares${pendingText} - Value: $${holdingValue.toLocaleString()}`;
                
                // Add a colored dot to indicate performance
                const indicator = document.createElement('span');
                indicator.style.display = 'inline-block';
                indicator.style.width = '10px';
                indicator.style.height = '10px';
                indicator.style.borderRadius = '50%';
                indicator.style.marginRight = '5px';
                
                switch (performanceClass) {
                    case 'fund-up-strong':
                        indicator.style.backgroundColor = '#4CAF50';
                        break;
                    case 'fund-up':
                        indicator.style.backgroundColor = '#8BC34A';
                        break;
                    case 'fund-neutral':
                        indicator.style.backgroundColor = '#9E9E9E';
                        break;
                    case 'fund-down':
                        indicator.style.backgroundColor = '#FF9800';
                        break;
                    case 'fund-down-strong':
                        indicator.style.backgroundColor = '#F44336';
                        break;
                }
                
                holdingDiv.prepend(indicator);
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
        
        // Add pending buys if any exist
        let hasPendingBuys = false;
        pendingTransactions.forEach(transaction => {
            if (transaction.type === 'buy' && transaction.player === playerName) {
                if (!hasPendingBuys) {
                    const pendingHeader = document.createElement('div');
                    pendingHeader.style.marginTop = '5px';
                    pendingHeader.style.fontWeight = 'bold';
                    pendingHeader.textContent = 'Pending Buy Orders:';
                    playerDiv.appendChild(pendingHeader);
                    hasPendingBuys = true;
                }
                
                const pendingDiv = document.createElement('div');
                pendingDiv.style.marginLeft = '15px';
                pendingDiv.style.fontSize = '0.9em';
                pendingDiv.style.color = '#2196F3';
                pendingDiv.textContent = `${transaction.shares} shares of ${transaction.fund} at $${transaction.price.toFixed(2)}`;
                playerDiv.appendChild(pendingDiv);
            }
        });
        
        playersList.appendChild(playerDiv);
    });
}

function updateFundsList() {
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
        
        // Show waiting impact during setup mode
        let pendingImpactText = '';
        if (gameMode === GAME_MODE.SETUP && pendingPriceImpacts[fundName] !== 0) {
            const pendingImpact = pendingPriceImpacts[fundName] * 100;
            const impactDirection = pendingImpact > 0 ? 'up' : 'down';
            const impactClass = pendingImpact > 0 ? 'up-arrow' : 'down-arrow';
            pendingImpactText = ` <span class="${impactClass}">(${impactDirection} ${Math.abs(pendingImpact).toFixed(1)}% pending)</span>`;
        }
        
        fundDiv.innerHTML = `
            ${fundName}: $${fund.value.toFixed(2)} 
            <span class="${arrowClass}">${arrow} ${Math.abs(changeText)}%</span>${frozenText}${pendingImpactText}
        `;
        
        fundsList.appendChild(fundDiv);
    });
}