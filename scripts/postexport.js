const fs = require('node:fs');
const path = require('node:path');

const file = path.join(__dirname, '..', 'dist', 'index.html');
if (!fs.existsSync(file)) throw new Error('Сначала выполните экспорт Expo');
let html = fs.readFileSync(file, 'utf8');
html = html
  .replace('<html lang="en">', '<html lang="ru">')
  .replace('width=device-width, initial-scale=1, shrink-to-fit=no', 'width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover')
  .replace('overflow: hidden;', 'overflow: hidden; margin: 0; background: #F6EFE0;')
  .replace('You need to enable JavaScript to run this app.', 'Для работы планировщика разрешите JavaScript в настройках браузера.')
  .replace('</head>', '  <meta name="theme-color" content="#F6EFE0" />\n  <meta name="description" content="Уютный планировщик задач, привычек и заметок в Telegram" />\n  <script src="https://telegram.org/js/telegram-web-app.js"></script>\n  </head>');
fs.writeFileSync(file, html);
console.log('Web-экспорт подготовлен для Telegram');
