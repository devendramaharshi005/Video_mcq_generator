import express from "express"
import type { Multer } from "multer"
import { VideoController } from "../controllers/video.controller"

export const videoRoutes = (upload: Multer) => {
  const router = express.Router()
  const videoController = new VideoController()

  // Get all videos
  router.get("/", videoController.getAllVideos)

  // Get video by ID
  router.get("/:id", videoController.getVideoById)

  // Upload a new video
  router.post("/upload", upload.single("video"), videoController.uploadVideo)

  // Delete a video
  router.delete("/:id", videoController.deleteVideo)

  return router
}
