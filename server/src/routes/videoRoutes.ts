import express from "express"
import multer from "multer"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import { config } from "../config"
import { uploadVideo, getAllVideos, getVideoById, deleteVideo, updateVideoStatus } from "../controllers/videoController"

const router = express.Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`
    cb(null, uniqueFilename)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSize },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "video/mp4") {
      return cb(new Error("Only MP4 videos are allowed"))
    }
    cb(null, true)
  },
})

// Routes
router.post("/upload", upload.single("video"), uploadVideo)
router.get("/", getAllVideos)
router.get("/:id", getVideoById)
router.delete("/:id", deleteVideo)
router.patch("/:id/status", updateVideoStatus)

export default router
