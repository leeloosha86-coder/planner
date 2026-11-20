# Планировщик Рыжий Эльф

Telegram Mini App на React + TypeScript и Expo. Четыре раздела: «Сегодня», «Расписание», «Привычки» и «Заметки».

## Интерфейс

```sh
npm install
npx expo start
```

Данные сразу сохраняются в AsyncStorage. Без настроенного сервера приложение работает локально и показывает несколько начальных демонстрационных записей, которые можно изменять и удалять.

Для синхронизации между телефонами задайте перед сборкой:

```sh
EXPO_PUBLIC_API_URL=https://адрес-сервера
EXPO_PUBLIC_BOT_USERNAME=имя_бота
```

Сервер Express + SQLite находится в `server/`; настройка бота, webhook и напоминаний описана в `server/README.md`.

## Проверки и экспорт

```sh
npx tsc --noEmit
npx expo lint
npm run export:all
```

Команда экспорта собирает Android, iOS и web, после чего добавляет в web-страницу Telegram Web App SDK, русские метаданные и параметр `viewport-fit=cover`.

## Telegram

- `themeParams`, цвет заголовка и фона, safe area;
- MainButton для добавления и сохранения;
- BackButton для форм и редактора;
- HapticFeedback для отметок и нового уровня;
- проверка подписи initData на сервере без сохранения имени и телефона.
