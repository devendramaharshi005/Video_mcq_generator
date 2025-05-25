import { Video } from "../models/Video"; // Add this import
import { config } from "../config";
import { v4 as uuidv4 } from "uuid";
import transcript_json from "./transcript.json";
import { MCQService } from "./mcq-service";
import { AssemblyAI } from "assemblyai";

export class TranscriptionService {
  private mcqService: MCQService;
  private aaiClient: AssemblyAI;

  constructor() {
    this.mcqService = new MCQService();
    this.aaiClient = new AssemblyAI({
      apiKey: config.asc_api_key,
    });
  }

  async startTranscription(videoId: string): Promise<void> {
    try {
      const video = await Video.findById(videoId);
      if (!video) throw new Error("Video not found");

      video.status = "transcribing";
      await video.save();

      // const duration = await getVideoDuration(video.path);
      // video.duration = duration;
      await video.save();

      const params = {
        audio: video.path, // Should be a public URL
        speaker_labels: true,
      };

      const transcript = await this.aaiClient.transcripts.transcribe(params);
      // const transcript = transcript_json; // this is for the testing only.
      const duration = transcript.audio_duration;
      video.duration = duration;
      await video.save();
      console.log(transcript, "complete transcript here.");

      if (transcript.status === "error") {
        throw new Error(`Transcription failed: ${transcript.error}`);
      }

      const segments = this.processTranscription(
        transcript?.utterances?.map((e) => ({
          speaker: e.speaker,
          text: e.text,
          start: e.start / 1000,
          end: e.end / 1000,
        })) || [],
        duration
      );
      console.log(segments, "segments... here");
      video.transcript = { segments };
      video.status = "generating";
      await video.save();

      console.log("start -> mcq", this.mcqService);
      console.log(videoId, "video id");
      const mcqdata = await this.mcqService.generateMCQs(videoId);
      console.log(mcqdata, "mcq data called");

      video.status = "completed";
      await video.save();
    } catch (error) {
      console.error("Transcription error:", error);
      const video = await Video.findById(videoId);
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
      const startTime = i * segmentDuration * 1000; // milliseconds
      const endTime = Math.min(
        (i + 1) * segmentDuration * 1000,
        videoDuration * 1000
      );

      const segmentUtterances = utterances.filter(
        (u: any) => u.start * 1000 >= startTime && u.start * 1000 < endTime
      );

      const text = segmentUtterances.map((u: any) => u.text).join(" ");

      segments.push({
        id: uuidv4(),
        startTime: startTime / 1000, // back to seconds
        endTime: endTime / 1000,
        text: text.trim() || `[No speech detected in segment ${i + 1}]`,
      });
    }

    return segments;
  }
}
