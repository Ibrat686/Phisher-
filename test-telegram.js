require('dotenv').config();
const T = process.env.TELEGRAM_BOT_TOKEN, C = process.env.TELEGRAM_CHAT_ID;
(async () => {
  const me = await (await fetch(`https://api.telegram.org/bot${T}/getMe`)).json();
  console.log('getMe:', me.ok ? 'бот ок — @' + me.result.username : me);
  const r = await (await fetch(`https://api.telegram.org/bot${T}/sendMessage`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: C, text: 'Тест из терминала' })
  })).json();
  console.log('sendMessage:', r);
})();
