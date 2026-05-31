# Stage 8a — Backend Task

## Infrastructure & Resilience at Scale

You are an R&D Software Engineer at Dilamme. One of our flagship products (a social platform with ~2M MAUs) is hitting scaling walls: latency is increasing and minor outages are growing into major incidents. The CTO has asked R&D to prototype three infrastructure solutions. Pick one and implement the prototype.

---

## What to build (pick one)

### 1) Notification Batcher
- Sliding 60s rate counter per post (true sliding window)
- Individual mode when < 10/min; grouped mode at ≥ 10/min
- In-memory per-post buffer with a 30s flush timer
- Write to `notifications.log` line-by-line in the format: `HH:MM:SS \t message \t type`

### 2) Append-Only Event Store
- `events.log` is the database — no SQLite and no JSON rewrites
- One JSON object per line (append-only)
- In-memory index: `Map<id, { offset, length }>`
- `GET /events/:id` must seek directly to the byte range (no scanning the whole file)
- Crash recovery: replay the log on startup and log recovered count

### 3) Retry Engine
- `POST /request` returns immediately with `pending`; a background worker performs the call
- Exponential backoff: 1s → 2s → 4s → 8s → 16s with jitter multiplied from the range [0.8, 1.2) (reroll jitter each attempt)
- Retry on 5xx, timeouts, and network errors — never retry on 4xx
- Worker wakes ~every 500ms; requests exceeding `maxRetries` move to a dead-letter queue

Pick the stack you're most comfortable with. Tasks 1 and 3 may use a small relational DB (SQLite is acceptable). Task 2 intentionally uses no DB.

---

## What to submit

1. Backend repository (GitHub link). Include a concise `README.md` describing your design and how to run the demo.

2. Demo video (max 30s)
- Screen recording of the server demonstrating the required scenarios for your chosen brief. Examples:
	- Notification Batcher: individual → grouped → back
	- Event Store: write → stop → restart → read (show recovered count)
	- Retry Engine: 4xx (terminal) vs 5xx (retry → success or dead-letter)
- No voiceover required — make the interactions visually clear
- Upload to YouTube (unlisted), Google Drive, or Loom
- Videos longer than 30s will be cut off. One submission only.

---

Form submission: https://forms.gle/wtvw3TsmikJsXdbs9

Deadline: Assigned 29 May 2026. Submissions close end of day Monday, 1 June 2026. Late submissions are not accepted.