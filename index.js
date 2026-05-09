const { Telegraf, Scenes, session, Markup } = require('telegraf');
const { BaseScene, Stage } = Scenes;
const Database = require('better-sqlite3');
const moment = require('moment-timezone');
require('dotenv').config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const OWNER_ID = process.env.OWNER_ID; // Telegram ID of the bot owner

// Google Sheets setup via Apps Script Web App
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzqrqcNt-TVKtL0SKqLSlsVaHDcGfoEmOi88OZjhlmwKKUBLaw8GQ6R7cZQ6FKyaC47/exec';

// Function to append order to Google Sheet
async function appendToGoogleSheet(orderData) {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
      redirect: 'follow'
    });
    
    if (response.ok) {
      console.log('Order appended to Google Sheet successfully');
    } else {
      console.log('Google Sheets append failed:', response.status);
    }
  } catch (err) {
    console.error('Error appending to Google Sheet:', err.message);
  }
}

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
  screenshot TEXT,
  orderDateTime TEXT,
  status TEXT,
  chatId TEXT
)`);

// Add chatId column if not exists (migration for existing db)
try {
  db.exec(`ALTER TABLE orders ADD COLUMN chatId TEXT`);
} catch (e) {
  // Column already exists, ignore
}

console.log('Connected to the SQLite database.');

// Price list
const priceList = `💎 MLBB Diamond ဈေးနှုန်းစာရင်း 💎

Weekly Pass - 6700Ks

💎86 Dia - 5850Ks
💎172 Dia - 10900Ks
💎257 Dia - 15900Ks
💎343 Dia - 21900Ks
💎514 Dia - 32500Ks
💎600 Dia - 37500Ks
💎706 Dia - 43500Ks
💎1049 Dia - 63500Ks
💎1135 Dia - 68500Ks
💎2195 Dia - 127500Ks
💎3688 Dia - 212500Ks
💎5532 Dia - 316500Ks
💎9288 Dia - 526500Ks

〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️
💎 Dia 2x Price List 💎

💎Dia 50+50 - 4500Ks
💎Dia 150+150 - 11500Ks
💎Dia 250+250 - 17500Ks
💎Dia 500+500 - 34500Ks

〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️
💎 Other Dia Package 💎

Twilight Pass - 36500Ks
Weekly Bundle - 3950Ks (တစ်ပတ်တစ်ခါထည့်ရ)
Monthly Bundle - 18500Ks (တစ်လတစ်ခါထည့်ရ)
Normal Starlight - 12500Ks
Premium Starlight - 24500Ks

〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️
📞 Order တင်ရန်: 09777497776
💰 ငွေလွှဲနည်း: KBZ Pay / Wave Pay`;

// Burmese language strings
const messages = {
  welcome: 'မင်္ဂလာပါ ခင်ဗျာ',
  askCustomerName: 'Customer Name လေးပြောပေးပါခင်ဗျာ',
  askInGameName: 'In-Game Name ပို့ပေးပါခင်ဗျာ',
  askMlbbId: 'Game ID နဲ့ Server ID ပို့ပေးပါခင်ဗျာ',
  askDiamondAmount: 'Diamond Amount လေးဘယ်လောက်ဝယ်ချင်ပါလဲခင်ဗျာ',
  askPaymentMethod: '09777497776 နံပါတ်ကို KBZ Pay, Wave Pay နဲ့ငွေလွှဲပြီး ဝယ်ယူနိုင်ပါတယ်၊ ဘယ်လိုဝယ်ယူချင်ပါလဲခင်ဗျာ',
  askScreenshot: 'ငွေလွှဲပြီးရင် Screenshot လေးပို့ပေးပါဦးခင်ဗျာ',
  orderConfirmation: 'သင်၏မှာယူမှုကိုလက်ခံရရှိပါပြီ။ အသေးစိတ်အချက်အလက်များမှာ အောက်ပါအတိုင်းဖြစ်ပါသည်။',
  orderSaved: 'မှာယူမှုကိုအောင်မြင်စွာသိမ်းဆည်းပြီးပါပြီ။ ကျေးဇူးတင်ပါတယ်ခင်ဗျာ 🙏',
  newOrderNotification: '🔔 အော်ဒါအသစ်ရောက်ရှိပါပြီ။',
  invalidCommand: 'Order တင်ရန် နောက်ထပ်အချက်အလက်တွေပို့ပေးပါဦးခင်ဗျာ',
  ownerOnly: 'ဤ command ကို bot ပိုင်ရှင်သာအသုံးပြုနိုင်ပါသည်။',
  noOrders: 'လက်ရှိမှာယူမှုများမရှိပါ။',
  orderListHeader: '📋 လက်ရှိမှာယူမှုများ:',
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
orderScene.on('photo', async (ctx) => {
  const order = ctx.session.order;
  if (order.paymentMethod && !order.screenshot) {
    // Get the largest photo
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    order.screenshot = photo.file_id;

    const orderDateTime = moment().tz('Asia/Yangon').format('YYYY-MM-DD HH:mm:ss');
    const status = 'Pending';

    try {
      const stmt = db.prepare(`INSERT INTO orders (customerName, inGameName, mlbbId, diamondAmount, paymentMethod, screenshot, orderDateTime, status, chatId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      const info = stmt.run(order.customerName, order.inGameName, order.mlbbId, order.diamondAmount, order.paymentMethod, order.screenshot, orderDateTime, status, String(ctx.from.id));
      const orderId = info.lastInsertRowid;

      // Append to Google Sheet
      appendToGoogleSheet({
        orderId: orderId,
        customerName: order.customerName,
        inGameName: order.inGameName,
        mlbbId: order.mlbbId,
        diamondAmount: order.diamondAmount,
        paymentMethod: order.paymentMethod,
        orderDateTime: orderDateTime,
        status: status,
        chatId: String(ctx.from.id)
      });

      let confirmationMessage = `${messages.orderConfirmation}\n\n`;
      confirmationMessage += `📝 မှာယူမှု ID: ${orderId}\n`;
      confirmationMessage += `👤 Customer Name: ${order.customerName}\n`;
      confirmationMessage += `🎮 In-Game Name: ${order.inGameName}\n`;
      confirmationMessage += `🆔 Game ID: ${order.mlbbId}\n`;
      confirmationMessage += `💎 Diamond Amount: ${order.diamondAmount}\n`;
      confirmationMessage += `💰 ငွေလွှဲနည်း: ${order.paymentMethod}\n`;
      confirmationMessage += `🕐 အချိန်: ${orderDateTime}\n`;
      confirmationMessage += `📌 အခြေအနေ: ${status}\n`;
      await ctx.reply(confirmationMessage);
      await ctx.reply(messages.orderSaved);

      // Notify owner
      if (OWNER_ID) {
        try {
          let ownerMsg = `${messages.newOrderNotification}\n\n`;
          ownerMsg += `📝 မှာယူမှု ID: ${orderId}\n`;
          ownerMsg += `👤 Customer: ${order.customerName}\n`;
          ownerMsg += `🎮 In-Game Name: ${order.inGameName}\n`;
          ownerMsg += `🆔 Game ID: ${order.mlbbId}\n`;
          ownerMsg += `💎 Diamond: ${order.diamondAmount}\n`;
          ownerMsg += `💰 Payment: ${order.paymentMethod}\n`;
          ownerMsg += `🕐 အချိန်: ${orderDateTime}`;
          await bot.telegram.sendMessage(OWNER_ID, ownerMsg);
          // Forward screenshot to owner
          await bot.telegram.sendPhoto(OWNER_ID, photo.file_id, { caption: `Order #${orderId} - ${order.customerName} - Screenshot` });
        } catch (err) {
          console.error('Error sending notification to owner:', err.message);
        }
      }
    } catch (err) {
      console.error('Error saving order:', err.message);
      await ctx.reply('မှာယူမှုကိုသိမ်းဆည်းရာတွင်အမှားအယွင်းဖြစ်ပွားခဲ့ပါသည်။');
    }
    ctx.scene.leave();
  } else {
    await ctx.reply('အချက်အလက်တွေ အရင်ဖြည့်ပေးပါခင်ဗျာ');
  }
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
    await ctx.reply(messages.askScreenshot);
  } else if (order.paymentMethod && !order.screenshot) {
    // If they send text instead of photo, save without screenshot
    const orderDateTime = moment().tz('Asia/Yangon').format('YYYY-MM-DD HH:mm:ss');
    const status = 'Pending';

    try {
      const stmt = db.prepare(`INSERT INTO orders (customerName, inGameName, mlbbId, diamondAmount, paymentMethod, screenshot, orderDateTime, status, chatId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      const info = stmt.run(order.customerName, order.inGameName, order.mlbbId, order.diamondAmount, order.paymentMethod, ctx.message.text, orderDateTime, status, String(ctx.from.id));
      const orderId = info.lastInsertRowid;

      // Append to Google Sheet
      appendToGoogleSheet({
        orderId: orderId,
        customerName: order.customerName,
        inGameName: order.inGameName,
        mlbbId: order.mlbbId,
        diamondAmount: order.diamondAmount,
        paymentMethod: order.paymentMethod,
        orderDateTime: orderDateTime,
        status: status,
        chatId: String(ctx.from.id)
      });

      let confirmationMessage = `${messages.orderConfirmation}\n\n`;
      confirmationMessage += `📝 မှာယူမှု ID: ${orderId}\n`;
      confirmationMessage += `👤 Customer Name: ${order.customerName}\n`;
      confirmationMessage += `🎮 In-Game Name: ${order.inGameName}\n`;
      confirmationMessage += `🆔 Game ID: ${order.mlbbId}\n`;
      confirmationMessage += `💎 Diamond Amount: ${order.diamondAmount}\n`;
      confirmationMessage += `💰 ငွေလွှဲနည်း: ${order.paymentMethod}\n`;
      confirmationMessage += `🕐 အချိန်: ${orderDateTime}\n`;
      confirmationMessage += `📌 အခြေအနေ: ${status}\n`;
      await ctx.reply(confirmationMessage);
      await ctx.reply(messages.orderSaved);

      // Notify owner
      if (OWNER_ID) {
        try {
          let ownerMsg = `${messages.newOrderNotification}\n\n`;
          ownerMsg += `📝 မှာယူမှု ID: ${orderId}\n`;
          ownerMsg += `👤 Customer: ${order.customerName}\n`;
          ownerMsg += `🎮 In-Game Name: ${order.inGameName}\n`;
          ownerMsg += `🆔 Game ID: ${order.mlbbId}\n`;
          ownerMsg += `💎 Diamond: ${order.diamondAmount}\n`;
          ownerMsg += `💰 Payment: ${order.paymentMethod}\n`;
          ownerMsg += `🕐 အချိန်: ${orderDateTime}`;
          await bot.telegram.sendMessage(OWNER_ID, ownerMsg);
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
      await ctx.reply('Status ရွေးပါ:', Markup.inlineKeyboard([
        [Markup.button.callback('⏳ Pending', `status_pending_${orderId}`)],
        [Markup.button.callback('✅ Done', `status_done_${orderId}`)]
      ]));
      ctx.scene.leave();
    } catch (err) {
      console.error('Error fetching order:', err.message);
      await ctx.reply(messages.invalidOrderId);
      return ctx.scene.leave();
    }
  }
});

const stage = new Stage([orderScene, statusScene]);
bot.use(session());
bot.use(stage.middleware());

// Handle status button callbacks
bot.action(/status_pending_(\d+)/, async (ctx) => {
  const orderId = ctx.match[1];
  await ctx.answerCbQuery();
  try {
    const stmt = db.prepare(`UPDATE orders SET status = ? WHERE id = ?`);
    stmt.run('Pending', orderId);
    await ctx.editMessageText(`Order #${orderId} - Status: ⏳ Pending`);
  } catch (err) {
    console.error('Error updating status:', err.message);
  }
});

bot.action(/status_done_(\d+)/, async (ctx) => {
  const orderId = ctx.match[1];
  await ctx.answerCbQuery();
  try {
    const stmt = db.prepare(`UPDATE orders SET status = ? WHERE id = ?`);
    stmt.run('Done', orderId);
    await ctx.editMessageText(`Order #${orderId} - Status: ✅ Done`);
    
    // Send success message to customer
    const orderStmt = db.prepare(`SELECT chatId, customerName FROM orders WHERE id = ?`);
    const order = orderStmt.get(orderId);
    if (order && order.chatId) {
      const doneMessage = `Order Successful! ✅\nဝယ်ယူအားပေးမှုအတွက်ကျေးဇူးအထူးတင်ပါတယ်ခင်ဗျာ\nနောက်လည်းအားပေးပါဦးခင်ဗျာ! 🙏`;
      await bot.telegram.sendMessage(order.chatId, doneMessage);
    }
  } catch (err) {
    console.error('Error updating status:', err.message);
  }
});

// Start command with inline keyboard buttons
bot.start(async (ctx) => {
  await ctx.reply(messages.welcome);
  await ctx.reply(priceList, Markup.inlineKeyboard([
    [Markup.button.callback('💎 ဈေးနှုန်းကြည့်ရန်နှိပ်ပါ', 'view_prices')],
    [Markup.button.callback('🛒 Order တင်ရန်နှိပ်ပါ', 'place_order')]
  ]));
});

// Handle button callbacks
bot.action('view_prices', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply(priceList);
});

bot.action('place_order', async (ctx) => {
  await ctx.answerCbQuery();
  ctx.scene.enter('orderScene');
});

bot.command('order', (ctx) => ctx.scene.enter('orderScene'));
bot.command('prices', (ctx) => ctx.reply(priceList));

bot.command('orders', async (ctx) => {
  if (String(ctx.from.id) !== OWNER_ID) {
    return ctx.reply(messages.ownerOnly);
  }

  try {
    const stmt = db.prepare(`SELECT id, customerName, inGameName, mlbbId, diamondAmount, paymentMethod, orderDateTime, status FROM orders ORDER BY id DESC LIMIT 20`);
    const rows = stmt.all();

    if (rows.length === 0) {
      return ctx.reply(messages.noOrders);
    }

    let orderList = `${messages.orderListHeader}\n\n`;
    rows.forEach(row => {
      orderList += `📝 ID: ${row.id}\n`;
      orderList += `👤 ${row.customerName} | 🎮 ${row.inGameName}\n`;
      orderList += `🆔 ${row.mlbbId} | 💎 ${row.diamondAmount}\n`;
      orderList += `💰 ${row.paymentMethod} | 📌 ${row.status}\n`;
      orderList += `🕐 ${row.orderDateTime}\n`;
      orderList += `──────────────\n`;
    });
    ctx.reply(orderList);
  } catch (err) {
    console.error('Error fetching orders:', err.message);
    ctx.reply('မှာယူမှုများကိုရယူရာတွင်အမှားအယွင်းဖြစ်ပွားခဲ့ပါသည်။');
  }
});

bot.command('status', (ctx) => ctx.scene.enter('statusScene'));

// Broadcast command - send message to all customers
bot.command('broadcast', async (ctx) => {
  if (String(ctx.from.id) !== OWNER_ID) {
    return ctx.reply(messages.ownerOnly);
  }
  ctx.session.broadcast = true;
  await ctx.reply('📢 Broadcast message ရိုက်ပါ (text သို့မဟုတ် ပုံ+caption ပို့ပါ):\n\nပယ်ဖျက်ရန် /cancel ပို့ပါ');
});

bot.command('cancel', async (ctx) => {
  if (ctx.session && ctx.session.broadcast) {
    ctx.session.broadcast = false;
    await ctx.reply('Broadcast ပယ်ဖျက်ပြီးပါပြီ။');
  }
});

// Handle broadcast photo
bot.on('photo', async (ctx) => {
  if (ctx.session && ctx.session.broadcast && String(ctx.from.id) === OWNER_ID) {
    ctx.session.broadcast = false;
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    const caption = ctx.message.caption || '';
    
    try {
      const stmt = db.prepare(`SELECT DISTINCT chatId FROM orders WHERE chatId IS NOT NULL AND chatId != ''`);
      const customers = stmt.all();
      
      if (customers.length === 0) {
        return ctx.reply('Customer မရှိသေးပါ။');
      }
      
      let sent = 0;
      let failed = 0;
      
      for (const customer of customers) {
        try {
          await bot.telegram.sendPhoto(customer.chatId, photo.file_id, { caption: caption });
          sent++;
        } catch (err) {
          failed++;
        }
      }
      
      await ctx.reply(`📢 Broadcast ပြီးပါပြီ!\n✅ ပို့ပြီး: ${sent}\n❌ မရောက်: ${failed}\n📊 စုစုပေါင်း: ${customers.length}`);
    } catch (err) {
      console.error('Broadcast error:', err.message);
      await ctx.reply('Broadcast လုပ်ရာတွင် error ဖြစ်ပါသည်။');
    }
    return;
  }
  
  // If in order scene, let scene handle it
});

bot.on('text', (ctx) => {
  // Handle broadcast text
  if (ctx.session && ctx.session.broadcast && String(ctx.from.id) === OWNER_ID) {
    ctx.session.broadcast = false;
    const message = ctx.message.text;
    
    (async () => {
      try {
        const stmt = db.prepare(`SELECT DISTINCT chatId FROM orders WHERE chatId IS NOT NULL AND chatId != ''`);
        const customers = stmt.all();
        
        if (customers.length === 0) {
          return ctx.reply('Customer မရှိသေးပါ။');
        }
        
        let sent = 0;
        let failed = 0;
        
        for (const customer of customers) {
          try {
            await bot.telegram.sendMessage(customer.chatId, message);
            sent++;
          } catch (err) {
            failed++;
          }
        }
        
        await ctx.reply(`📢 Broadcast ပြီးပါပြီ!\n✅ ပို့ပြီး: ${sent}\n❌ မရောက်: ${failed}\n📊 စုစုပေါင်း: ${customers.length}`);
      } catch (err) {
        console.error('Broadcast error:', err.message);
        await ctx.reply('Broadcast လုပ်ရာတွင် error ဖြစ်ပါသည်။');
      }
    })();
    return;
  }
  
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
