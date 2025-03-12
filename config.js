// Environment configuration
const config = {
    // Port configuration
    port: process.env.PORT || 3000,
    
    // WebSocket configuration
    wsOptions: {
        // Enable client tracking
        clientTracking: true,
        // Handle production proxy headers
        proxy: process.env.NODE_ENV === 'production'
    },
    
    // Security settings
    security: {
        // CORS origins - update with your domain in production
        allowedOrigins: process.env.NODE_ENV === 'production'
            ? [process.env.WEBSITE_DOMAIN || 'https://yourdomain.com']
            : ['http://localhost:3000']
    }
};

module.exports = config; 