import type { Request, Response } from "express";
import { Video } from "../models/video.model";
import { MCQService } from "../services/mcq-service";

export class MCQController {
  private mcqService: MCQService;

  constructor() {
    this.mcqService = new MCQService();
  }

  // Generate MCQs for a video
  generateMCQs = async (req: Request, res: Response) => {
    try {
      const { videoId } = req.params;

      const video = await Video.findById(videoId);

      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      if (video.status !== "transcribing" && video.status !== "completed") {
        return res.status(400).json({
          message: "Transcription must be completed before generating MCQs",
          status: video.status,
        });
      }

      if (
        !video.transcript ||
        !video.transcript.segments ||
        video.transcript.segments.length === 0
      ) {
        return res
          .status(400)
          .json({ message: "No transcript segments found" });
      }

      // Update status to generating
      video.status = "generating";
      await video.save();

      // Start MCQ generation process asynchronously
      this.mcqService.generateMCQs(videoId).catch(async (err) => {
        console.error("Error in MCQ generation process:", err);

        // Update video status to error
        const videoToUpdate = await Video.findById(videoId);
        if (videoToUpdate) {
          videoToUpdate.status = "error";
          videoToUpdate.error = err.message || "MCQ generation failed";
          await videoToUpdate.save();
        }
      });

      res.json({ message: "MCQ generation started" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  // Get MCQs for a video
  getMCQs = async (req: Request, res: Response) => {
    try {
      const { videoId } = req.params;

      const video = await Video.findById(videoId).select(
        "transcript.segments.questions status"
      );

      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      if (video.status !== "completed") {
        return res.status(400).json({
          message: "MCQ generation not yet completed",
          status: video.status,
        });
      }

      if (!video.transcript || !video.transcript.segments) {
        return res.status(404).json({ message: "No MCQs found" });
      }

      // Extract questions from all segments
      const mcqs = video.transcript.segments.map((segment) => ({
        segmentId: segment.id,
        questions: segment.questions || [],
      }));

      res.json(mcqs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  // Update an MCQ
  updateMCQ = async (req: Request, res: Response) => {
    try {
      const { videoId, segmentId, questionId } = req.params;
      const { question, options, correctOptionId } = req.body;

      if (!question || !options || !correctOptionId) {
        return res
          .status(400)
          .json({
            message: "Question, options, and correctOptionId are required",
          });
      }

      const video = await Video.findById(videoId);

      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      if (!video.transcript || !video.transcript.segments) {
        return res.status(404).json({ message: "No transcript found" });
      }

      // Find the segment
      const segmentIndex = video.transcript.segments.findIndex(
        (s) => s.id === segmentId
      );

      if (segmentIndex === -1) {
        return res.status(404).json({ message: "Segment not found" });
      }

      // Find the question
      const questionIndex =
        video.transcript.segments[segmentIndex].questions?.findIndex(
          (q) => q.id === questionId
        ) ?? -1;

      if (questionIndex === -1) {
        return res.status(404).json({ message: "Question not found" });
      }

      // Update the question
      if (video.transcript.segments[segmentIndex].questions) {
        video.transcript.segments[segmentIndex].questions![questionIndex] = {
          ...video.transcript.segments[segmentIndex].questions![questionIndex],
          question,
          options,
          correctOptionId,
        };
      }

      await video.save();

      res.json({ message: "MCQ updated successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}
