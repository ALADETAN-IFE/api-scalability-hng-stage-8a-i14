import { Request, Response } from "express";
import { appendEvent, getEventById, getStats, listEventIds } from "./event-store";

export const createEvent = (req: Request, res: Response) => {
  const event = appendEvent(req.body);

  return res.status(201).json({
    status: "success",
    event,
  });
};

export const fetchEventById = (req: Request, res: Response) => {
  const eventId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const event = getEventById(eventId);

  if (!event) {
    return res.status(404).json({
      status: "error",
      message: `Event ${req.params.id} not found`,
    });
  }

  return res.status(200).json({
    status: "success",
    event,
  });
};

export const fetchStats = (_req: Request, res: Response) => {
  return res.status(200).json({
    status: "success",
    ...getStats(),
  });
};

export const fetchEventIds = (_req: Request, res: Response) => {
  return res.status(200).json({
    status: "success",
    total: listEventIds().length,
    ids: listEventIds(),
  });
};
