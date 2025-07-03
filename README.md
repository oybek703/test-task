# Permissions Microservice

Микросервис управления правами на Node.js + TypeScript с использованием NATS.io и PostgreSQL.

## Функциональность

- **grant** — назначить право (модуль, действие) API-ключу
- **revoke** — отозвать право у API-ключа
- **check** — проверить, есть ли право у ключа
- **list** — получить все права по ключу

## Технологии

- Node.js + TypeScript
- PostgreSQL (raw SQL)
- NATS.io (request/reply + Key-Value)
- Winston (логирование)

## Установка и запуск

### 1. Клонирование и установка зависимостей

```bash
git clone <repository-url>
cd permissions-microservice
npm install