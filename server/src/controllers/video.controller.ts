import type { Request, Response } from "express"
import path from "path"
import fs from "fs"
import { Video } from "../models/video.model"
import { TranscriptionService } from "../services/transcription-service"
import { config } from "../config"
import { generateThumbnail } from "../utils/video-utils"

export class VideoController {
  private transcriptionService: TranscriptionService

  constructor() {
    this.transcriptionService = new TranscriptionService()
  }

  // Get all videos
  getAllVideos = async (req: Request, res: Response) => {
    try {
      const videos = await Video.find().sort({ createdAt: -1 }).select("-transcript")

      // Add video URL to each video
      const videosWithUrls = videos.map((video) => {
        const videoDoc = video.toObject()
        videoDoc.videoUrl = `http://${req.headers.host}/uploads/${video.filename}`
        return videoDoc
      })

      res.json(videosWithUrls)
    } catch (error: any) {
      res.status(500).json({ message: error.message })
    }
  }

  // Get video by ID
  getVideoById = async (req: Request, res: Response) => {
    try {
      const video = await Video.findById(req.params.id)

      if (!video) {
        return res.status(404).json({ message: "Video not found" })
      }

      const videoDoc = video.toObject()
      videoDoc.videoUrl = `http://${req.headers.host}/uploads/${video.filename}`

      res.json(videoDoc)
    } catch (error: any) {
      res.status(500).json({ message: error.message })
    }
  }

  // Upload a new video
  uploadVideo = async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No video file uploaded" })
      }

      const { title } = req.body

      if (!title) {
        return res.status(400).json({ message: "Video title is required" })
      }

      // Create a new video document
      const video = new Video({
        title,
        filename: req.file.filename,
        path: req.file.path,
        status: "processing",
      })

      await video.save()

      // Generate thumbnail asynchronously
      generateThumbnail(req.file.path, path.join(config.uploadDir, `${video._id}-thumbnail.jpg`))
        .then((thumbnailPath) => {
          video.thumbnailUrl = `http://${req.headers.host}/${thumbnailPath}`
          return video.save()
        })
        .catch((err) => console.error("Error generating thumbnail:", err))

      // Start transcription process asynchronously
      this.transcriptionService
        .startTranscription(video._id.toString())
        .catch((err) => console.error("Error starting transcription:", err))

      res.status(201).json({
        message: "Video uploaded successfully",
        videoId: video._id,
      })
    } catch (error: any) {
      res.status(500).json({ message: error.message })
    }
  }

  // Delete a video
  deleteVideo = async (req: Request, res: Response) => {
    try {
      const video = await Video.findById(req.params.id)

      if (!video) {
        return res.status(404).json({ message: "Video not found" })
      }

      // Delete the video file
      if (fs.existsSync(video.path)) {
        fs.unlinkSync(video.path)
      }

      // Delete thumbnail if exists
      const thumbnailPath = path.join(config.uploadDir, `${video._id}-thumbnail.jpg`)
      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath)
      }

      // Delete the video document
      await video.deleteOne()

      res.json({ message: "Video deleted successfully" })
    } catch (error: any) {
      res.status(500).json({ message: error.message })
    }
  }
}
