# URL Shortener Backend

Production-oriented URL shortener API built with Express, TypeScript, PostgreSQL, Redis, and BullMQ.

## Table of Contents

- Overview
- Features
- Tech Stack
- Project Structure
- System Design
- Prerequisites
- Environment Variables
- Local Development
- API Reference
- Database Schema
- Docker
- Troubleshooting
- Scripts

## Overview

This service lets users:

- Create short URLs from long URLs
- Optionally provide a custom alias
- Redirect short URLs to original URLs
- Track click events asynchronously via queue + worker
- Retrieve analytics per short code
- List and soft-delete URLs

The API stores URL metadata in PostgreSQL, uses Redis for cache and queue transport, and processes click logging through BullMQ workers.

## Features

- URL shortening with random code generation
- Custom alias validation and uniqueness checks
- Redirect with click metadata capture (IP, user agent, referrer)
- Redis cache for short-code lookup acceleration
- BullMQ queue-based click logging
- Analytics endpoint with total and recent clicks
- Soft delete support using is_active flag

## Tech Stack

- Runtime: Node.js
- Language: TypeScript
- API: Express
- Database: PostgreSQL
- Cache + Queue backend: Redis
- Job Queue: BullMQ
- Dev runner: ts-node-dev

## Project Structure

backend/
- src/app.ts: Express app and middleware setup
- src/index.ts: bootstrap, env loading, DB check, worker initialization
- src/routes/url.routes.ts: public API routes
- src/controllers/url.controller.ts: request validation + response handling
- src/services/url.service.ts: database/cache business logic
- src/config/db.ts: PostgreSQL pool configuration
- src/config/redis.ts: Redis client configuration
- src/queues/click.queue.ts: BullMQ queue producer
- src/workers/click.worker.ts: BullMQ worker consumer
- src/utils/: URL validation, alias validation, short-code generation

## System Design

1. Create flow
- Client calls POST /shorten
- Service validates URL and optional alias
- Service persists new record in urls table
- Response returns short URL payload

2. Redirect flow
- Client hits GET /:shortCode
- Service checks Redis cache first
- On cache miss, service loads active URL from PostgreSQL and caches it
- API enqueues click event to BullMQ
- Client is redirected to original URL

3. Analytics flow
- Client calls GET /analytics/:shortCode
- Service verifies short code exists
- Service returns total click count + last 5 click records

## Prerequisites

- Node.js 18+
- PostgreSQL instance
- Redis instance (Redis server or Memurai for Windows)

## Environment Variables

Create backend/.env with:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME
DATABASE_SSL=false
PORT=5000
JWT_SECRET=your_jwt_secret_key
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

Notes:

- Set DATABASE_SSL=true when using managed PostgreSQL providers that require TLS (for example Neon).
- For Docker-to-host Redis on Windows, REDIS_HOST is usually host.docker.internal.
- For Docker Compose Redis service, REDIS_HOST should be redis.

## Local Development

1. Install dependencies

```bash
cd backend
npm install
```

2. Configure environment

- Create/update backend/.env as shown above.

3. Start development server

```bash
npm run dev
```

4. Build and run production mode

```bash
npm run build
npm start
```

## API Reference

Base URL (local): http://localhost:5000

Health

- GET /
- Response: URL Shortener API is running

Create short URL

- POST /shorten
- Body:

```json
{
	"originalUrl": "https://example.com/some/long/path",
	"customAlias": "optional-alias"
}
```

- Success: 201 Created
- Possible errors: 400 invalid input, 409 alias in use

Redirect

- GET /:shortCode
- Success: 302 redirect to original URL
- Possible errors: 404 not found/inactive

Analytics by short code

- GET /analytics/:shortCode
- Success: 200 with totalClicks and recentClicks
- Possible errors: 404 short code not found

List URLs

- GET /urls
- Success: 200 list of URL records with click count

Soft delete URL

- DELETE /urls/:id
- Success: 200
- Possible errors: 400 invalid id, 404 not found/already inactive

## Database Schema

Expected tables:

```sql
CREATE TABLE urls (
	id SERIAL PRIMARY KEY,
	original_url TEXT NOT NULL,
	short_code VARCHAR(32) UNIQUE NOT NULL,
	is_active BOOLEAN NOT NULL DEFAULT TRUE,
	created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE clicks (
	id SERIAL PRIMARY KEY,
	url_id INTEGER NOT NULL REFERENCES urls(id) ON DELETE CASCADE,
	ip_address TEXT,
	user_agent TEXT,
	referrer TEXT,
	clicked_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

Recommended indexes:

```sql
CREATE INDEX idx_urls_short_code ON urls(short_code);
CREATE INDEX idx_clicks_url_id ON clicks(url_id);
CREATE INDEX idx_clicks_clicked_at ON clicks(clicked_at);
```

## Docker

Single container run (backend only):

```bash
docker build -t url-shortener-api ./backend
docker run --rm -p 5000:5000 --env-file backend/.env url-shortener-api
```

Compose setup exists at repository root and defines:

- api service
- worker service
- redis service

Important for compose env files:

- Use relative path format such as ./backend/.env.
- Avoid absolute style /backend/.env on Windows.

## Scripts

- npm run dev: start dev server with ts-node-dev
- npm run build: compile TypeScript to dist
- npm start: run compiled app from dist