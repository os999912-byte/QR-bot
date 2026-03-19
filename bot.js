const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const path = require('path');

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL;
const PORT = process.env.PORT || 3000;

if (!BOT_TOKEN) { console.error('BOT_TOKEN не задан'); process.exit(1); }

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const app = express();
app.use(express.json({ limit: '5mb' }));

// Отдаём Mini App
app.use(express.static(path.join(__dirname, 'miniapp')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'miniapp', 'index.html')));

// ── /start ────────────────────────────────────────────────────
bot.onText(/\/start/, msg => {
  bot.sendMessage(msg.chat.id,
    '👋 Привет! Нажми кнопку ниже чтобы открыть генератор QR-кодов.',
    {
      reply_markup: {
        inline_keyboard: [[
          { text: '⚡ Открыть генератор', web_app: { url: WEBAPP_URL } }
        ]]
      }
    }
  );
});

// ── Получаем QR от Mini App и отправляем фото в чат ──────────
app.post('/send-qr', async (req, res) => {
  try {
    const { user_id, image_base64 } = req.body;
    if (!user_id || !image_base64) return res.status(400).json({ ok: false });

    // base64 → Buffer
    const base64 = image_base64.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');

    await bot.sendPhoto(user_id, buffer, {
      caption: '✅ Ваш QR-код готов! Удержите фото чтобы сохранить.',
      filename: 'qr.png'
    });

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
});

// Health check для Render
app.get('/health', (req, res) => res.send('OK'));

app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
