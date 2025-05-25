import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/video-mcq-app",
  uploadDir: process.env.UPLOAD_DIR || "uploads",
  maxFileSize: 500 * 1024 * 1024, // 500MB
  segmentDuration: 300,
  asc_api_key: "<assembly-ai-api-key>",
};
