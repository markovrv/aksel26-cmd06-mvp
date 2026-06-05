# Multi-stage build для React + Express приложения
FROM node:20-alpine AS builder

WORKDIR /app

# Установка зависимостей клиента
COPY client/package.json ./client/
RUN cd client && npm i

# Копирование исходников клиента и сборка
COPY client/. ./client/
RUN cd client && npm run build

# Финальный образ
FROM node:20-alpine

WORKDIR /app

# Установка зависимостей сервера
COPY server/package.json ./server/
RUN cd server && npm i --only=production

# Копирование клиента (результат сборки)
COPY --from=builder /app/client/dist ./server/client/dist

# Копирование сервера
COPY server/src ./server/src

# Создание директорий
RUN mkdir -p /app/data /app/storage

# Entrypoint скрипт
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/app/entrypoint.sh"]
