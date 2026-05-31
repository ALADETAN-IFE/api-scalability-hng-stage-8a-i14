# Task: Retry Engine

## Summary

When your service calls an external API (a payment gateway, an SMS provider, a bank), it sometimes fails. If you retry too fast, you make things worse. If you don't retry at all, you lose work.

Build a service that retries failed requests with backoff.

## What To Build

A small HTTP service that takes an HTTP request, retries it on failure, and tracks every attempt. Use whatever language and framework you're comfortable with.

**Storage:** use SQLite (or any small relational DB). Don't use a JSON file or in-memory only.

### Core requirements

1. **POST /request**: takes `{ url, method, body?, maxRetries?, backoffMs? }`. Save it, return immediately with the request ID and status `pending`. A background worker does the actual call.
2. **Backoff rules**:
   - Default wait is `backoffMs` (1000ms), doubling each retry: 1s, 2s, 4s, 8s, 16s.
   - On every attempt, multiply the wait by a random number in `[0.8, 1.2)` (jitter).
   - Default `maxRetries` is 5.
   - Retry on 5xx, timeouts, and network errors. Do **not** retry on 4xx.
3. **Storage**: persist `id`, `url`, `method`, `body`, `status` (pending/retrying/completed/failed), `attemptCount`, `nextRetryAt`, `lastError`, `result`, `createdAt`, `updatedAt`. Keep a record of each attempt (separate table/collection or JSON column).
4. **Worker**: a loop that wakes every ~500ms and picks up rows where `nextRetryAt <= now()`.
5. **GET /requests/:id**: return the request and its attempt history.
6. **GET /requests?status=failed**: list by status.
7. **Dead-letter**: once `maxRetries` is hit, mark `failed` and stop. Never retry again.

### Deliverables

1. Working server with a test script that hits a mock endpoint which fails 3 times then succeeds. Output should clearly show the wait between attempts doubling, the jitter, and the final success.
2. A `README.md` in the repo (this is your write-up — keep it simple and practical). It should cover:
   - **Setup**: install + start instructions, and `curl` commands for every endpoint.
   - **An architecture diagram** of the retry flow (API → storage → worker → external service).
   - **The core concepts in your own words**: why exponential backoff and jitter matter, and why some errors should be retried while others shouldn't.
   - **A screenshot of `GET /requests/:id`** showing the attempt history of a request that failed a few times and eventually succeeded.
   - **What you struggled with**: the bugs you hit, the things that didn't work the first time, the moments you were stuck.
   - **What you learned**: concepts, patterns, language/framework features, or debugging techniques that were new to you.
   - **Resources you consulted**: articles, docs, Stack Overflow threads, AI prompts, videos — anything that helped. Link them.
   - **Why this project made you a better backend developer**: be specific. What can you do now that you couldn't before? Which production scenarios will you think about differently?
3. A **demo video — 30 seconds maximum**. Screen recording showing a request that fails a few times and eventually succeeds (backoff visibly doubling, jitter), plus a 4xx case that is *not* retried and a request that hits `maxRetries` and is dead-lettered. No voiceover required, but must be visually clear. Upload to YouTube (unlisted), Google Drive, or Loom. **One submission only — no retakes.**

## What We're Looking For

- Backoff doubles each retry, not a fixed increment.
- Jitter is re-rolled per attempt.
- 4xx is terminal; 5xx, timeouts, and network errors are retried.
- Failed requests stay failed.
- You can explain _why_ backoff and jitter exist.

## Marking (Implementation: 50 / README + Demo Video: 50)

The implementation below is worth **50 marks**. The README write-up and demo video account for the other **50** (total **100**). See `STAGE7_OVERVIEW.md` for the README + demo breakdown.

| # | Criterion | Marks |
|---|---|---|
| 1 | `POST /request` accepts the payload, persists it, returns `{ id, status: "pending" }` immediately | 5 |
| 2 | Storage schema matches spec (all required fields + attempt history) | 6 |
| 3 | Backoff **doubles** each retry (not a fixed increment) | 7 |
| 4 | Jitter is re-rolled per attempt within `[0.8, 1.2)` | 5 |
| 5 | Retries on 5xx, timeouts, network errors; **does not** retry on 4xx | 8 |
| 6 | Worker loop wakes ~every 500ms and picks up due rows | 6 |
| 7 | Per-attempt history is recorded (separate table or JSON column) | 4 |
| 8 | `GET /requests/:id` returns the request plus full attempt history | 4 |
| 9 | `GET /requests?status=...` filters correctly | 2 |
| 10 | Dead-letter at `maxRetries`: marked `failed` and never retried again | 3 |
| | **Total** | **50** |
