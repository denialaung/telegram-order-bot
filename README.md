# Telegram Order Bot

A Telegram bot that takes customer orders step-by-step and stores them in a local SQLite database. All bot messages are in Burmese language.

## Features

- **Customer Order Flow**: Customers can place orders by sending `/order` command
- **Step-by-Step Questions**: Bot asks for Customer Name, In-Game Name, MLBB ID, Diamond Amount, and Payment Method
- **Order Storage**: Orders are stored in SQLite database with timestamps in Myanmar timezone
- **Owner Management**: Bot owner can view all orders and update order status
- **Burmese Language**: All bot messages are in Burmese (Myanmar language)

## Bot Commands

### For Customers
- `/order` - Start the order process
- `/start` - Welcome message

### For Bot Owner (requires OWNER_ID)
- `/orders` - View all orders
- `/status` - Update order status

## Local Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Create `.env` file**:
   ```
   BOT_TOKEN=your_bot_token_here
   OWNER_ID=your_telegram_id_here
   ```

3. **Run the bot**:
   ```bash
   npm start
   ```

## Deployment to Render

1. **Create a GitHub repository** and push the code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/your-username/telegram-order-bot.git
   git push -u origin main
   ```

2. **Create a Render account** at https://render.com

3. **Create a new Web Service**:
   - Connect your GitHub repository
   - Set the build command to `npm install`
   - Set the start command to `npm start`
   - Add environment variables:
     - `BOT_TOKEN`: Your Telegram bot token
     - `OWNER_ID`: Your Telegram user ID

4. **Deploy**: Render will automatically deploy your bot

## Deployment to Railway

1. **Create a Railway account** at https://railway.app

2. **Connect your GitHub repository**

3. **Add environment variables**:
   - `BOT_TOKEN`: Your Telegram bot token
   - `OWNER_ID`: Your Telegram user ID

4. **Deploy**: Railway will automatically deploy your bot

## Database Schema

The SQLite database has the following table:

```sql
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customerName TEXT,
  inGameName TEXT,
  mlbbId TEXT,
  diamondAmount TEXT,
  paymentMethod TEXT,
  orderDateTime TEXT,
  status TEXT
);
```

## Order Status

Orders are created with the status "Pending" and can be updated to other statuses like "Completed" or "Cancelled" using the `/status` command.

## Finding Your Telegram ID

To get your Telegram ID:
1. Send a message to @userinfobot on Telegram
2. It will reply with your user ID

## Notes

- The bot uses polling to receive updates from Telegram
- Orders are stored locally in the SQLite database
- The database file (`orders.db`) is created automatically on first run
- All timestamps are in Myanmar timezone (Asia/Yangon)

## Support

For issues or questions, please contact the bot owner.
