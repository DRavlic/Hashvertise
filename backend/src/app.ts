import express, { Request, Response } from "express";
import cors from "cors";
import { errorHandler } from "./common/common.middleware";
import { hederaClient } from "./common/common.hedera";
import topicRoutes from "./topic/topic.routes";
import xRoutes from "./x/x.routes";
import userRoutes from "./user/user.routes";
import hashvertiseRoutes from "./hashvertise/hashvertise.routes";
import { initScheduler } from "./scheduler/scheduler.manager";

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Make Hedera client available throughout the app
app.locals.hederaClient = hederaClient;

/**
 * @route GET /
 * @description API status endpoint
 * @access Public
 */
app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to Hashvertise backend!");
});

// Initialize scheduler
initScheduler();

// Register routes
app.use("/api/user", userRoutes);
app.use("/api/topic", topicRoutes);
app.use("/api/x", xRoutes);
app.use("/api/hashvertise", hashvertiseRoutes);

// Error handler
app.use(errorHandler);

export default app;
