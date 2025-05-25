import express from "express"
import { MCQController } from "../controllers/mcq.controller"

const router = express.Router()
const mcqController = new MCQController()

// Generate MCQs for a video
router.post("/generate/:videoId", mcqController.generateMCQs)

// Get MCQs for a video
router.get("/:videoId", mcqController.getMCQs)

// Update an MCQ
router.put("/:videoId/segment/:segmentId/question/:questionId", mcqController.updateMCQ)

export const mcqRoutes = router
