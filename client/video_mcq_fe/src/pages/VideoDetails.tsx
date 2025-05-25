import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import {
  ArrowLeft,
  Download,
  AlertCircle,
  FileText,
  Clock,
} from "lucide-react";
import MCQViewer from "../components/MCQViewer";

interface MCQ {
  id: string;
  question: string;
  options: Array<{
    option: string;
    value: string;
  }>;
  correct_answer: {
    option: string;
    value: string;
  };
}

interface VideoDetails {
  _id: string;
  title: string;
  description?: string;
  filename: string;
  duration: number;
  status: "processing" | "completed" | "error";
  createdAt: string;
  mcqs?: MCQ[];
}

const fetchVideoDetails = async (videoId: string): Promise<VideoDetails> => {
  const response = await fetch(`http://localhost:5000/api/videos/${videoId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch video details");
  }
  return response.json();
};

const VideoDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [showAnswers, setShowAnswers] = useState(false);

  const {
    data: video,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["video", id],
    queryFn: () => fetchVideoDetails(id!),
    enabled: !!id,
    refetchInterval: (data) => {
      // Poll every 5 seconds if still processing
      return data && data?.status === "processing" ? 5000 : false;
    },
  });

  const downloadMCQs = () => {
    if (!video?.mcqs) return;

    const dataStr = JSON.stringify(video.mcqs, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(
      dataStr
    )}`;

    const exportFileDefaultName = `${video.title}-mcqs.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <Skeleton className="h-8 w-64" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="h-[400px] w-full rounded-lg" />
          </div>
          <div>
            <Skeleton className="h-[200px] w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error Loading Video</h2>
        <p className="text-muted-foreground mb-6">
          There was a problem loading this video. Please try again.
        </p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{video.title}</h1>
        <Badge
          variant={
            video.status === "completed"
              ? "default"
              : video.status === "error"
              ? "destructive"
              : "secondary"
          }
        >
          {video.status === "completed"
            ? "Completed"
            : video.status === "error"
            ? "Error"
            : "Processing"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Video Player Placeholder */}
          <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
            <div className="text-white text-center">
              <FileText className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg font-medium">Video Player</p>
              <p className="text-sm opacity-80">
                Video playback would be implemented here
              </p>
            </div>
          </div>

          {/* MCQs Section */}
          {video.status === "completed" &&
            video.mcqs &&
            video.mcqs.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Generated MCQs</CardTitle>
                    <CardDescription>
                      {video.mcqs.length} questions generated from the video
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAnswers(!showAnswers)}
                    >
                      {showAnswers ? "Hide Answers" : "Show Answers"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={downloadMCQs}>
                      <Download className="h-4 w-4 mr-2" />
                      Download JSON
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <MCQViewer mcqs={video.mcqs} showAnswers={showAnswers} />
                </CardContent>
              </Card>
            )}

          {video.status === "processing" && (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Processing Video</h3>
                <p className="text-muted-foreground">
                  Your video is being processed. MCQs will be generated
                  automatically.
                </p>
              </CardContent>
            </Card>
          )}

          {video.status === "error" && (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Processing Error</h3>
                <p className="text-muted-foreground">
                  There was an error processing your video. Please try again.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {/* Video Info */}
          <Card>
            <CardHeader>
              <CardTitle>Video Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Title</p>
                <p className="text-sm text-muted-foreground">{video.title}</p>
              </div>

              {video.description && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Description</p>
                  <p className="text-sm text-muted-foreground">
                    {video.description}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {video.duration
                    ? `${Math.floor(video.duration / 60)} minutes`
                    : "Processing..."}
                </span>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Status</p>
                <Badge
                  variant={
                    video.status === "completed"
                      ? "default"
                      : video.status === "error"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {video.status === "completed"
                    ? "Completed"
                    : video.status === "error"
                    ? "Error"
                    : "Processing"}
                </Badge>
              </div>

              {video.mcqs && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">MCQs Generated</p>
                  <p className="text-sm text-muted-foreground">
                    {video.mcqs.length} questions
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VideoDetails;
