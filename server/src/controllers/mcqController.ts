import type { Request, Response } from "express"
import MCQ from "../models/MCQ"
import Video from "../models/Video"

export const getMCQsByVideoId = async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params

    // Check if video exists
    const video = await Video.findById(videoId)
    if (!video) {
      return res.status(404).json({ message: "Video not found" })
    }

    const mcqs = await MCQ.find({ videoId }).select("-videoId -createdAt -updatedAt -__v").lean()

    res.json(mcqs)
  } catch (error: any) {
    console.error("Get MCQs error:", error)
    res.status(500).json({ message: error.message })
  }
}

export const createMCQs = async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params
    const { mcqs } = req.body

    // Check if video exists
    const video = await Video.findById(videoId)
    if (!video) {
      return res.status(404).json({ message: "Video not found" })
    }

    // Validate MCQs format
    if (!Array.isArray(mcqs)) {
      return res.status(400).json({ message: "MCQs must be an array" })
    }

    // Add videoId to each MCQ
    const mcqsWithVideoId = mcqs.map((mcq) => ({
      ...mcq,
      videoId,
    }))

    // Save MCQs
    const savedMCQs = await MCQ.insertMany(mcqsWithVideoId)

    res.status(201).json({
      message: "MCQs created successfully",
      count: savedMCQs.length,
    })
  } catch (error: any) {
    console.error("Create MCQs error:", error)
    res.status(500).json({ message: error.message })
  }
}

export const updateMCQ = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updateData = req.body

    const mcq = await MCQ.findByIdAndUpdate(id, updateData, { new: true })

    if (!mcq) {
      return res.status(404).json({ message: "MCQ not found" })
    }

    res.json({
      message: "MCQ updated successfully",
      mcq,
    })
  } catch (error: any) {
    console.error("Update MCQ error:", error)
    res.status(500).json({ message: error.message })
  }
}

export const deleteMCQ = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const mcq = await MCQ.findByIdAndDelete(id)

    if (!mcq) {
      return res.status(404).json({ message: "MCQ not found" })
    }

    res.json({ message: "MCQ deleted successfully" })
  } catch (error: any) {
    console.error("Delete MCQ error:", error)
    res.status(500).json({ message: error.message })
  }
}
