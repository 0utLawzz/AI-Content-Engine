import { Router, type IRouter } from "express";
import healthRouter from "./health";
import { projectsRouter } from "./projects";
import { configurationsRouter } from "./configurations";
import { scenesRouter } from "./scenes";
import { pluginsRouter } from "./plugins";
import { bulkJobsRouter } from "./bulk_jobs";
import { exportsRouter } from "./exports";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/projects", projectsRouter);
router.use("/projects/:id/configuration", configurationsRouter);
router.use("/projects/:id/scenes", scenesRouter);
router.use("/plugins", pluginsRouter);
router.use("/bulk-jobs", bulkJobsRouter);
router.use("/exports", exportsRouter);

export default router;
