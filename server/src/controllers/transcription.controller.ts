import type { Request, Response } from "express"
import { Video } from "../models/video.model"
import { TranscriptionService } from "../services/transcription-service"

export class TranscriptionController {
  private transcriptionService: TranscriptionService

  constructor() {
    this.transcriptionService = new TranscriptionService()
  }

  // Start transcription for a video
  startTranscription = async (req: Request, res: Response) => {
    try {
      const { videoId } = req.params

      const video = await Video.findById(videoId)

      if (!video) {
        return res.status(404).json({ message: "Video not found" })
      }

      if (video.status !== "processing" && video.status !== "error") {
        return res.status(400).json({
          message: `Transcription already ${video.status === "completed" ? "completed" : "in progress"}`,
        })
      }

      // Update status to transcribing
      video.status = "transcribing"
      await video.save()

      // Start transcription process asynchronously
      this.transcriptionService.startTranscription(videoId).catch(async (err) => {
        console.error("Error in transcription process:", err)

        // Update video status to error
        const videoToUpdate = await Video.findById(videoId)
        if (videoToUpdate) {
          videoToUpdate.status = "error"
          videoToUpdate.error = err.message || "Transcription failed"
          await videoToUpdate.save()
        }
      })

      res.json({ message: "Transcription started" })
    } catch (error: any) {
      res.status(500).json({ message: error.message })
    }
  }

  // Get transcription status
  getTranscriptionStatus = async (req: Request, res: Response) => {
    try {
      const { videoId } = req.params

      const video = await Video.findById(videoId).select("status error")

      if (!video) {
        return res.status(404).json({ message: "Video not found" })
      }

      res.json({
        status: video.status,
        error: video.error,
      })
    } catch (error: any) {
      res.status(500).json({ message: error.message })
    }
  }

  // Get transcription segments
  getTranscriptionSegments = async (req: Request, res: Response) => {
    try {
      const { videoId } = req.params

      const video = await Video.findById(videoId).select("transcript status")

      if (!video) {
        return res.status(404).json({ message: "Video not found" })
      }

      if (video.status !== "completed" && video.status !== "generating") {
        return res.status(400).json({
          message: "Transcription not yet completed",
          status: video.status,
        })
      }

      if (!video.transcript || !video.transcript.segments) {
        return res.status(404).json({ message: "Transcript not found" })
      }

      res.json(video.transcript.segments)
    } catch (error: any) {
      res.status(500).json({ message: error.message })
    }
  }
}
