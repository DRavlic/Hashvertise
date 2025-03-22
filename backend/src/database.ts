import mongoose from "mongoose";

// Default to local docker connection if no MongoDB URI is provided
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb://root:example@localhost:27017/hashvertise?authSource=admin";

export const connectDatabase = async (): Promise<void> => {
  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};
