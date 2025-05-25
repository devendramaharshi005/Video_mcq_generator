"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { useDropzone } from "react-dropzone"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Progress } from "../components/ui/progress"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../components/ui/form"
import { FileVideo, Upload, X } from "lucide-react"
import { useToast } from "../components/ui/use-toast"

const uploadSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().optional(),
})

type UploadFormData = z.infer<typeof uploadSchema>

const VideoUpload = () => {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const { toast } = useToast()
  const navigate = useNavigate()

  const form = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  })

  const uploadMutation = useMutation({
    mutationFn: async (data: { file: File; title: string; description?: string }) => {
      const formData = new FormData()
      formData.append("video", data.file)
      formData.append("title", data.title)
      if (data.description) {
        formData.append("description", data.description)
      }

      return new Promise<{ videoId: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100)
            setUploadProgress(progress)
          }
        })

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText))
          } else {
            reject(new Error(xhr.statusText || "Upload failed"))
          }
        }

        xhr.onerror = () => reject(new Error("Network error"))

        xhr.open("POST", "http://localhost:5000/api/videos/upload")
        xhr.send(formData)
      })
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: "Your video has been uploaded successfully.",
      })
      navigate(`/video/${data.videoId}`)
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      })
      setUploadProgress(0)
    },
  })

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setSelectedFile(file)
      // Auto-fill title from filename
      const fileName = file.name.replace(/\.[^/.]+$/, "")
      form.setValue("title", fileName)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "video/mp4": [".mp4"],
    },
    maxFiles: 1,
    maxSize: 500 * 1024 * 1024, // 500MB
  })

  const onSubmit = (data: UploadFormData) => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a video file to upload.",
        variant: "destructive",
      })
      return
    }

    uploadMutation.mutate({
      file: selectedFile,
      title: data.title,
      description: data.description,
    })
  }

  const removeFile = () => {
    setSelectedFile(null)
    setUploadProgress(0)
    form.reset()
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Upload Video</h1>

      <Card>
        <CardHeader>
          <CardTitle>Upload a Video</CardTitle>
          <CardDescription>Upload an MP4 video file to generate MCQs automatically.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {!selectedFile ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragActive ? "border-primary bg-primary/10" : "border-muted-foreground/25 hover:bg-muted/50"
              }`}
            >
              <input {...getInputProps()} />
              <FileVideo className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-1">
                {isDragActive ? "Drop the video here" : "Drag and drop or click to upload"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">MP4 files only (max 500MB)</p>
              <Button type="button" variant="secondary">
                <Upload className="h-4 w-4 mr-2" />
                Select Video
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <FileVideo className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium line-clamp-1">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={removeFile}
                  disabled={uploadMutation.isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {uploadProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter video title" {...field} disabled={uploadMutation.isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter video description" {...field} disabled={uploadMutation.isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                  disabled={uploadMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={!selectedFile || uploadMutation.isPending} className="min-w-[120px]">
                  {uploadMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Uploading
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Upload Video
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

export default VideoUpload
