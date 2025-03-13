// Market Events System

// Event database
const marketEvents = {
    // Trump Coin Events
    "trump_executive_order": {
        fundId: "trump_coin",
        title: "Trump issues Executive Order #15930",
        description: "Trump issues Executive Order #15930 to extend his second term by 4 more years. The stock market collapses, but not $$Trump Coin, which skyrockets 40% fueled by Truth Social posts and the MyPillow Guy's endorsement. 🚀🦅",
        effect: 0.40, // 40% increase
        image: "images/trump_executive_order.jpg"
    },
    "trump_rug_pull": {
        fundId: "trump_coin",
        title: "The rug pull everyone not on Truth Social saw coming",
        description: "Crypto whales cash out, leaving bag holders in shambles. Fund plummets 90%. The phrase \"This is election interference!!!\" trends on Twitter. 🫠📉",
        effect: -0.90, // 90% decrease
        image: "images/trump_rug_pull.jpg"
    },
    
    // Checkpoint Therapeutics Events
    "checkpoint_fda_rejection": {
        fundId: "checkpoint",
        title: "FDA rejects Checkpoint's latest drug submission",
        description: "Apparently, hope is not an active ingredient. Stock crashes 35%. Investors pray for a short squeeze. 📉",
        effect: -0.35 // 35% decrease
    },
    
    // Boeing Events
    "boeing_no_chairs": {
        fundId: "boeing",
        title: "Boeing announces new cost-cutting measures: planes now come without chairs",
        description: "CEO calls it \"standing-room luxury.\" Shareholders love it—stock jumps 30%. 🚀💺",
        effect: 0.30 // 30% increase
    },
    "boeing_doors_off": {
        fundId: "boeing",
        title: "A United Airlines flight leaves passengers shaken",
        description: "All six doors on the Boeing 737 MAX fell off mid-flight. United scrambles to refund 230 passengers and cuts down on future Boeing orders to make up for the loss. Fund drops 20%. FAA reassures the public: \"It's mostly safe.\" 😬✈️",
        effect: -0.20 // 20% decrease
    },
    
    // Luigi Mangione Events
    "luigi_green_sweater": {
        fundId: "luigi",
        title: "New pics of Luigi in a green sweater released by the press",
        description: "Your mom sees them, leaves your dad, and donates her life savings to him. Fund skyrockets 69%. (Nice.) 💰💚",
        effect: 0.69 // 69% increase
    },
    
    // Taylor Swift Events
    "taylor_new_dates": {
        fundId: "taylor",
        title: "New tour dates announced!",
        description: "A Netflix documentary drops covering the behind-the-scenes decisions that led to adding more cities. Fund jumps 40% as Swifties refinance their homes to afford tickets. 🏡➡️💸",
        effect: 0.40 // 40% increase
    },
    "taylor_engagement": {
        fundId: "taylor",
        title: "Rumors swirl of Taylor's engagement to Travis Kelce",
        description: "To prepare for her new chapter, she buys a modest family-sized private jet—a 32-passenger upgrade to supplement her \"tiny\" 16-passenger jet. Environmentalists panic. Swifties justify it. Fund drops 25%. 💔✈️",
        effect: -0.25 // 25% decrease
    }
};

// Function to trigger an event
function triggerMarketEvent(eventId) {
    // Check if event exists
    if (!marketEvents[eventId]) {
        console.error(`Event with ID "${eventId}" not found`);
        return false;
    }
    
    const event = marketEvents[eventId];
    
    // Send the event to the server via WebSocket
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'marketEvent',
            eventType: eventId,
            fundId: event.fundId
        }));
        return true;
    } else {
        console.error('WebSocket not connected');
        return false;
    }
}

// Function to broadcast event to public view
function broadcastMarketEvent(event) {
    // Create event object for public view
    const publicEvent = {
        type: "marketEvent",
        title: event.title,
        description: event.description,
        fundId: event.fundId,
        effect: event.effect,
        image: event.image,
        timestamp: new Date().toISOString()
    };
    
    // Store in localStorage for public view to access
    localStorage.setItem('latestMarketEvent', JSON.stringify(publicEvent));
}

// Make functions available globally
window.triggerMarketEvent = triggerMarketEvent;
