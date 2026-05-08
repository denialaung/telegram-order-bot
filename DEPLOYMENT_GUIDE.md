# Deployment Guide for Telegram Order Bot

This guide will help you deploy the Telegram Order Bot to Render (free tier) or Railway.

## Prerequisites

- A Telegram bot token (you already have: `8631391925:AAHM3PvdT-NTFrA0GjaUCyvtJGfsKK-I7zc`)
- Your Telegram User ID (to receive owner commands)
- A GitHub account
- A Render or Railway account

## Step 1: Find Your Telegram User ID

1. Open Telegram and search for `@userinfobot`
2. Send it any message
3. It will reply with your user ID (a number like `123456789`)
4. Save this ID - you'll need it in the next steps

## Step 2: Push Code to GitHub

1. Create a new repository on GitHub (e.g., `telegram-order-bot`)
2. Clone the bot code to your local machine or use the command line:
   ```bash
   cd /home/ubuntu/telegram-order-bot
   git remote add origin https://github.com/YOUR_USERNAME/telegram-order-bot.git
   git branch -M main
   git push -u origin main
   ```

## Step 3: Deploy to Render

### Option A: Using Render Web Dashboard

1. Go to https://render.com and sign up/log in
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository (`telegram-order-bot`)
4. Fill in the deployment settings:
   - **Name**: `telegram-order-bot`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Select "Free"

5. Add Environment Variables:
   - Click "Add Environment Variable"
   - Add `BOT_TOKEN` = `8631391925:AAHM3PvdT-NTFrA0GjaUCyvtJGfsKK-I7zc`
   - Add `OWNER_ID` = Your Telegram User ID (from Step 1)

6. Click "Create Web Service"
7. Render will deploy your bot automatically
8. Wait for the deployment to complete (you'll see a green checkmark)
9. Your bot URL will be something like: `https://telegram-order-bot-xxxxx.onrender.com`

### Option B: Using Render CLI

1. Install Render CLI:
   ```bash
   npm install -g @render-oss/cli
   ```

2. Authenticate with Render:
   ```bash
   render login
   ```

3. Deploy:
   ```bash
   render deploy
   ```

## Step 4: Deploy to Railway (Alternative)

1. Go to https://railway.app and sign up/log in
2. Click "New Project" and select "Deploy from GitHub"
3. Connect your GitHub repository
4. Railway will automatically detect the Node.js project
5. Add environment variables in the Railway dashboard:
   - `BOT_TOKEN` = `8631391925:AAHM3PvdT-NTFrA0GjaUCyvtJGfsKK-I7zc`
   - `OWNER_ID` = Your Telegram User ID

6. Click "Deploy"
7. Your bot will be deployed and running

## Step 5: Verify Your Bot is Running

1. Open Telegram
2. Search for your bot (using the bot token, or by the bot name if you set one with BotFather)
3. Send the `/start` command
4. You should receive the welcome message in Burmese

## Step 6: Test the Bot

### For Customers:
1. Send `/order` to the bot
2. Follow the prompts to place an order
3. The bot will ask for:
   - Customer Name
   - In-Game Name
   - MLBB ID
   - Diamond Amount
   - Payment Method (KBZ/Wave)

### For Bot Owner:
1. Send `/orders` to view all orders
2. Send `/status` to update an order's status

## Troubleshooting

### Bot not responding
- Check that the environment variables are set correctly
- Verify the bot token is correct
- Check the Render/Railway logs for errors

### Database errors
- The SQLite database is created automatically on first run
- If you need to reset the database, delete `orders.db` and redeploy

### Timezone issues
- All timestamps are in Myanmar timezone (Asia/Yangon)
- This is set automatically in the bot code

## Monitoring

### Render
- Go to your service dashboard on Render
- Click "Logs" to view real-time logs
- Click "Metrics" to view CPU and memory usage

### Railway
- Go to your project on Railway
- Click "Deployments" to see deployment history
- Click "Logs" to view real-time logs

## Updating the Bot

To update the bot code:
1. Make changes to the code locally
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update bot"
   git push
   ```
3. Render/Railway will automatically redeploy

## Database Persistence

- The SQLite database is stored on the server
- Data persists between deployments
- If you need to backup orders, download the `orders.db` file from your server

## Free Tier Limitations

### Render Free Tier
- 750 hours/month of free service
- Auto-spins down after 15 minutes of inactivity
- Limited to 0.5 CPU and 512MB RAM
- Perfect for low-traffic bots

### Railway Free Tier
- $5 credit/month
- Generous free tier for small projects
- Good for continuous operation

## Next Steps

1. Deploy the bot to Render or Railway
2. Test the bot with `/start` and `/order` commands
3. Share the bot with customers
4. Monitor orders using `/orders` command

## Support

For issues or questions:
- Check the logs on Render/Railway
- Review the README.md file
- Check the bot code in `index.js`

---

**Bot Token**: `8631391925:AAHM3PvdT-NTFrA0GjaUCyvtJGfsKK-I7zc`

**Database**: SQLite (stored locally on the server)

**Language**: Burmese (Myanmar)

**Owner Commands**: `/orders`, `/status`

**Customer Commands**: `/order`, `/start`
