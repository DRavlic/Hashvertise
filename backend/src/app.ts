import express, { Request, Response } from "express";
import cors from "cors";
import { errorHandler } from "./common/common.middleware";
import { hederaClient } from "./common/common.crypto";
import topicRoutes from "./topic/topic.routes";

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Make Hedera client available throughout the app
app.locals.hederaClient = hederaClient;

// Root endpoint
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Hashvertise API is running" });
});

// Register routes
app.use("/api/topic", topicRoutes);

// Error handler
app.use(errorHandler);

export default app;
