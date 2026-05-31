import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { logger } from "@/utils";

type EventRecord = Record<string, unknown> & {
  id: string;
  createdAt: string;
};

type IndexEntry = {
  offset: number;
  length: number;
};

const LOG_PATH = path.resolve(process.cwd(), "events.log");

const index = new Map<string, IndexEntry>();

let currentOffset = 0;

function ensureLogFile() {
  if (!fs.existsSync(LOG_PATH)) {
    fs.writeFileSync(LOG_PATH, "");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeLine(lineBuffer: Buffer) {
  if (lineBuffer.length > 0 && lineBuffer[lineBuffer.length - 1] === 13) {
    return lineBuffer.subarray(0, lineBuffer.length - 1);
  }

  return lineBuffer;
}

function buildEvent(body: unknown): EventRecord {
  const payload = isRecord(body) ? body : { data: body };

  return {
    ...payload,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  };
}

export async function replayLog() {
  ensureLogFile();
  index.clear();
  currentOffset = 0;

  const stream = fs.createReadStream(LOG_PATH);
  let buffered = Buffer.alloc(0);
  let recovered = 0;

  for await (const chunk of stream) {
    buffered = Buffer.concat([buffered, chunk as Buffer]);

    let newlineIndex = buffered.indexOf(10);

    while (newlineIndex !== -1) {
      const rawLine = buffered.subarray(0, newlineIndex);
      const lineLength = newlineIndex + 1;
      const lineStart = currentOffset;

      currentOffset += lineLength;
      buffered = buffered.subarray(lineLength);
      newlineIndex = buffered.indexOf(10);

      const normalized = normalizeLine(rawLine);
      if (normalized.length === 0) {
        continue;
      }

      try {
        const parsed = JSON.parse(normalized.toString("utf8")) as Partial<EventRecord>;

        if (typeof parsed.id === "string") {
          index.set(parsed.id, { offset: lineStart, length: lineLength });
          recovered += 1;
        }
      } catch {
        logger.warn("EventStore", "Skipped malformed event while rebuilding the index.");
      }
    }
  }

  if (buffered.length > 0) {
    const lineStart = currentOffset;
    currentOffset += buffered.length;

    const normalized = normalizeLine(buffered);
    if (normalized.length > 0) {
      try {
        const parsed = JSON.parse(normalized.toString("utf8")) as Partial<EventRecord>;

        if (typeof parsed.id === "string") {
          index.set(parsed.id, { offset: lineStart, length: buffered.length });
          recovered += 1;
        }
      } catch {
        logger.warn(
          "EventStore",
          "Skipped trailing malformed event while rebuilding the index.",
        );
      }
    }
  }

  logger.info("EventStore", `Recovered ${recovered} event(s) from events.log.`);

  return recovered;
}

export function appendEvent(body: unknown) {
  ensureLogFile();

  const event = buildEvent(body);
  const line = `${JSON.stringify(event)}\n`;
  const lineBuffer = Buffer.from(line, "utf8");
  const offset = currentOffset;

  fs.appendFileSync(LOG_PATH, lineBuffer);

  index.set(event.id, { offset, length: lineBuffer.length });
  currentOffset += lineBuffer.length;

  return event;
}

export function getEventById(id: string) {
  const entry = index.get(id);

  if (!entry) {
    return null;
  }

  const buffer = Buffer.alloc(entry.length);
  const fd = fs.openSync(LOG_PATH, "r");

  try {
    const bytesRead = fs.readSync(fd, buffer, 0, entry.length, entry.offset);
    const content = buffer
      .subarray(0, bytesRead)
      .toString("utf8")
      .replace(/\r?\n$/, "");

    return JSON.parse(content) as EventRecord;
  } finally {
    fs.closeSync(fd);
  }
}

export function getStats() {
  return {
    total: index.size,
    bytes: currentOffset,
  };
}

export function listEventIds() {
  return Array.from(index.keys());
}
