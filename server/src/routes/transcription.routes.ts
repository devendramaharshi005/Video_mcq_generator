import express from "express"
import { TranscriptionController } from "../controllers/transcription.controller"

const router = express.Router()
const transcriptionController = new TranscriptionController()

// Start transcription for a video
router.post("/start/:videoId", transcriptionController.startTranscription)

// Get transcription status
router.get("/status/:videoId", transcriptionController.getTranscriptionStatus)

// Get transcription segments
router.get("/segments/:videoId", transcriptionController.getTranscriptionSegments)

export const transcriptionRoutes = router
