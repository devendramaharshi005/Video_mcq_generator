import mongoose, { type Document, Schema } from "mongoose"

export interface IMCQ extends Document {
  videoId: mongoose.Types.ObjectId
  id: string
  question: string
  options: Array<{
    option: string
    value: string
  }>
  correct_answer: {
    option: string
    value: string
  }
  createdAt: Date
  updatedAt: Date
}

const MCQSchema = new Schema(
  {
    videoId: {
      type: Schema.Types.ObjectId,
      ref: "Video",
      required: true,
    },
    id: {
      type: String,
      required: true,
      unique: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    options: [
      {
        option: {
          type: String,
          required: true,
        },
        value: {
          type: String,
          required: true,
        },
      },
    ],
    correct_answer: {
      option: {
        type: String,
        required: true,
      },
      value: {
        type: String,
        required: true,
      },
    },
  },
  {
    timestamps: true,
  },
)

// Index for efficient queries
MCQSchema.index({ videoId: 1 })

export default mongoose.model<IMCQ>("MCQ", MCQSchema)
