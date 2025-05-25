import type { Request, Response } from "express";
import fs from "fs";
import { Video } from "../models/video.model";
import MCQ from "../models/MCQ";
// import { generateMockMCQs } from "../utils/mockMCQGenerator";
import { TranscriptionService } from "../services/transcription-service";
import { MCQService } from "../services/mcq-service";

export const uploadVideo = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No video file uploaded" });
    }

    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    // Create video document
    const video = new Video({
      title,
      description,
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      status: "processing",
    });

    await video.save();

    // Trigger transcription + MCQ generation
    setTimeout(async () => {
      try {
        const transcriptionService = new TranscriptionService();
        await transcriptionService.startTranscription(video._id.toString());
        console.log(`Video ${video._id} processed successfully`);
      } catch (err) {
        console.error(`Failed to process video ${video._id}:`, err);
        const failedVideo = await Video.findById(video._id);
        if (failedVideo) {
          failedVideo.status = "error";
          failedVideo.error = "Processing failed";
          await failedVideo.save();
        }
      }
    }, 1000);

    res.status(201).json({
      message: "Video uploaded successfully",
      videoId: video._id,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getAllVideos = async (req: Request, res: Response) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 }).lean();

    const videosWithMCQCount = await Promise.all(
      videos.map(async (video) => {
        const mcqCount = await MCQ.countDocuments({ videoId: video._id });
        return {
          ...video,
          mcqCount: mcqCount > 0 ? mcqCount : undefined,
        };
      })
    );

    res.json(videosWithMCQCount);
  } catch (error: any) {
    console.error("Get videos error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getVideoById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const video = await Video.findById(id).lean();

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    const mcqs = await MCQ.find({ videoId: id })
      .select("-videoId -createdAt -updatedAt -__v")
      .lean();

    res.json({
      ...video,
      mcqs: mcqs.length > 0 ? mcqs : undefined,
    });
  } catch (error: any) {
    console.error("Get video error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteVideo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const video = await Video.findById(id);

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    if (fs.existsSync(video.path)) {
      fs.unlinkSync(video.path);
    }

    await MCQ.deleteMany({ videoId: id });
    await video.deleteOne();

    res.json({ message: "Video deleted successfully" });
  } catch (error: any) {
    console.error("Delete video error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const updateVideoStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, error } = req.body;

    const video = await Video.findById(id);

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    video.status = status;
    if (error) {
      video.error = error;
    }

    await video.save();

    res.json({ message: "Video status updated successfully" });
  } catch (error: any) {
    console.error("Update video status error:", error);
    res.status(500).json({ message: error.message });
  }
};
