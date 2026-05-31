import { NextFunction, Request, Response } from "express";
import { HttpError, logger } from "@/utils";

// Centralized error handling middleware

export const errorHandler = (
  err: unknown,
  _: Request,
  res: Response,
  __: NextFunction,
) => {
  // Handle known HttpError instances
  if (err instanceof HttpError) {
    logger.warn("ErrorHandler", `${err.status} ${err.message}`);
    return res.status(err.status).json({
      status: "error",
      message: err.message,
    });
  }

  // Handle body-parser JSON parse errors (invalid JSON payload)
  type BodyParserError = Error & {
    type?: string;
    body?: string;
    status?: number;
    statusCode?: number;
  };

  const isBodyParserError = (value: unknown): value is BodyParserError => {
    if (typeof value !== "object" || value === null) return false;
    const maybe = value as BodyParserError;
    return (
      maybe.type === "entity.parse.failed" ||
      maybe instanceof SyntaxError ||
      typeof maybe.body === "string"
    );
  };

  if (isBodyParserError(err)) {
    const msg = err.message || "Invalid JSON payload";
    logger.warn("ErrorHandler", `400 ${msg}`);
    return res.status(400).json({
      status: "error",
      message: "Invalid JSON body: please provide well-formed JSON.",
    });
  }

  const errToLog = err instanceof Error ? err : new Error(String(err));
  logger.error("ErrorHandler", "Unhandled error", errToLog);

  return res.status(500).json({
    status: "error",
    message: "Internal Server Error",
  });
};
