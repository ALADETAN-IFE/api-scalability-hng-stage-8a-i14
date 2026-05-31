import { routeRegistry } from "@/docs";
import { z } from "zod";
import {
  createEventResponseSchema,
  eventBodySchema,
  eventIdsSchema,
  eventStatsSchema,
  fetchEventResponseSchema,
} from "./events.schema";
import {
  createEvent,
  fetchEventById,
  fetchEventIds,
  fetchStats,
} from "./events.controller";

export function registerEventRoutesDocs() {
  routeRegistry.register({
    method: "POST",
    path: "/events",
    handler: createEvent,
    docs: {
      tags: ["Events"],
      summary: "Append an event to the log",
      description:
        "Stores a JSON event in the append-only log and returns the created record.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              ...z.toJSONSchema(eventBodySchema),
              description:
                "Any valid JSON object or array. Example shows a payment event payload.",
              example: {
                payload: {
                  type: "payment.completed",
                  paymentId: "pay_01HZZ8J8Q5Q9M4K1K5G7T8B2C1",
                  amount: 2500,
                  currency: "USD",
                  status: "success",
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Created event",
          content: {
            "application/json": {
              schema: {
                ...z.toJSONSchema(createEventResponseSchema),
                example: {
                  status: "success",
                  event: {
                    id: "8e6b0b7d-6a5a-4f9f-9c1d-1a0f2d8bf3a0",
                    createdAt: "2026-05-31T12:00:00.000Z",
                    payload: {
                      type: "payment.completed",
                      paymentId: "pay_01HZZ8J8Q5Q9M4K1K5G7T8B2C1",
                      amount: 2500,
                      currency: "USD",
                      status: "success",
                    },
                  },
                },
              },
            },
          },
        },
        400: {
          description: "Invalid or missing JSON body",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "error" },
                  message: {
                    type: "string",
                    example: "Request body must be valid JSON.",
                  },
                },
              },
            },
          },
        },
        405: {
          description: "Method not allowed",
        },
        500: {
          description: "Unexpected write failure",
        },
      },
    },
  });

  routeRegistry.register({
    method: "GET",
    path: "/events/:id",
    handler: fetchEventById,
    docs: {
      tags: ["Events"],
      summary: "Fetch an event by ID",
      description: "Reads the exact byte range for an event using the in-memory index.",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: {
            ...z.toJSONSchema(z.string().min(1)),
            example: "8e6b0b7d-6a5a-4f9f-9c1d-1a0f2d8bf3a0",
          },
          description: "Event ID.",
        },
      ],
      responses: {
        200: {
          description: "Event found",
          content: {
            "application/json": {
              schema: {
                ...z.toJSONSchema(fetchEventResponseSchema),
                example: {
                  status: "success",
                  event: {
                    id: "8e6b0b7d-6a5a-4f9f-9c1d-1a0f2d8bf3a0",
                    createdAt: "2026-05-31T12:00:00.000Z",
                    payload: {},
                  },
                },
              },
            },
          },
        },
        400: {
          description: "Invalid event ID",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "error" },
                  message: { type: "string", example: "Event ID is required." },
                },
              },
            },
          },
        },
        404: {
          description: "Event not found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "error" },
                  message: {
                    type: "string",
                    example: "Event does not exist in the index.",
                  },
                },
              },
            },
          },
        },
        405: {
          description: "Method not allowed",
        },
      },
    },
  });

  routeRegistry.register({
    method: "GET",
    path: "/stats",
    handler: fetchStats,
    docs: {
      tags: ["Events"],
      summary: "Get event-store stats",
      responses: {
        200: {
          description: "Storage statistics",
          content: {
            "application/json": {
              schema: {
                ...z.toJSONSchema(eventStatsSchema),
                example: {
                  status: "success",
                  total: 12,
                  bytes: 1840,
                },
              },
            },
          },
        },
        405: {
          description: "Method not allowed",
        },
      },
    },
  });

  routeRegistry.register({
    method: "GET",
    path: "/events",
    handler: fetchEventIds,
    docs: {
      tags: ["Events"],
      summary: "List event IDs",
      responses: {
        200: {
          description: "Event IDs",
          content: {
            "application/json": {
              schema: {
                ...z.toJSONSchema(eventIdsSchema),
                example: {
                  status: "success",
                  total: 2,
                  ids: [
                    "8e6b0b7d-6a5a-4f9f-9c1d-1a0f2d8bf3a0",
                    "4a2a9c2f-1f5f-4d6f-9d16-5e8f1b6a24b7",
                  ],
                },
              },
            },
          },
        },
        405: {
          description: "Method not allowed",
        },
      },
    },
  });
}
