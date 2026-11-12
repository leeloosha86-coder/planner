import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import Database from 'better-sqlite3';

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const MINI_APP_URL = process.env.MINI_APP_URL || '';
const PUBLIC_URL = (process.env.PUBLIC_URL || '').replace(/\/$/, '');
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || crypto.randomBytes(24).toString('hex');
const PORT = Number(process.env.PORT || 3000);
const databasePath = process.env.DATABASE_PATH || './planner.sqlite';
if (databasePath !== ':memory:') fs.mkdirSync(path.dirname(path.resolve(databasePath)), { recursive: true });

const db = new Database(databasePath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    telegram_id TEXT PRIMARY KEY,
    xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    bot_started INTEGER NOT NULL DEFAULT 0,
    bot_blocked INTEGER NOT NULL DEFAULT 0,
    timezone TEXT NOT NULL DEFAULT 'Europe/Moscow',
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    telegram_id TEXT NOT NULL,
    title TEXT NOT NULL,
    time TEXT NOT NULL DEFAULT '',
    repeat_rule TEXT NOT NULL DEFAULT 'none',
    sphere TEXT NOT NULL,
    due_date TEXT NOT NULL,
    created_at TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    completed_dates TEXT NOT NULL DEFAULT '[]',
    last_reminder TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (telegram_id) REFERENCES users(telegram_id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS tasks_user_date ON tasks(telegram_id, due_date);
  CREATE TABLE IF NOT EXISTS habits (
    id TEXT PRIMARY KEY,
    telegram_id TEXT NOT NULL,
    name TEXT NOT NULL,
    sphere TEXT NOT NULL,
    history TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL,
    FOREIGN KEY (telegram_id) REFERENCES users(telegram_id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS habits_user ON habits(telegram_id);
  CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    telegram_id TEXT NOT NULL,
    title TEXT NOT NULL,
    text TEXT NOT NULL DEFAULT '',
    sphere TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (telegram_id) REFERENCES users(telegram_id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS notes_user_updated ON notes(telegram_id, updated_at DESC);
`);

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.WEB_APP_ORIGIN || '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, X-Telegram-Init-Data, X-Dev-User-Id');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
  res.header('Vary', 'Origin');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const nowIso = () => new Date().toISOString();
const ensureUser = db.prepare(`INSERT OR IGNORE INTO users (telegram_id, updated_at) VALUES (?, ?)`);
const levelForXp = (xp) => xp >= 500 ? 5 : xp >= 300 ? 4 : xp >= 150 ? 3 : xp >= 50 ? 2 : 1;
const validSpheres = new Set(['work', 'home', 'craft', 'study']);
const validRepeats = new Set(['none', 'daily', 'weekdays', 'weekly']);
const sphereNames = { work: 'Работа', home: 'Дом и семья', craft: 'Рукоделие и блог', study: 'Учёба' };

function parseJsonArray(value) {
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
}

function verifyInitData(initData) {
  if (!BOT_TOKEN || !initData) return null;
  const params = new URLSearchParams(initData);
  const receivedHash = params.get('hash');
  const authDate = Number(params.get('auth_date'));
  if (!receivedHash || !authDate) return null;
  if (Math.abs(Date.now() / 1000 - authDate) > 86400) return null;
  params.delete('hash');
  const checkString = [...params.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join('\n');
  const secret = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const expectedHash = crypto.createHmac('sha256', secret).update(checkString).digest('hex');
  const expected = Buffer.from(expectedHash, 'hex');
  const received = Buffer.from(receivedHash, 'hex');
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) return null;
  try {
    const user = JSON.parse(params.get('user') || '{}');
    return user.id ? String(user.id) : null;
  } catch { return null; }
}

function authenticate(req, res, next) {
  const telegramId = verifyInitData(req.header('X-Telegram-Init-Data') || '');
  if (telegramId) {
    req.telegramId = telegramId;
    ensureUser.run(telegramId, nowIso());
    return next();
  }
  if (process.env.ALLOW_INSECURE_DEV === 'true' && req.header('X-Dev-User-Id')) {
    req.telegramId = String(req.header('X-Dev-User-Id')).slice(0, 80);
    ensureUser.run(req.telegramId, nowIso());
    return next();
  }
  return res.status(401).json({ error: 'Не удалось подтвердить данные Telegram' });
}

function getState(telegramId) {
  ensureUser.run(telegramId, nowIso());
  const user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(telegramId);
  const tasks = db.prepare('SELECT * FROM tasks WHERE telegram_id = ? ORDER BY created_at').all(telegramId).map((row) => ({
    id: row.id,
    title: row.title,
    time: row.time,
    repeat: row.repeat_rule,
    sphere: row.sphere,
    date: row.due_date,
    createdAt: row.created_at,
    completed: Boolean(row.completed),
    completedDates: parseJsonArray(row.completed_dates),
  }));
  const habits = db.prepare('SELECT * FROM habits WHERE telegram_id = ? ORDER BY created_at').all(telegramId).map((row) => ({
    id: row.id, name: row.name, sphere: row.sphere, history: parseJsonArray(row.history), createdAt: row.created_at,
  }));
  const notes = db.prepare('SELECT * FROM notes WHERE telegram_id = ? ORDER BY updated_at DESC').all(telegramId).map((row) => ({
    id: row.id, title: row.title, text: row.text, sphere: row.sphere, createdAt: row.created_at, updatedAt: row.updated_at,
  }));
  return {
    tasks, habits, notes,
    xp: Math.max(0, Math.min(500, user.xp)),
    botStarted: Boolean(user.bot_started && !user.bot_blocked),
    updatedAt: user.updated_at,
    timezone: user.timezone || 'Europe/Moscow',
  };
}

function cleanText(value, maxLength) {
  return typeof value === 'string' ? value.slice(0, maxLength) : '';
}
function cleanId(value) {
  return cleanText(value, 100).replace(/[^a-zA-Z0-9_-]/g, '') || crypto.randomUUID();
}
function cleanDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || '') ? value : new Date().toISOString().slice(0, 10);
}
function cleanTime(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value || '') ? value : '';
}
function cleanDateList(value) {
  return Array.isArray(value) ? [...new Set(value.filter((item) => /^\d{4}-\d{2}-\d{2}$/.test(item)))].slice(-1500) : [];
}

app.get('/api/health', (_req, res) => res.json({ ok: true, time: nowIso() }));
app.get('/', (_req, res) => res.type('text/plain').send('Мой планировщик: сервер работает'));
app.get('/api/state', authenticate, (req, res) => res.json({ data: getState(req.telegramId) }));

const replaceTasks = db.prepare('DELETE FROM tasks WHERE telegram_id = ?');
const replaceHabits = db.prepare('DELETE FROM habits WHERE telegram_id = ?');
const replaceNotes = db.prepare('DELETE FROM notes WHERE telegram_id = ?');
const insertTask = db.prepare(`INSERT INTO tasks
  (id, telegram_id, title, time, repeat_rule, sphere, due_date, created_at, completed, completed_dates, last_reminder)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
const insertHabit = db.prepare('INSERT INTO habits (id, telegram_id, name, sphere, history, created_at) VALUES (?, ?, ?, ?, ?, ?)');
const insertNote = db.prepare('INSERT INTO notes (id, telegram_id, title, text, sphere, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)');

const saveState = db.transaction((telegramId, input) => {
  const timestamp = nowIso();
  const xp = Math.max(0, Math.min(500, Math.floor(Number(input.xp) || 0)));
  const timezone = cleanText(input.timezone, 80) || 'Europe/Moscow';
  const reminders = new Map(db.prepare('SELECT id, last_reminder FROM tasks WHERE telegram_id = ?').all(telegramId).map((row) => [row.id, row.last_reminder]));
  replaceTasks.run(telegramId);
  replaceHabits.run(telegramId);
  replaceNotes.run(telegramId);
  for (const task of input.tasks.slice(0, 2500)) {
    const title = cleanText(task.title, 120).trim();
    if (!title) continue;
    const id = cleanId(task.id);
    insertTask.run(
      id, telegramId, title, cleanTime(task.time),
      validRepeats.has(task.repeat) ? task.repeat : 'none',
      validSpheres.has(task.sphere) ? task.sphere : 'home', cleanDate(task.date),
      cleanText(task.createdAt, 40) || timestamp, task.completed ? 1 : 0, JSON.stringify(cleanDateList(task.completedDates)), reminders.get(id) || '',
    );
  }
  for (const habit of input.habits.slice(0, 500)) {
    const name = cleanText(habit.name, 100).trim();
    if (!name) continue;
    insertHabit.run(cleanId(habit.id), telegramId, name, validSpheres.has(habit.sphere) ? habit.sphere : 'home', JSON.stringify(cleanDateList(habit.history)), cleanText(habit.createdAt, 40) || timestamp);
  }
  for (const note of input.notes.slice(0, 2500)) {
    const title = cleanText(note.title, 120).trim() || 'Без названия';
    insertNote.run(cleanId(note.id), telegramId, title, cleanText(note.text, 6000), validSpheres.has(note.sphere) ? note.sphere : 'home', cleanText(note.createdAt, 40) || timestamp, cleanText(note.updatedAt, 40) || timestamp);
  }
  db.prepare('UPDATE users SET xp = ?, level = ?, timezone = ?, updated_at = ? WHERE telegram_id = ?').run(xp, levelForXp(xp), timezone, timestamp, telegramId);
});

app.put('/api/state', authenticate, (req, res) => {
  const input = req.body?.data;
  if (!input || !Array.isArray(input.tasks) || !Array.isArray(input.habits) || !Array.isArray(input.notes)) {
    return res.status(400).json({ error: 'Некорректная структура данных' });
  }
  try {
    saveState(req.telegramId, input);
    return res.json({ ok: true, data: getState(req.telegramId) });
  } catch (error) {
    console.error('Ошибка сохранения:', error);
    return res.status(500).json({ error: 'Не удалось сохранить данные' });
  }
});

async function sendTelegram(method, payload) {
  if (!BOT_TOKEN) throw new Error('BOT_TOKEN не задан');
  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) {
    const error = new Error(result.description || `Telegram: ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return result.result;
}

app.post(`/api/telegram/webhook/${WEBHOOK_SECRET}`, async (req, res) => {
  res.sendStatus(200);
  const message = req.body?.message;
  if (!message?.from?.id || message.chat?.type !== 'private') return;
  const telegramId = String(message.from.id);
  if (!/^\/start(?:@\w+)?(?:\s|$)/.test(message.text || '')) return;
  ensureUser.run(telegramId, nowIso());
  db.prepare('UPDATE users SET bot_started = 1, bot_blocked = 0 WHERE telegram_id = ?').run(telegramId);
  try {
    await sendTelegram('sendMessage', {
      chat_id: message.chat.id,
      text: 'Рад видеть вас в «Моём планировщике»! Напоминания включены. Добавьте задачу и укажите время — я напишу в нужный момент.',
      ...(MINI_APP_URL ? { reply_markup: { inline_keyboard: [[{ text: 'Открыть планировщик', web_app: { url: MINI_APP_URL } }]] } } : {}),
    });
  } catch (error) {
    console.error('Не удалось ответить на /start:', error.message);
  }
});

function localParts(date, timezone) {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone || 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(date);
    const get = (type) => parts.find((part) => part.type === type)?.value || '';
    return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${get('hour')}:${get('minute')}` };
  } catch {
    return localParts(date, 'Europe/Moscow');
  }
}

function occursOn(task, key, timezone) {
  if (task.repeat_rule === 'none') return task.due_date === key;
  if (key < task.due_date) return false;
  if (task.repeat_rule === 'daily') return true;
  const date = new Date(`${key}T12:00:00Z`);
  const index = (date.getUTCDay() + 6) % 7;
  if (task.repeat_rule === 'weekdays') return index < 5;
  const created = new Date(`${task.due_date}T12:00:00Z`);
  return index === (created.getUTCDay() + 6) % 7;
}

let reminderRunning = false;
async function runReminders() {
  if (!BOT_TOKEN || reminderRunning) return;
  reminderRunning = true;
  try {
    const users = db.prepare('SELECT * FROM users WHERE bot_started = 1 AND bot_blocked = 0').all();
    for (const user of users) {
      const current = localParts(new Date(), user.timezone);
      const tasks = db.prepare(`SELECT * FROM tasks WHERE telegram_id = ? AND time = ? AND (last_reminder != ? OR last_reminder = '')`).all(user.telegram_id, current.time, `${current.date} ${current.time}`);
      for (const task of tasks) {
        if (!occursOn(task, current.date, user.timezone)) continue;
        const done = task.repeat_rule === 'none' ? Boolean(task.completed) : parseJsonArray(task.completed_dates).includes(current.date);
        if (done) continue;
        try {
          await sendTelegram('sendMessage', {
            chat_id: Number(user.telegram_id),
            text: `Напоминание · ${task.time}\n\n${task.title}\n${sphereNames[task.sphere] || ''}`,
            ...(MINI_APP_URL ? { reply_markup: { inline_keyboard: [[{ text: 'Открыть на сегодня', web_app: { url: MINI_APP_URL } }]] } } : {}),
          });
          db.prepare('UPDATE tasks SET last_reminder = ? WHERE id = ?').run(`${current.date} ${current.time}`, task.id);
        } catch (error) {
          if (error.status === 403) {
            db.prepare('UPDATE users SET bot_blocked = 1 WHERE telegram_id = ?').run(user.telegram_id);
            break;
          }
          console.error('Напоминание не отправлено:', error.message);
        }
      }
    }
  } finally {
    reminderRunning = false;
  }
}

async function configureBot() {
  if (!BOT_TOKEN) return;
  try {
    if (MINI_APP_URL) {
      await sendTelegram('setChatMenuButton', { menu_button: { type: 'web_app', text: 'Планировщик', web_app: { url: MINI_APP_URL } } });
    }
    if (PUBLIC_URL) {
      await sendTelegram('setWebhook', { url: `${PUBLIC_URL}/api/telegram/webhook/${WEBHOOK_SECRET}`, allowed_updates: ['message'], drop_pending_updates: false });
    }
    await sendTelegram('setMyCommands', { commands: [{ command: 'start', description: 'Открыть планировщик и включить напоминания' }] });
    console.log('Telegram-бот настроен');
  } catch (error) {
    console.error('Настройка Telegram-бота:', error.message);
  }
}

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  configureBot();
  setTimeout(runReminders, 5000);
  setInterval(runReminders, 60000);
});

function shutdown() {
  db.close();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
