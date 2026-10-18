require('dotenv').config();
const fs = require('fs');
fs.writeFileSync('public/config.js',
  'window.IG_CONFIG=' + JSON.stringify({
    TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    CHAT: process.env.TELEGRAM_CHAT_ID
  }) + ';');
console.log('config.js создан');
