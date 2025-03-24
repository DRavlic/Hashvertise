import { mongoose } from "@typegoose/typegoose";

import app from "./app";
import logger from "./common/common.instances";
import { DB, PORT } from "./environment";
import { initializeTopicListeners } from "./topic/topic.service";

// Connect to MongoDB and start the server
const main = async () => {
  try {
    await mongoose.connect(DB);
    logger.info("Connected to MongoDB successfully");

    // Initialize active topic listeners from database
    logger.info("Initializing topic listeners...");
    await initializeTopicListeners(app.locals.hederaClient);
  } catch (error) {
    logger.error("MongoDB connection error:", error);
    process.exit(1);
  }

  app.listen(PORT, () => {
    logger.info(`App is listening on port: ${PORT}`);
  });
};

main();
