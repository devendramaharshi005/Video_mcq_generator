import mongoose, { type Document, Schema } from "mongoose"

export interface IQuestion {
  id: string
  question: string
  options: { id: string; text: string }[]
  correctOptionId: string
}

export interface ISegment {
  id: string
  startTime: number
  endTime: number
  text: string
  questions?: IQuestion[]
}

export interface ITranscript {
  segments: ISegment[]
}

export interface IVideo extends Document {
  title: string
  filename: string
  path: string
  duration: number
  status: "processing" | "transcribing" | "generating" | "completed" | "error"
  error?: string
  transcript?: ITranscript
  thumbnailUrl?: string
  createdAt: Date
  updatedAt: Date
}

const QuestionSchema = new Schema({
  id: { type: String, required: true },
  question: { type: String, required: true },
  options: [
    {
      id: { type: String, required: true },
      text: { type: String, required: true },
    },
  ],
  correctOptionId: { type: String, required: true },
})

const SegmentSchema = new Schema({
  id: { type: String, required: true },
  startTime: { type: Number, required: true },
  endTime: { type: Number, required: true },
  text: { type: String, required: true },
  questions: [QuestionSchema],
})

const TranscriptSchema = new Schema({
  segments: [SegmentSchema],
})

const VideoSchema = new Schema(
  {
    title: { type: String, required: true },
    filename: { type: String, required: true },
    path: { type: String, required: true },
    duration: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["processing", "transcribing", "generating", "completed", "error"],
      default: "processing",
    },
    error: { type: String },
    transcript: TranscriptSchema,
    thumbnailUrl: { type: String },
  },
  {
    timestamps: true,
  },
)


export const Video = mongoose.models.Video || mongoose.model<IVideo>("Video", VideoSchema)