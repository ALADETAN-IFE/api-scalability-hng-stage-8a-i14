# Append-Only Event Store

> HNG Internship i14 — Backend Stage 8a  
> Built by [IfeCodes](https://ifecodes.xyz)

A minimal, crash-safe event store where **`events.log` is the database** — no SQLite, no JSON rewrites, no ORM. One JSON object per line, append-only, forever.

---

## What it does

| Concern | Solution |
|---|---|
| Persistence | Append-only `events.log` — one JSON line per event |
| Fast reads | In-memory `Map<id, {offset, length}>` — direct byte-seek, zero scanning |
| Crash recovery | Log replay on startup rebuilds the index; logs recovered count |
| Writes | `fs.appendFileSync` — atomic enough for single-process use |

---

## Architecture

```
POST /events
  │
  ├─ Validate body (must have `type`)
  ├─ Generate ID + timestamp
  ├─ Serialize to JSON line
  ├─ fs.appendFileSync → events.log          (disk, append-only)
  └─ index.set(id, { offset, length })       (in-memory)

GET /events/:id
  │
  ├─ index.get(id) → { offset, length }
  ├─ fs.openSync + fs.readSync(buf, offset)  (direct byte seek)
  └─ JSON.parse(buf) → response

Startup
  │
  ├─ readline streams events.log line by line
  ├─ Tracks running byte offset per line
  ├─ Rebuilds index entry for each valid line
  └─ Logs: "✓ Index rebuilt — N event(s) recovered."
```

The key insight: because we track `{ offset, length }` for every event in memory, reading is a single `fs.readSync` call positioned exactly at that record. We never scan the file after startup.

---

## Endpoints

### `POST /events`
Append a new event. Body must be a JSON object with at least a `type` field.

```bash
curl -X POST http://localhost:4000/events \
  -H "Content-Type: application/json" \
  -d '{"type":"payment.initiated","userId":"u_001","amount":5000,"currency":"NGN"}'
```

```json
{
  "ok": true,
  "event": {
    "id": "evt_1780192012606_wkwknr1",
    "timestamp": "2026-05-31T01:46:52.606Z",
    "type": "payment.initiated",
    "userId": "u_001",
    "amount": 5000,
    "currency": "NGN"
  }
}
```

### `GET /events/:id`
Fetch a single event by ID. Uses direct byte-seek — no log scan.

```bash
curl http://localhost:4000/events/181f62f7-5894-4dd1-9c73-0df346ebaa82
```

```json
{
  "ok": true,
  "event": {
    "id": "evt_1780192012606_wkwknr1",
    "timestamp": "2026-05-31T01:46:52.606Z",
    "type": "payment.initiated",
    "userId": "u_001",
    "amount": 5000,
    "currency": "NGN"
  }
}
```

Returns `404` if the ID is not in the index.

### `GET /events`
List all event IDs currently in the index.

```bash
curl http://localhost:4000/events
# {"ok":true,"count":5,"ids":["evt_...","evt_...",...]}
```

### `GET /health`
Liveness check. Returns current indexed event count.

---

## Running locally

```bash
git clone <repo-url>
cd event-store
npm install
npm start
```

Server starts on `http://localhost:4000`.  
Set `PORT` env var to override.

```bash
PORT=8080 npm start
```

---

## Demo scenario (for the 30s video)

```bash
# 1. Start fresh — 0 events recovered
npm start

# 2. Write three events
curl -X POST http://localhost:4000/events -d '{"type":"user.signup","userId":"u_001"}'
curl -X POST http://localhost:4000/events -d '{"type":"payment.initiated","amount":5000}'
curl -X POST http://localhost:4000/events -d '{"type":"payment.completed","status":"success"}'

# 3. Fetch one by ID (copy an ID from step 2 output)
curl http://localhost:4000/events/evt_<id>

# 4. Kill the server (Ctrl+C or kill PID)

# 5. Restart — watch the recovery log
npm start
# → "✓ Index rebuilt — 3 event(s) recovered."

# 6. Fetch the same ID again — still works
curl http://localhost:4000/events/evt_<id>
```

---

## Design decisions

**Why `fs.appendFileSync`?**  
Synchronous append is effectively atomic for single-process writes — the OS guarantees the write completes before the call returns. A production version would use a write-ahead queue or file locking for concurrent writers.

**Why no UUID library?**  
`evt_${Date.now()}_${random}` is collision-resistant enough for a prototype. Easy to swap for `crypto.randomUUID()` (Node 14.17+) with zero dependency changes.

**Why rebuild the index on every restart?**  
The log is the source of truth. We could persist the index to a sidecar file, but that adds complexity and a consistency problem. For a 2M MAU social platform's event volume, replaying a log of reasonable size at startup is fast — and simpler to reason about.

---

## Dependencies

```
express   ^5.x   — HTTP server
```

That's it. Everything else is Node built-ins: `fs`, `readline`, `path`, `Buffer`.