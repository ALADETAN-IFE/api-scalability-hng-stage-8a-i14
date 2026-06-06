import express from "express";
import router from "./routes";
import { errorHandler, observabilityMiddleware } from "@/middlewares";
import morgan from "morgan";

const app = express();

// Enable trust proxy for reverse proxy
app.enable("trust proxy");

// Parse JSON request bodies (allow non-object payloads like arrays or primitives)
app.use(express.json({ strict: false }));

app.use(observabilityMiddleware);

app.use(morgan("dev"));

// Connect routes
app.use(router);

app.use(errorHandler);

export default app;
