# Task: Notification Batcher

## Summary

At low volume, Twitter sends one notification per like. When a post goes viral, it groups them: "Alice and 97 others liked your post."

Build a service that automatically switches between the two modes based on the current like rate.

## What To Build

A small HTTP service that takes like events and delivers notifications, individually when quiet and grouped when busy. Use whatever language and framework you're comfortable with.

**Storage:** use SQLite (or any small relational DB) for persisted events and notifications. The 60-second sliding window and the per-post buffer live **in memory**.

### Core requirements

1. **POST /events**: takes `{ postId, likerName, authorId }`. Save the event. Either create an immediate notification or add it to the post's buffer, depending on the current mode. Return 201 with `{ eventId, mode: "individual" | "buffered" }`.
2. **GET /notifications?authorId=**: list notifications for that author, newest first. Individual: `"Chidi liked your post"`. Grouped: `"Chidi and 47 others liked your post"`.
3. **Rate detection (per post)**: count likes in a rolling 60-second window.
   - Under 10/min: individual mode.
   - 10/min or more: buffered mode.
   - Decide per event, using the count including the just-arrived event.
4. **Buffered mode**: collect likes in an in-memory buffer keyed by `postId`. Every 30 seconds, flush as one grouped notification using the first liker in the buffer and the total count. After flushing, if the rate dropped below 10/min, switch back to individual mode; otherwise schedule the next flush.
5. **Sliding window**: must be a true sliding window. Events older than 60 seconds don't count. (A per-post queue of timestamps is fine.)
6. **Notification log** (`notifications.log`): append a line per notification:

   ```
   18:18:49	Maria and 72 others liked your post	grouped
   18:18:39	Maria and 262 others liked your post	grouped
   18:18:29	Sam and 39 others liked your post	grouped
   18:18:19	Eve liked your post	individual
   ```

   Format: `HH:MM:SS <TAB> message <TAB> type`. Write each line immediately, no batching.

### Deliverables

1. Working server. A manual test should show the individual → grouped transition.
2. A `README.md` in the repo (this is your write-up — keep it simple and practical). It should cover:
   - **Setup**: install + start instructions, and `curl` commands for every endpoint.
   - **An architecture diagram** of the service (events in, sliding window + per-post buffer, notifications out).
   - **The core concepts in your own words**: why batching matters, when the mode flips, and how a sliding window differs from a fixed one.
   - **A snippet of `notifications.log`** showing the transition from individual to grouped and back.
   - **What you struggled with**: the bugs you hit, the things that didn't work the first time, the moments you were stuck.
   - **What you learned**: concepts, patterns, language/framework features, or debugging techniques that were new to you.
   - **Resources you consulted**: articles, docs, Stack Overflow threads, AI prompts, videos — anything that helped. Link them.
   - **Why this project made you a better backend developer**: be specific. What can you do now that you couldn't before? Which production scenarios will you think about differently?
3. A **demo video — 30 seconds maximum**. Screen recording of the server working, showing the individual → grouped → back-to-individual transition. No voiceover required, but must be visually clear. Upload to YouTube (unlisted), Google Drive, or Loom. **One submission only — no retakes.**

## What We're Looking For

- The rate counter is a real sliding window, not a fixed window that resets each minute.
- Edge cases in the grouped message: a flush with 1 like falls back to the individual format; never produce `"and 1 others"`.
- One active timer per post in buffered mode; timers are cleared when the post returns to individual mode.
- The system doesn't thrash around the 10/min threshold.
- `notifications.log` matches the exact `HH:MM:SS \t message \t type` format and is only appended.
- You can explain _why_ batching matters, _when_ the mode flips, and _how_ a sliding window differs from a fixed one.

## Marking (Implementation: 50 / README + Demo Video: 50)

The implementation below is worth **50 marks**. The README write-up and demo video account for the other **50** (total **100**). See `STAGE7_OVERVIEW.md` for the README + demo breakdown.

| # | Criterion | Marks |
|---|---|---|
| 1 | `POST /events` saves the event and returns `{ eventId, mode }` | 4 |
| 2 | `GET /notifications?authorId=` lists author's notifications, newest first | 4 |
| 3 | Individual format exactly `"<name> liked your post"` | 3 |
| 4 | Grouped format exactly `"<name> and <N> others liked your post"` | 4 |
| 5 | Rate detection is a **true sliding** 60s window (not a fixed bucket) | 6 |
| 6 | Threshold logic at 10/min, evaluated including the just-arrived event | 4 |
| 7 | Buffered mode collects per-post in memory, keyed by `postId` | 4 |
| 8 | Flush timer fires every 30s in buffered mode | 5 |
| 9 | After flush, mode is re-evaluated and switches back to individual when rate drops | 4 |
| 10 | Exactly one active timer per post; cleared when switching back to individual | 3 |
| 11 | A flush with 1 like falls back to the individual format (never `"and 1 others"`) | 4 |
| 12 | `notifications.log` matches `HH:MM:SS\tmessage\ttype` exactly | 3 |
| 13 | Each notification is written to the log immediately (no batching of log writes) | 2 |
| | **Total** | **50** |
