# API Scalability Backend

HNG Stage 8 backend for an append-only event store.

## Overview

This service stores events in `events.log`, replays the log on startup, and serves reads from an in-memory index for fast lookups.

## Features

- Append-only writes to `events.log`
- Startup recovery from the log file
- Direct byte-seek reads by event ID
- Swagger docs at `/api-docs`
- Health endpoint at `/api/v1/health`

## Requirements

- Node.js 18+
- npm
- `.env` with:

```env
PORT=4000
NODE_ENV=development
```

## Scripts

```bash
npm run dev
npm run build
npm start
npm run lint
npm run format
```

## Run Locally

```bash
npm install
npm run dev
```

After build:

```bash
npm run build
npm start
```

## API

Base URL: `http://localhost:4000`

### Swagger

- `GET /api-docs`

### Events

- `POST /events`
- `GET /events/:id`
- `GET /events`
- `GET /stats`

### Health

- `GET /api/v1/health`

## Example Requests

### Create an event

```bash
curl -X POST http://localhost:4000/events \
  -H "Content-Type: application/json" \
  -d '{
    "payload": {
      "type": "payment.completed",
      "paymentId": "pay_01HZZ8J8Q5Q9M4K1K5G7T8B2C1",
      "amount": 2500,
      "currency": "USD",
      "status": "success"
    }
  }'
```

Example response:

```json
{
  "status": "success",
  "event": {
    "id": "8e6b0b7d-6a5a-4f9f-9c1d-1a0f2d8bf3a0",
    "createdAt": "2026-05-31T12:00:00.000Z",
    "payload": {
      "type": "payment.completed",
      "paymentId": "pay_01HZZ8J8Q5Q9M4K1K5G7T8B2C1",
      "amount": 2500,
      "currency": "USD",
      "status": "success"
    }
  }
}
```

### Fetch one event

```bash
curl http://localhost:4000/events/8e6b0b7d-6a5a-4f9f-9c1d-1a0f2d8bf3a0
```

Example response:

```json
{
  "status": "success",
  "event": {
    "payload": {
      "type": "payment.completed",
      "paymentId": "pay_01HZZ8J8Q5Q9M4K1K5G7T8B2C1",
      "amount": 2500,
      "currency": "USD",
      "status": "success"
    },
    "id": "8e6b0b7d-6a5a-4f9f-9c1d-1a0f2d8bf3a0",
    "createdAt": "2026-05-31T12:00:00.000Z"
  }
}
```

## Storage Notes

- `events.log` is the source of truth.
- Each line is a single JSON event.
- On startup, the log is replayed to rebuild the in-memory index.
- Do not edit `events.log` by hand.

## Demo Flow

1. Start the server.
2. Create a payment event.
3. Copy the returned `id`.
4. Fetch the event by ID.
5. Stop and restart the server.
6. Fetch the same ID again to confirm recovery.
