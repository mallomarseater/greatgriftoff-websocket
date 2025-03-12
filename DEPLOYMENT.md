# Deployment Guide for Investment Game

## Prerequisites
- Node.js installed
- Git installed
- Account on a hosting platform (Heroku recommended for beginners)
- Domain name (optional but recommended)

## Step 1: Prepare Your Application

1. Install production dependencies:
```bash
npm install express ws dotenv helmet
```

2. Create a Procfile (for Heroku):
```
web: node server.js
```

3. Set up environment variables:
Create a `.env` file (don't commit this to git):
```
NODE_ENV=production
WEBSITE_DOMAIN=https://yourdomain.com
```

## Step 2: Deploy to Heroku

1. Install Heroku CLI:
```bash
npm install -g heroku
```

2. Login to Heroku:
```bash
heroku login
```

3. Create Heroku app:
```bash
heroku create your-investment-game
```

4. Push to Heroku:
```bash
git push heroku main
```

5. Set environment variables:
```bash
heroku config:set NODE_ENV=production
heroku config:set WEBSITE_DOMAIN=https://your-investment-game.herokuapp.com
```

## Step 3: Set Up Domain (Optional)

1. Purchase domain from a provider (e.g., Namecheap)

2. Add domain to Heroku:
```bash
heroku domains:add yourdomain.com
```

3. Configure DNS with your domain provider:
- Add CNAME record pointing to your Heroku app
- Add SSL certificate (free with Heroku)

## Step 4: Security Considerations

1. Enable SSL/HTTPS:
```bash
heroku plugins:install heroku-certs
heroku certs:auto:enable
```

2. Set up security headers (already included in server.js)

3. Enable session affinity:
```bash
heroku features:enable http-session-affinity
```

## Step 5: Testing

1. Test WebSocket connection
2. Test market events
3. Test player interactions
4. Monitor error logs:
```bash
heroku logs --tail
```

## Maintenance

- Monitor application:
```bash
heroku ps
```

- Scale if needed:
```bash
heroku ps:scale web=2
```

## Troubleshooting

1. Connection issues:
- Check WebSocket logs
- Verify SSL configuration
- Check CORS settings

2. Performance issues:
- Monitor memory usage
- Check connection count
- Review event processing

3. Common fixes:
```bash
heroku restart
heroku ps:scale web=1
```

## Support

For issues:
1. Check Heroku status: https://status.heroku.com
2. Review application logs
3. Contact support if needed 