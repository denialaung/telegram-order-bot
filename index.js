const { Telegraf, Scenes, session } = require('telegraf');
const { BaseScene, Stage } = Scenes;
const Database = require('better-sqlite3');
const moment = require('moment-timezone');
require('dotenv').config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const OWNER_ID = process.env.OWNER_ID; // Telegram ID of the bot owner

const bot = new Telegraf(BOT_TOKEN);

// Initialize SQLite database
const db = new Database('./orders.db');
db.pragma('journal_mode = WAL');

// Create table if not exists
db.exec(`CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customerName TEXT,
  inGameName TEXT,
  mlbbId TEXT,
  diamondAmount TEXT,
  paymentMethod TEXT,
  orderDateTime TEXT,
  status TEXT
)`);

console.log('Connected to the SQLite database.');

// Burmese language strings
const messages = {
  welcome: 'မင်္ဂလာပါ! Diamond မှာယူရန် /order ကိုနှိပ်ပါ။',
  askCustomerName: 'Customer Name?',
  askInGameName: 'In-Game Name?',
  askMlbbId: 'MLBB ID?',
  askDiamondAmount: 'Diamond amount?',
  askPaymentMethod: 'ငွေလွှဲနည်း (KBZ/Wave)?',
  orderConfirmation: 'သင်၏မှာယူမှုကိုလက်ခံရရှိပါပြီ။ အသေးစိတ်အချက်အလက်များမှာ အောက်ပါအတိုင်းဖြစ်ပါသည်။',
  orderSaved: 'မှာယူမှုကိုအောင်မြင်စွာသိမ်းဆည်းပြီးပါပြီ။',
  newOrderNotification: 'အော်ဒါအသစ်ရောက်ရှိပါပြီ။',
  invalidCommand: 'မှားယွင်းသော command ပါ။',
  ownerOnly: 'ဤ command ကို bot ပိုင်ရှင်သာအသုံးပြုနိုင်ပါသည်။',
  noOrders: 'လက်ရှိမှာယူမှုများမရှိပါ။',
  orderListHeader: 'လက်ရှိမှာယူမှုများ:',
  orderStatusUpdated: 'မှာယူမှုအခြေအနေကို အောင်မြင်စွာပြောင်းလဲပြီးပါပြီ။',
  invalidOrderId: 'မှားယွင်းသော မှာယူမှု ID ပါ။',
  askOrderIdForStatus: 'မည်သည့်မှာယူမှု ID ကို အခြေအနေပြောင်းလဲလိုပါသလဲ။',
  askNewStatus: 'အခြေအနေအသစ်ကိုထည့်ပါ။ (ဥပမာ: Pending, Completed, Cancelled)',
};

// Order scene
const orderScene = new BaseScene('orderScene');
orderScene.enter(async (ctx) => {
  ctx.session.order = {};
  await ctx.reply(messages.askCustomerName);
});
orderScene.on('text', async (ctx) => {
  const order = ctx.session.order;
  if (!order.customerName) {
    order.customerName = ctx.message.text;
    await ctx.reply(messages.askInGameName);
  } else if (!order.inGameName) {
    order.inGameName = ctx.message.text;
    await ctx.reply(messages.askMlbbId);
  } else if (!order.mlbbId) {
    order.mlbbId = ctx.message.text;
    await ctx.reply(messages.askDiamondAmount);
  } else if (!order.diamondAmount) {
    order.diamondAmount = ctx.message.text;
    await ctx.reply(messages.askPaymentMethod);
  } else if (!order.paymentMethod) {
    order.paymentMethod = ctx.message.text;

    const orderDateTime = moment().tz('Asia/Yangon').format('YYYY-MM-DD HH:mm:ss');
    const status = 'Pending';

    try {
      const stmt = db.prepare(`INSERT INTO orders (customerName, inGameName, mlbbId, diamondAmount, paymentMethod, orderDateTime, status) VALUES (?, ?, ?, ?, ?, ?, ?)`);
      const info = stmt.run(order.customerName, order.inGameName, order.mlbbId, order.diamondAmount, order.paymentMethod, orderDateTime, status);
      const orderId = info.lastInsertRowid;

      let confirmationMessage = `${messages.orderConfirmation}\n\n`;
      confirmationMessage += `မှာယူမှု ID: ${orderId}\n`;
      confirmationMessage += `Customer Name: ${order.customerName}\n`;
      confirmationMessage += `In-Game Name: ${order.inGameName}\n`;
      confirmationMessage += `MLBB ID: ${order.mlbbId}\n`;
      confirmationMessage += `Diamond Amount: ${order.diamondAmount}\n`;
      confirmationMessage += `ငွေလွှဲနည်း: ${order.paymentMethod}\n`;
      confirmationMessage += `အချိန်: ${orderDateTime}\n`;
      confirmationMessage += `အခြေအနေ: ${status}\n`;
      await ctx.reply(confirmationMessage);
      await ctx.reply(messages.orderSaved);

      // Notify owner
      if (OWNER_ID) {
        try {
          await bot.telegram.sendMessage(OWNER_ID, `${messages.newOrderNotification}\nမှာယူမှု ID: ${orderId}\nCustomer Name: ${order.customerName}\nDiamond Amount: ${order.diamondAmount}\nအချိန်: ${orderDateTime}`);
        } catch (err) {
          console.error('Error sending notification to owner:', err.message);
        }
      }
    } catch (err) {
      console.error('Error saving order:', err.message);
      await ctx.reply('မှာယူမှုကိုသိမ်းဆည်းရာတွင်အမှားအယွင်းဖြစ်ပွားခဲ့ပါသည်။');
    }
    ctx.scene.leave();
  }
});

const stage = new Stage([orderScene]);
bot.use(session());
bot.use(stage.middleware());

bot.start((ctx) => ctx.reply(messages.welcome));
bot.command('order', (ctx) => ctx.scene.enter('orderScene'));

bot.command('orders', async (ctx) => {
  if (String(ctx.from.id) !== OWNER_ID) {
    return ctx.reply(messages.ownerOnly);
  }

  try {
    const stmt = db.prepare(`SELECT id, customerName, diamondAmount, orderDateTime, status FROM orders ORDER BY id DESC`);
    const rows = stmt.all();

    if (rows.length === 0) {
      return ctx.reply(messages.noOrders);
    }

    let orderList = `${messages.orderListHeader}\n\n`;
    rows.forEach(row => {
      orderList += `ID: ${row.id}, Customer: ${row.customerName}, Diamond: ${row.diamondAmount}, Date: ${row.orderDateTime}, Status: ${row.status}\n`;
    });
    ctx.reply(orderList);
  } catch (err) {
    console.error('Error fetching orders:', err.message);
    ctx.reply('မှာယူမှုများကိုရယူရာတွင်အမှားအယွင်းဖြစ်ပွားခဲ့ပါသည်။');
  }
});

// Status update scene
const statusScene = new BaseScene('statusScene');
statusScene.enter(async (ctx) => {
  if (String(ctx.from.id) !== OWNER_ID) {
    await ctx.reply(messages.ownerOnly);
    return ctx.scene.leave();
  }
  ctx.session.statusUpdate = {};
  await ctx.reply(messages.askOrderIdForStatus);
});
statusScene.on('text', async (ctx) => {
  const statusUpdate = ctx.session.statusUpdate;
  if (!statusUpdate.orderId) {
    const orderId = parseInt(ctx.message.text);
    if (isNaN(orderId)) {
      await ctx.reply(messages.invalidOrderId);
      return ctx.scene.leave();
    }
    try {
      const stmt = db.prepare(`SELECT id FROM orders WHERE id = ?`);
      const row = stmt.get(orderId);
      if (!row) {
        await ctx.reply(messages.invalidOrderId);
        return ctx.scene.leave();
      }
      statusUpdate.orderId = orderId;
      await ctx.reply(messages.askNewStatus);
    } catch (err) {
      console.error('Error fetching order:', err.message);
      await ctx.reply(messages.invalidOrderId);
      return ctx.scene.leave();
    }
  } else if (!statusUpdate.newStatus) {
    statusUpdate.newStatus = ctx.message.text;
    try {
      const stmt = db.prepare(`UPDATE orders SET status = ? WHERE id = ?`);
      const info = stmt.run(statusUpdate.newStatus, statusUpdate.orderId);
      if (info.changes === 0) {
        ctx.reply(messages.invalidOrderId);
      } else {
        ctx.reply(messages.orderStatusUpdated);
      }
    } catch (err) {
      console.error('Error updating status:', err.message);
      ctx.reply('အခြေအနေပြောင်းလဲရာတွင်အမှားအယွင်းဖြစ်ပွားခဲ့ပါသည်။');
    }
    ctx.scene.leave();
  }
});

stage.register(statusScene);
bot.command('status', (ctx) => ctx.scene.enter('statusScene'));

bot.on('text', (ctx) => {
  if (!ctx.message.text.startsWith('/')) {
    ctx.reply(messages.invalidCommand);
  }
});

bot.launch();

console.log('Bot started successfully!');

// Enable graceful stop
process.once('SIGINT', () => {
  console.log('Shutting down...');
  db.close();
  process.exit(0);
});
process.once('SIGTERM', () => {
  console.log('Shutting down...');
  db.close();
  process.exit(0);
});
