import { NextFunction, Request, Response, Router } from "express";
import modulesRouter from "./modules";
import { notFound, rootHandler } from "./middlewares";
import swaggerUi from "swagger-ui-express";
import { routeRegistry } from "./docs";
import eventRoutes from "./modules/events";

const router = Router();

// Root endpoint
router.get("/", rootHandler);

// Swagger UI with auto-generated spec
router.use(
  "/api-docs",
  swaggerUi.serve,
  (_req: Request, res: Response, next: NextFunction) => {
    const projectName = "API SCALABILITY";
    const spec = routeRegistry.generateOpenAPI(
      projectName,
      "1.0.0",
      `${_req.protocol}://${_req.get("host")}`,
    );
    const options = {
      customSiteTitle: projectName,
    };

    swaggerUi.setup(spec, options)(_req, res, next);
  },
);

router.use(eventRoutes);

router.use("/api", modulesRouter);

// 404 handler - must be last
router.use(notFound);

export default router;
