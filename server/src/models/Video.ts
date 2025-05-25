import mongoose, { type Document, Schema } from "mongoose"

export interface IVideo extends Document {
  title: string
  description?: string
  filename: string
  originalName: string
  path: string
  size: number
  duration: number
  status: "processing" | "completed" | "error"
  error?: string
  createdAt: Date
  updatedAt: Date
}

const VideoSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    duration: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["processing", "completed", "error"],
      default: "processing",
    },
    error: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
)

// Change from default export to named export with hot-reload protection
export const Video = mongoose.models.Video || mongoose.model<IVideo>("Video", VideoSchema)