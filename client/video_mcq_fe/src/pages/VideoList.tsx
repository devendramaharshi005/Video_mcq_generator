import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Skeleton } from "../components/ui/skeleton"
import { Badge } from "../components/ui/badge"
import { FileVideo, Clock, FileText, AlertCircle, Play } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Video {
  _id: string
  title: string
  description?: string
  filename: string
  duration: number
  status: "processing" | "completed" | "error"
  createdAt: string
  mcqCount?: number
}

const fetchVideos = async (): Promise<Video[]> => {
  const response = await fetch("http://localhost:5000/api/videos")
  if (!response.ok) {
    throw new Error("Failed to fetch videos")
  }
  return response.json()
}

const VideoList = () => {
  const {
    data: videos,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["videos"],
    queryFn: fetchVideos,
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Your Videos</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="p-0">
                <Skeleton className="h-48 w-full" />
              </CardHeader>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error Loading Videos</h2>
        <p className="text-muted-foreground mb-6">There was a problem loading your videos. Please try again.</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Your Videos</h1>
        <Link to="/upload">
          <Button>Upload New Video</Button>
        </Link>
      </div>

      {videos && videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-muted/20">
          <FileVideo className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Videos Yet</h2>
          <p className="text-muted-foreground mb-6">Upload your first video to get started with MCQ generation.</p>
          <Link to="/upload">
            <Button>Upload Video</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos?.map((video) => (
            <Card key={video._id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="p-0">
                <div className="h-48 w-full bg-muted flex items-center justify-center">
                  <FileVideo className="h-12 w-12 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <CardTitle className="mb-2 line-clamp-2">{video.title}</CardTitle>
                {video.description && (
                  <CardDescription className="mb-2 line-clamp-2">{video.description}</CardDescription>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {video.duration ? `${Math.floor(video.duration / 60)} min` : "Processing..."}
                </div>
              </CardContent>
              <CardFooter className="px-6 pb-6 pt-0 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      video.status === "completed" ? "default" : video.status === "error" ? "destructive" : "secondary"
                    }
                  >
                    {video.status === "completed" ? "Ready" : video.status === "error" ? "Error" : "Processing"}
                  </Badge>
                  {video.status === "completed" && video.mcqCount && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      {video.mcqCount} MCQs
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}
                  </span>
                  <Link to={`/video/${video._id}`}>
                    <Button size="sm" variant="outline">
                      <Play className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </Link>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default VideoList
