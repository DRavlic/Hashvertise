import mongoose from "mongoose";
import { DB } from "./environment";

export const connectDatabase = async (): Promise<void> => {
  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(DB);
    console.log("Connected to MongoDB successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};
