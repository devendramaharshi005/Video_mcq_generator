import express from "express"
import { getMCQsByVideoId, createMCQs, updateMCQ, deleteMCQ } from "../controllers/mcqController"

const router = express.Router()

// Routes
router.get("/video/:videoId", getMCQsByVideoId)
router.post("/video/:videoId", createMCQs)
router.put("/:id", updateMCQ)
router.delete("/:id", deleteMCQ)

export default router
