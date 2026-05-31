import app from "./app";
import { ENV } from "./config";
import { logger } from "@/utils";
import { replayLog } from "./modules/events";

const PORT = ENV.PORT || 3000;

const startServer = async () => {
  const recovered = await replayLog();
  logger.info(
    "EventStore",
    `Startup recovery completed with ${recovered} recovered event(s).`,
  );

  app.listen(PORT, () => {
    logger.info("Server", `Server is running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  logger.error("Server", "Failed to start server", error as Error);
  process.exit(1);
});
