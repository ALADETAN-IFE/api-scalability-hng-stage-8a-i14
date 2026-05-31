import express from "express";
import router from "./routes";
import { errorHandler, observabilityMiddleware } from "@/middlewares";
import morgan from "morgan";

const app = express();

// Parse JSON request bodies
app.use(express.json());

app.use(observabilityMiddleware);

app.use(morgan("dev"));

// Connect routes
app.use(router);

app.use(errorHandler);

export default app;
