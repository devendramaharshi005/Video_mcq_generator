import { spawn } from "child_process"
import fs from "fs"
import path from "path"

// Get video duration using ffprobe
export const getVideoDuration = (videoPath: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    // Check if ffprobe is available
    const ffprobe = spawn("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      videoPath,
    ])

    let output = ""

    ffprobe.stdout.on("data", (data) => {
      output += data.toString()
    })

    ffprobe.stderr.on("data", (data) => {
      console.error(`ffprobe error: ${data}`)
    })

    ffprobe.on("close", (code) => {
      if (code === 0) {
        const duration = Number.parseFloat(output.trim())
        resolve(duration)
      } else {
        // If ffprobe fails, return a default duration
        console.warn("ffprobe not available, using default duration")
        resolve(3600) // Default to 1 hour
      }
    })
  })
}

// Generate thumbnail for a video
export const generateThumbnail = (videoPath: string, outputPath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Create directory if it doesn't exist
    const dir = path.dirname(outputPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    // Check if ffmpeg is available
    const ffmpeg = spawn("ffmpeg", [
      "-i",
      videoPath,
      "-ss",
      "00:00:05", // Take frame at 5 seconds
      "-vframes",
      "1",
      "-vf",
      "scale=640:-1",
      outputPath,
    ])

    ffmpeg.stderr.on("data", (data) => {
      console.error(`ffmpeg error: ${data}`)
    })

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve(outputPath)
      } else {
        // If ffmpeg fails, create a default thumbnail
        console.warn("ffmpeg not available, creating default thumbnail")
        createDefaultThumbnail(outputPath)
          .then(() => resolve(outputPath))
          .catch(reject)
      }
    })
  })
}

// Create a default thumbnail if ffmpeg is not available
const createDefaultThumbnail = (outputPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // Create a simple SVG as default thumbnail
      const svgContent = `
        <svg width="640" height="360" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#1e293b"/>
          <text x="50%" y="50%" font-family="Arial" font-size="24" fill="white" text-anchor="middle">
            Video Thumbnail
          </text>
        </svg>
      `

      fs.writeFileSync(outputPath, svgContent)
      resolve()
    } catch (error) {
      reject(error)
    }
  })
}
