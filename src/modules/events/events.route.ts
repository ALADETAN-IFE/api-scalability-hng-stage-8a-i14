import { Router } from "express";
import {
  createEvent,
  fetchEventById,
  fetchEventIds,
  fetchStats,
} from "./events.controller";
import { registerEventRoutesDocs } from "./events.docs";
import { methodNotAllowedHandler, validateRequest } from "@/middlewares";
import { eventBodySchema, eventParamsSchema } from "./events.schema";

const router = Router();

registerEventRoutesDocs();

router.use(methodNotAllowedHandler(["GET", "POST"]));

router.post("/events", validateRequest({ body: eventBodySchema }), createEvent);
router.get("/events/:id", validateRequest({ params: eventParamsSchema }), fetchEventById);
router.get("/stats", fetchStats);
router.get("/events", fetchEventIds);

export default router;
