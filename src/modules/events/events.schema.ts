import { z } from "zod";

const jsonObjectSchema = z.record(z.string(), z.unknown());

export const eventBodySchema = z.union([jsonObjectSchema, z.array(z.unknown())]);

export const eventIdSchema = z.string().min(1, "Event ID is required");

export const eventParamsSchema = z.object({
  id: eventIdSchema,
});

export const eventRecordSchema = z
  .object({
    id: z.string(),
    createdAt: z.string(),
  })
  .passthrough();

export const createEventResponseSchema = z.object({
  status: z.literal("success"),
  event: eventRecordSchema,
});

export const fetchEventResponseSchema = z.object({
  status: z.literal("success"),
  event: eventRecordSchema,
});

export const eventStatsSchema = z.object({
  status: z.literal("success"),
  total: z.number().int().nonnegative(),
  bytes: z.number().int().nonnegative(),
});

export const eventIdsSchema = z.object({
  status: z.literal("success"),
  total: z.number().int().nonnegative(),
  ids: z.array(z.string()),
});
