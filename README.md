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

### List event IDs

```bash
curl http://localhost:4000/events
```

Example response:

```json
{
  "status": "success",
  "total": 2,
  "ids": [
    "8e6b0b7d-6a5a-4f9f-9c1d-1a0f2d8bf3a0",
    "4a2a9c2f-1f5f-4d6f-9d16-5e8f1b6a24b7"
  ]
}
```

### Stats

```bash
curl http://localhost:4000/stats
```

Example response:

```json
{
  "status": "success",
  "total": 12,
  "bytes": 1840
}
```

## Architecture diagram

```mermaid
flowchart LR
  A[POST /events] --> B[Validation]
  B --> C[Build event {id, createdAt}]
  C --> D[Append JSON line to events.log]
  D --> E[Update in-memory index Map(id -> {offset,length})]
  E --> F[Return created event]

  subgraph Read
    G[GET /events/:id] --> H[index.get(id)]
    H --> I[fs.readSync(offset, length)]
    I --> J[JSON.parse -> response]
  end
```

## Screenshots

- Recovery log after restart: [add recovery screenshot here]

## Demo video

- 30s demo (upload link): [add demo video link here]

## What I struggled with

- Appending to the log file without rewriting it.

## What I learned

- How to implement an append-only event log with byte offsets for fast reads.
- How to safely parse and recover a log file with streaming and buffered newline handling.

## Resources consulted

- Node.js `fs` docs — for `appendFileSync`, `openSync`, and `readSync`.
- AI assistance (ChatGPT) — consulted on safe file-writing patterns (append-only), recovery/replay logic, and using byte-offset reads (`fs.appendFileSync` + `fs.readSync`).


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
