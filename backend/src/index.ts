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
    try {
      await initializeTopicListeners(app.locals.hederaClient);
      logger.info("Topic listeners initialization completed successfully");
    } catch (listenerError) {
      logger.error("Error initializing topic listeners:", listenerError);
      // Continue execution even if topic listeners fail
    }
  } catch (error) {
    logger.error("Error at starting the server:", error);
    process.exit(1);
  }

  app.listen(PORT, () => {
    logger.info(`App is listening on port: ${PORT}`);
  });
};

main();
