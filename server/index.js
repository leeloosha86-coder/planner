import 'dotenv/config';
import crypto from 'node:crypto';
import express from 'express';
import pg from 'pg';

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const MINI_APP_URL = process.env.MINI_APP_URL || '';
const PUBLIC_URL = (process.env.PUBLIC_URL || '').replace(/\/$/, '');
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || crypto.randomBytes(24).toString('hex');
const PORT = Number(process.env.PORT || 3000);
const DATABASE_URL = process.env.DATABASE_URL || '';

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
  max: 5,
});

const SCHEMA = `
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
    telegram_id TEXT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    time TEXT NOT NULL DEFAULT '',
    repeat_rule TEXT NOT NULL DEFAULT 'none',
    sphere TEXT NOT NULL,
    due_date TEXT NOT NULL,
    created_at TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    completed_dates TEXT NOT NULL DEFAULT '[]',
    important INTEGER NOT NULL DEFAULT 0,
    last_reminder TEXT NOT NULL DEFAULT ''
  );
  CREATE INDEX IF NOT EXISTS tasks_user_date ON tasks(telegram_id, due_date);
  CREATE TABLE IF NOT EXISTS habits (
    id TEXT PRIMARY KEY,
    telegram_id TEXT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sphere TEXT NOT NULL,
    history TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS habits_user ON habits(telegram_id);
  CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    telegram_id TEXT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    text TEXT NOT NULL DEFAULT '',
    sphere TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS notes_user_updated ON notes(telegram_id, updated_at DESC);
  CREATE TABLE IF NOT EXISTS shopping_items (
    telegram_id TEXT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
    id TEXT NOT NULL,
    title TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0,
    position INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (telegram_id, id)
  );
  CREATE TABLE IF NOT EXISTS spheres (
    telegram_id TEXT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
    id TEXT NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (telegram_id, id)
  );
`;

async function migrate() {
  await pool.query("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS important INTEGER NOT NULL DEFAULT 0");
}

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

const wrap = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const nowIso = () => new Date().toISOString();
const levelForXp = (xp) => xp >= 500 ? 5 : xp >= 300 ? 4 : xp >= 150 ? 3 : xp >= 50 ? 2 : 1;
const validRepeats = new Set(['none', 'daily', 'weekdays', 'weekly', 'quarterly', 'yearly']);

const DEFAULT_SPHERES = [
  { id: 'home', name: 'Дом', color: '#C06A45' },
  { id: 'work', name: 'Работа', color: '#5E6F52' },
  { id: 'health', name: 'Здоровье', color: '#6E8FA8' },
  { id: 'hobby', name: 'Хобби', color: '#A8829E' },
];
const MAX_SPHERES = 12;
const MAX_SPHERE_NAME = 20;

async function ensureUser(telegramId) {
  const created = await pool.query('INSERT INTO users (telegram_id, updated_at) VALUES ($1, $2) ON CONFLICT (telegram_id) DO NOTHING RETURNING telegram_id', [telegramId, nowIso()]);
  if (created.rowCount) {
    for (const [position, sphere] of DEFAULT_SPHERES.entries()) {
      await pool.query('INSERT INTO spheres (telegram_id, id, name, color, position) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING', [telegramId, sphere.id, sphere.name, sphere.color, position]);
    }
  }
}

async function userSpheres(telegramId) {
  const { rows } = await pool.query('SELECT id, name, color FROM spheres WHERE telegram_id = $1 ORDER BY position, name', [telegramId]);
  return rows;
}

function cleanSphereId(value) {
  return typeof value === 'string' ? value.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) : '';
}

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

async function authenticate(req, res, next) {
  try {
    const telegramId = verifyInitData(req.header('X-Telegram-Init-Data') || '');
    if (telegramId) {
      req.telegramId = telegramId;
      await ensureUser(telegramId);
      return next();
    }
    if (process.env.ALLOW_INSECURE_DEV === 'true' && req.header('X-Dev-User-Id')) {
      req.telegramId = String(req.header('X-Dev-User-Id')).slice(0, 80);
      await ensureUser(req.telegramId);
      return next();
    }
    return res.status(401).json({ error: 'Не удалось подтвердить данные Telegram' });
  } catch (error) {
    return next(error);
  }
}

async function getState(telegramId) {
  await ensureUser(telegramId);
  const { rows: [user] } = await pool.query('SELECT * FROM users WHERE telegram_id = $1', [telegramId]);
  const { rows: taskRows } = await pool.query('SELECT * FROM tasks WHERE telegram_id = $1 ORDER BY created_at', [telegramId]);
  const { rows: habitRows } = await pool.query('SELECT * FROM habits WHERE telegram_id = $1 ORDER BY created_at', [telegramId]);
  const { rows: noteRows } = await pool.query('SELECT * FROM notes WHERE telegram_id = $1 ORDER BY updated_at DESC', [telegramId]);
  const spheres = await userSpheres(telegramId);
  const { rows: shoppingRows } = await pool.query('SELECT * FROM shopping_items WHERE telegram_id = $1 ORDER BY position', [telegramId]);
  return {
    spheres,
    shopping: shoppingRows.map((row) => ({ id: row.id, title: row.title, done: Boolean(row.done) })),
    tasks: taskRows.map((row) => ({
      id: row.id,
      title: row.title,
      time: row.time,
      repeat: row.repeat_rule,
      sphere: row.sphere,
      date: row.due_date,
      createdAt: row.created_at,
      completed: Boolean(row.completed),
      completedDates: parseJsonArray(row.completed_dates),
      important: Boolean(row.important),
    })),
    habits: habitRows.map((row) => ({
      id: row.id, name: row.name, sphere: row.sphere, history: parseJsonArray(row.history), createdAt: row.created_at,
    })),
    notes: noteRows.map((row) => ({
      id: row.id, title: row.title, text: row.text, sphere: row.sphere, createdAt: row.created_at, updatedAt: row.updated_at,
    })),
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

function normalizeSphereList(value) {
  const seen = new Set();
  const list = [];
  for (const item of Array.isArray(value) ? value : []) {
    const id = cleanSphereId(item?.id);
    const name = cleanText(item?.name, MAX_SPHERE_NAME).replace(/\s+/g, ' ').trim();
    const color = /^#[0-9a-fA-F]{6}$/.test(item?.color) ? item.color : '#9DAE8F';
    if (!id || !name || seen.has(id)) continue;
    seen.add(id);
    list.push({ id, name, color });
    if (list.length >= MAX_SPHERES) break;
  }
  return list.length ? list : DEFAULT_SPHERES.map((sphere) => ({ ...sphere }));
}

async function saveState(telegramId, input) {
  const timestamp = nowIso();
  const xp = Math.max(0, Math.min(500, Math.floor(Number(input.xp) || 0)));
  const timezone = cleanText(input.timezone, 80) || 'Europe/Moscow';
  const spheres = normalizeSphereList(input.spheres);
  const knownIds = new Set(spheres.map((sphere) => sphere.id));
  const fallbackId = spheres[0].id;
  const pickSphere = (value) => (knownIds.has(value) ? value : fallbackId);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM spheres WHERE telegram_id = $1', [telegramId]);
    for (const [position, sphere] of spheres.entries()) {
      await client.query(
        'INSERT INTO spheres (telegram_id, id, name, color, position) VALUES ($1, $2, $3, $4, $5)',
        [telegramId, sphere.id, sphere.name, sphere.color, position],
      );
    }
    const { rows: oldReminders } = await client.query('SELECT id, last_reminder FROM tasks WHERE telegram_id = $1', [telegramId]);
    const reminders = new Map(oldReminders.map((row) => [row.id, row.last_reminder]));
    await client.query('DELETE FROM tasks WHERE telegram_id = $1', [telegramId]);
    await client.query('DELETE FROM habits WHERE telegram_id = $1', [telegramId]);
    await client.query('DELETE FROM notes WHERE telegram_id = $1', [telegramId]);
    await client.query('DELETE FROM shopping_items WHERE telegram_id = $1', [telegramId]);
    for (const task of input.tasks.slice(0, 2500)) {
      const title = cleanText(task.title, 120).trim();
      if (!title) continue;
      const id = cleanId(task.id);
      await client.query(
        `INSERT INTO tasks (id, telegram_id, title, time, repeat_rule, sphere, due_date, created_at, completed, completed_dates, important, last_reminder)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          id, telegramId, title, cleanTime(task.time),
          validRepeats.has(task.repeat) ? task.repeat : 'none',
          pickSphere(task.sphere), cleanDate(task.date),
          cleanText(task.createdAt, 40) || timestamp, task.completed ? 1 : 0,
          JSON.stringify(cleanDateList(task.completedDates)), task.important ? 1 : 0, reminders.get(id) || '',
        ],
      );
    }
    for (const habit of input.habits.slice(0, 500)) {
      const name = cleanText(habit.name, 100).trim();
      if (!name) continue;
      await client.query(
        'INSERT INTO habits (id, telegram_id, name, sphere, history, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [
          cleanId(habit.id), telegramId, name, pickSphere(habit.sphere),
          JSON.stringify(cleanDateList(habit.history)), cleanText(habit.createdAt, 40) || timestamp,
        ],
      );
    }
    for (const note of input.notes.slice(0, 2500)) {
      const title = cleanText(note.title, 120).trim() || 'Без названия';
      await client.query(
        'INSERT INTO notes (id, telegram_id, title, text, sphere, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [
          cleanId(note.id), telegramId, title, cleanText(note.text, 6000),
          pickSphere(note.sphere),
          cleanText(note.createdAt, 40) || timestamp, cleanText(note.updatedAt, 40) || timestamp,
        ],
      );
    }
    const seenItems = new Set();
    for (const [position, item] of (Array.isArray(input.shopping) ? input.shopping : []).slice(0, 300).entries()) {
      const title = cleanText(item?.title, 120).trim();
      const id = cleanId(item?.id);
      if (!title || seenItems.has(id)) continue;
      seenItems.add(id);
      await client.query(
        'INSERT INTO shopping_items (telegram_id, id, title, done, position) VALUES ($1, $2, $3, $4, $5)',
        [telegramId, id, title, item.done ? 1 : 0, position],
      );
    }
    await client.query(
      'UPDATE users SET xp = $1, level = $2, timezone = $3, updated_at = $4 WHERE telegram_id = $5',
      [xp, levelForXp(xp), timezone, timestamp, telegramId],
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

app.get('/api/health', (_req, res) => res.json({ ok: true, time: nowIso() }));
app.get('/', (_req, res) => res.type('text/plain').send('Мой планировщик: сервер работает'));
app.get('/api/state', authenticate, wrap(async (req, res) => {
  res.json({ data: await getState(req.telegramId) });
}));

app.put('/api/state', authenticate, wrap(async (req, res) => {
  const input = req.body?.data;
  if (!input || !Array.isArray(input.tasks) || !Array.isArray(input.habits) || !Array.isArray(input.notes)) {
    return res.status(400).json({ error: 'Некорректная структура данных' });
  }
  try {
    await saveState(req.telegramId, input);
    return res.json({ ok: true, data: await getState(req.telegramId) });
  } catch (error) {
    console.error('Ошибка сохранения:', error);
    return res.status(500).json({ error: 'Не удалось сохранить данные' });
  }
}));

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

app.post(`/api/telegram/webhook/${WEBHOOK_SECRET}`, wrap(async (req, res) => {
  res.sendStatus(200);
  const message = req.body?.message;
  if (!message?.from?.id || message.chat?.type !== 'private') return;
  const telegramId = String(message.from.id);
  if (!/^\/start(?:@\w+)?(?:\s|$)/.test(message.text || '')) return;
  await ensureUser(telegramId);
  await pool.query('UPDATE users SET bot_started = 1, bot_blocked = 0 WHERE telegram_id = $1', [telegramId]);
  try {
    await sendTelegram('sendMessage', {
      chat_id: message.chat.id,
      text: 'Рад видеть вас в «Моём планировщике»! Напоминания включены. Добавьте задачу и укажите время — я напишу в нужный момент.',
      ...(MINI_APP_URL ? { reply_markup: { inline_keyboard: [[{ text: 'Открыть планировщик', web_app: { url: MINI_APP_URL } }]] } } : {}),
    });
  } catch (error) {
    console.error('Не удалось ответить на /start:', error.message);
  }
}));

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

function sphereLabel(rows, id) {
  return rows.find((row) => row.id === id)?.name || '';
}

function occursOn(task, key) {
  if (task.repeat_rule === 'none') return task.due_date === key;
  if (key < task.due_date) return false;
  if (task.repeat_rule === 'daily') return true;
  const date = new Date(`${key}T12:00:00Z`);
  const index = (date.getUTCDay() + 6) % 7;
  if (task.repeat_rule === 'weekdays') return index < 5;
  const created = new Date(`${task.due_date}T12:00:00Z`);
  if (task.repeat_rule === 'weekly') return index === (created.getUTCDay() + 6) % 7;
  if (task.repeat_rule === 'quarterly') {
    if (date.getUTCDate() !== created.getUTCDate()) return false;
    const months = (date.getUTCFullYear() - created.getUTCFullYear()) * 12 + (date.getUTCMonth() - created.getUTCMonth());
    return months % 3 === 0;
  }
  return date.getUTCDate() === created.getUTCDate() && date.getUTCMonth() === created.getUTCMonth();
}

let reminderRunning = false;
async function runReminders() {
  if (!BOT_TOKEN || reminderRunning) return;
  reminderRunning = true;
  try {
    const { rows: users } = await pool.query('SELECT * FROM users WHERE bot_started = 1 AND bot_blocked = 0');
    for (const user of users) {
      const current = localParts(new Date(), user.timezone);
      const sphereRows = await userSpheres(user.telegram_id);
      const { rows: tasks } = await pool.query(
        `SELECT * FROM tasks WHERE telegram_id = $1 AND time = $2 AND (last_reminder != $3 OR last_reminder = '')`,
        [user.telegram_id, current.time, `${current.date} ${current.time}`],
      );
      for (const task of tasks) {
        if (!occursOn(task, current.date)) continue;
        const done = task.repeat_rule === 'none' ? Boolean(task.completed) : parseJsonArray(task.completed_dates).includes(current.date);
        if (done) continue;
        try {
          await sendTelegram('sendMessage', {
            chat_id: Number(user.telegram_id),
            text: `Напоминание · ${task.time}\n\n${task.title}\n${sphereLabel(sphereRows, task.sphere)}`,
            ...(MINI_APP_URL ? { reply_markup: { inline_keyboard: [[{ text: 'Открыть на сегодня', web_app: { url: MINI_APP_URL } }]] } } : {}),
          });
          await pool.query('UPDATE tasks SET last_reminder = $1 WHERE id = $2', [`${current.date} ${current.time}`, task.id]);
        } catch (error) {
          if (error.status === 403) {
            await pool.query('UPDATE users SET bot_blocked = 1 WHERE telegram_id = $1', [user.telegram_id]);
            break;
          }
          console.error('Напоминание не отправлено:', error.message);
        }
      }
    }
  } catch (error) {
    console.error('Ошибка проверки напоминаний:', error.message);
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

app.use((error, _req, res, _next) => {
  console.error('Ошибка сервера:', error.message);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

async function start() {
  await pool.query(SCHEMA);
  await migrate();
  app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    configureBot();
    setTimeout(runReminders, 5000);
    setInterval(runReminders, 60000);
  });
}

start().catch((error) => {
  console.error('Не удалось подключиться к базе данных:', error.message);
  process.exit(1);
});

async function shutdown() {
  await pool.end();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
