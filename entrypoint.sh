#!/bin/sh

set -e

echo "=== Инициализация базы данных ==="

# Инициализация БД если не существует
if [ ! -f /app/data/base.db ]; then
	echo "Создание базы данных..."
	cd /app/server && npm run init-db
else
	echo "База данных уже существует"
	cd /app/server && npm run init-db
fi

echo "=== Заполнение демо-данными ==="
cd /app/server && npm run seed

# Запуск сервера
echo "=== Запуск приложения ==="
cd /app/server && node src/index.js
