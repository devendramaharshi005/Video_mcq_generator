import { config } from "../config";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { Video } from "../models/video.model";
import MCQModel from "../models/MCQ"; // Adjust the path if needed

export class MCQService {
  private readonly FAST_API_URL = "http://localhost:8000/generate-mcqs";

  // Generate MCQs for a video (assuming transcript is already available)
  // async generateMCQs(videoId: string): Promise<void> {
  //   try {

  //     const video = await Video.findById(videoId)

  //     if (!video) {
  //       throw new Error("Video not found")
  //     }

  //     if (!video.transcript || !video.transcript.segments) {
  //       throw new Error("No transcript found")
  //     }

  //     console.log(video.transcript.segments,"segment#######################")
  //     // Process each segment to generate MCQs
  //     for (let i = 0; i < video.transcript.segments.length; i++) {
  //       const segment = video.transcript.segments[i]

  //       if (!segment.text || segment.text.includes("[No speech detected")) {
  //         continue
  //       }

  //       const payload = {
  //         transcript: segment.text,
  //       }

  //       const response = await axios.post(this.FAST_API_URL, payload)

  //       const formattedMCQs = this.formatMCQs(response.data)

  //       video.transcript.segments[i].questions = formattedMCQs
  //       await video.save()
  //     }

  //     video.status = "completed"
  //     await video.save()
  //   } catch (error) {
  //     console.error("MCQ generation error:", error)

  //     try {
  //       const video = await Video.findById(videoId)
  //       if (video) {
  //         video.status = "error"
  //         video.error = error instanceof Error ? error.message : "Unknown MCQ generation error"
  //         await video.save()
  //       }
  //     } catch (e) {
  //       console.error("Failed to update video status after MCQ error:", e)
  //     }

  //     throw error
  //   }
  // }
  async generateMCQs(videoId: string): Promise<void> {
    try {
      const video = await Video.findById(videoId);

      if (!video) {
        throw new Error("Video not found");
      }

      if (!video.transcript || !video.transcript.segments) {
        throw new Error("No transcript found");
      }

      for (let i = 0; i < video.transcript.segments.length; i++) {
        const segment = video.transcript.segments[i];

        if (!segment.text || segment.text.includes("[No speech detected")) {
          continue;
        }

        const payload = {
          transcript: segment.text,
        };

        const response = await axios.post(this.FAST_API_URL, payload);
        const formattedMCQs = this.formatMCQs(response.data);

        // Save each MCQ to the database
        for (const mcq of formattedMCQs) {
          await MCQModel.create({
            videoId: video._id,
            id: mcq.id,
            question: mcq.question,
            options: mcq.options.map((opt: any) => ({
              option: opt.label,
              value: opt.text,
            })),
            correct_answer: {
              option:
                mcq.options.find((o: any) => o.id === mcq.correctOptionId)
                  ?.label || "",
              value:
                mcq.options.find((o: any) => o.id === mcq.correctOptionId)
                  ?.text || "",
            },
          });
        }

        // Also save questions inside video for reference (if needed)
        video.transcript.segments[i].questions = formattedMCQs;
        await video.save();
      }

      video.status = "completed";
      await video.save();
    } catch (error) {
      console.error("MCQ generation error:", error);

      try {
        const video = await Video.findById(videoId);
        if (video) {
          video.status = "error";
          video.error =
            error instanceof Error
              ? error.message
              : "Unknown MCQ generation error";
          await video.save();
        }
      } catch (e) {
        console.error("Failed to update video status after MCQ error:", e);
      }

      throw error;
    }
  }

  // Format MCQs from FastAPI response
  private formatMCQs(mcqs: any[]): any[] {
    return mcqs.map((mcq) => {
      const options = mcq.options.map((opt: any) => ({
        id: uuidv4(),
        text: opt.value,
        label: opt.option,
      }));

      const correct = options.find(
        (o) => o.label === mcq.correct_answer.option
      );

      return {
        id: uuidv4(),
        question: mcq.question,
        options,
        correctOptionId: correct ? correct.id : "",
      };
    });
  }

  // Combine transcript and MCQ generation in one method
  async generateTranscriptAndMCQs(
    videoId: string,
    audioPath: string,
    duration: number,
    transcriptAPI: any
  ): Promise<void> {
    let video;
    try {
      video = await Video.findById(videoId);
      if (!video) throw new Error("Video not found");

      video.status = "transcribing";
      video.duration = duration;
      await video.save();

      const transcript = await transcriptAPI.transcripts.transcribe({
        audio: audioPath,
        speaker_labels: true,
      });

      if (transcript.status === "error") {
        throw new Error(`Transcription failed: ${transcript.error}`);
      }

      const segments = this.processTranscription(
        transcript.utterances || [],
        duration
      );
      video.transcript = { segments };
      video.status = "generating";
      await video.save();

      await this.generateMCQs(videoId);
    } catch (error) {
      console.error("Transcript + MCQ error:", error);
      if (video) {
        video.status = "error";
        video.error = error instanceof Error ? error.message : "Unknown error";
        await video.save();
      }
      throw error;
    }
  }

  private processTranscription(
    utterances: any[],
    videoDuration: number
  ): any[] {
    const segmentDuration = config.segmentDuration;
    const segments = [];
    const numSegments = Math.ceil(videoDuration / segmentDuration);

    for (let i = 0; i < numSegments; i++) {
      const startTime = i * segmentDuration * 1000;
      const endTime = Math.min(
        (i + 1) * segmentDuration * 1000,
        videoDuration * 1000
      );

      const segmentUtterances = utterances.filter(
        (u: any) => u.start >= startTime && u.start < endTime
      );

      const text = segmentUtterances.map((u: any) => u.text).join(" ");

      segments.push({
        id: uuidv4(),
        startTime: startTime / 1000,
        endTime: endTime / 1000,
        text: text || `[No speech detected in segment ${i + 1}]`,
      });
    }

    return segments;
  }
}
