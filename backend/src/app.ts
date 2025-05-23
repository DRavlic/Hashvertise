import express, { Request, Response } from "express";
import cors from "cors";
import { errorHandler } from "./common/common.middleware";
import { hederaClient } from "./common/common.hedera";
import topicRoutes from "./topic/topic.routes";
import xRoutes from "./x/x.routes";

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
  res.json({ message: "Hashvertise API is running" });
});

// Register routes
app.use("/api/topic", topicRoutes);
app.use("/api/x", xRoutes);

// Error handler
app.use(errorHandler);

export default app;
