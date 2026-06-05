# ТурМенеджер — Платформа для промышленного туризма

Специализированная платформа — инструмент для организации промышленного туризма, предназначена для туроператоров и турагентов, позволяя автоматизировать организацию экскурсий на промышленные предприятия.

Проект ориентирован на повышение эффективности организации экскурсий на промышленные предприятия, автоматизацию ключевых бизнес-процессов, а также анализ экономики туров.

## Стек технологий

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Express.js
- **База данных**: SQLite
- **Docker**: Multi-stage build + docker-compose

## Быстрый старт

### Docker (рекомендуется)

```bash
# Сборка и запуск
docker compose build
docker compose up -d

# Просмотр логов
docker compose logs -f

# Остановка
docker compose down
```

### Локальная разработка

```bash
# Инициализация базы данных
cd server
npm install
node src/db/init-db.js
node src/db/seed.js

# Запуск сервера (в отдельном терминале)
npm run dev

# Запуск клиента (в отдельном терминале)
cd ../client && npm install && npm run dev
```

## Структура проекта

```
industrial-tourism-platform/
├── client/                 # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/      # Переиспользуемые компоненты
│   │   ├── pages/          # Страницы приложения
│   │   ├── api/            # API клиент
│   │   └── contexts/       # React контексты
│   └── ...
├── server/                  # Express API
│   ├── src/
│   │   ├── routes/         # API маршруты
│   │   ├── services/       # Бизнес-логика
│   │   ├── db/             # SQLite клиент и схема
│   │   ├── middleware/      # Промежуточное ПО
│   │   └── validators/     # Валидация
│   └── ...
├── data/                    # SQLite база данных
├── storage/                 # Файлы загрузок
└── docker-compose.yml
```

## Роли пользователей

| Роль | Описание | Возможности |
|------|----------|-------------|
| **tourist** | Турист | Просмотр каталога, подача заявок, личный кабинет |
| **operator** | Туроператор | Управление предприятиями, экскурсиями, заявками, аналитика |
| **admin** | Администратор | Полный доступ к системе |

## Тестовые аккаунты

| Роль | Email | Пароль |
|------|-------|--------|
| Админ | admin@industrial-tourism.ru | admin123 |
| Оператор | operator@promtour.ru | operator123 |
| Турист | ivanova@mail.ru | tourist123 |

## API Endpoints

### Аутентификация
- `POST /api/auth/register` — Регистрация
- `POST /api/auth/login` — Вход
- `GET /api/auth/me` — Текущий пользователь

### Предприятия
- `GET /api/enterprises` — Список предприятий
- `GET /api/enterprises/:id` — Детали предприятия
- `POST /api/enterprises` — Создание (оператор)
- `PUT /api/enterprises/:id` — Обновление (оператор)

### Экскурсии
- `GET /api/excursions` — Каталог экскурсий
- `GET /api/excursions/:id` — Детали экскурсии
- `POST /api/excursions` — Создание (оператор)
- `PUT /api/excursions/:id` — Обновление (оператор)

### Заявки
- `POST /api/requests` — Создание заявки
- `GET /api/requests` — Список заявок
- `GET /api/requests/:id` — Детали заявки
- `PATCH /api/requests/:id/status` — Обновление статуса
- `POST /api/requests/:id/alternatives` — AI-альтернативы при недоборе

### Документы
- `POST /api/documents/generate` — Генерация документа
- `GET /api/documents/:id` — Скачать документ
- `GET /api/documents/request/:requestId` — Документы заявки

### Расчёты
- `POST /api/calculations/run` — Расчёт рентабельности
- `GET /api/calculations/:id` — Результат расчёта

### Аналитика
- `GET /api/analytics/summary` — Общая статистика
- `GET /api/analytics/popular` — Популярные экскурсии
- `GET /api/analytics/revenue` — Доходы по периодам
- `GET /api/analytics/seasonality` — Сезонность

## Переменные окружения

Скопируйте `server/.env.example` в `server/.env`:

```bash
cp server/.env.example server/.env
```

| Переменная | Описание | Пример |
|-----------|----------|--------|
| `PORT` | Порт сервера | `3001` |
| `JWT_SECRET` | Секрет для JWT | `your-secret-key` |
| `ADMIN_LOGIN` | Логин админа | `admin@industrial-tourism.ru` |
| `ADMIN_PASSWORD` | Пароль админа | `admin123` |
| `DB_PATH` | Путь к базе данных | `./data/base.db` |

## Ключевые функции

1. **Каталог предприятий и экскурсий** — поиск, фильтрация, информация о требованиях
2. **Управление заявками** — создание, отслеживание статусов, история
3. **AI-альтернативы при недоборе группы** — рекомендации при group_min > people_count
4. **Генерация документов** — договор, счёт, акт по шаблонам
5. **Расчёт рентабельности** — калькулятор для анализа экономики тура
6. **Аналитика** — статистика по экскурсиям, сезонам, возрастным группам

## Лицензия

MIT