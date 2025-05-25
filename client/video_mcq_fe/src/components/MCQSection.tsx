import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Button } from "./ui/button";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import { Download, CheckCircle, X } from "lucide-react";
import { formatDuration } from "../lib/utils";

interface Question {
  id: string;
  question: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
}

interface Segment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  questions: Question[];
}

interface MCQSectionProps {
  segments: Segment[];
  videoId: string;
}

const MCQSection = ({ segments, videoId }: MCQSectionProps) => {
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});
  const [showResults, setShowResults] = useState(false);
  const [activeSegment, setActiveSegment] = useState<string | null>(
    segments[0]?.id || null
  );

  const handleAnswerSelect = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const checkAnswers = () => {
    setShowResults(true);
  };

  const resetAnswers = () => {
    setSelectedAnswers({});
    setShowResults(false);
  };

  const calculateScore = () => {
    let correct = 0;
    let total = 0;

    segments.forEach((segment) => {
      segment.questions.forEach((question) => {
        total++;
        if (selectedAnswers[question.id] === question.correctOptionId) {
          correct++;
        }
      });
    });

    return { correct, total, percentage: Math.round((correct / total) * 100) };
  };

  const { correct, total, percentage } = calculateScore();

  const exportMCQs = () => {
    const mcqData = segments.map((segment) => ({
      segmentId: segment.id,
      startTime: segment.startTime,
      endTime: segment.endTime,
      questions: segment.questions,
    }));

    const dataStr = JSON.stringify(mcqData, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(
      dataStr
    )}`;

    const exportFileDefaultName = `${videoId}-mcqs.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Multiple Choice Questions</CardTitle>
          <CardDescription>
            Auto-generated questions for each 5-minute segment
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={exportMCQs}>
          <Download className="h-4 w-4 mr-2" />
          Export MCQs
        </Button>
      </CardHeader>

      <CardContent>
        {showResults && (
          <div className="mb-6 p-4 rounded-lg bg-muted">
            <h3 className="text-lg font-medium mb-2">Quiz Results</h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-3xl font-bold">{percentage}%</div>
              <div>
                <p className="text-sm text-muted-foreground">
                  You got <span className="font-medium">{correct}</span> out of{" "}
                  <span className="font-medium">{total}</span> questions correct
                </p>
              </div>
            </div>
            <Button onClick={resetAnswers} variant="outline">
              Try Again
            </Button>
          </div>
        )}

        <Tabs defaultValue="segments" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="segments">By Segment</TabsTrigger>
            <TabsTrigger value="all">All Questions</TabsTrigger>
          </TabsList>

          <TabsContent value="segments" className="mt-4">
            <Accordion
              type="single"
              collapsible
              value={activeSegment || undefined}
              onValueChange={(value) => setActiveSegment(value)}
              className="w-full"
            >
              {segments.map((segment, index) => (
                <AccordionItem key={segment.id} value={segment.id}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <span>Segment {index + 1}</span>
                      <span className="text-sm text-muted-foreground">
                        {formatDuration(segment.startTime)} -{" "}
                        {formatDuration(segment.endTime)}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-8 py-2">
                      {segment.questions.map((question, qIndex) => (
                        <div key={question.id} className="space-y-4">
                          <h3 className="font-medium">
                            {qIndex + 1}. {question.question}
                          </h3>

                          <RadioGroup
                            value={selectedAnswers[question.id] || ""}
                            onValueChange={(value) =>
                              handleAnswerSelect(question.id, value)
                            }
                          >
                            {question.options.map((option) => (
                              <div
                                key={option.id}
                                className="flex items-center space-x-2"
                              >
                                <RadioGroupItem
                                  value={option.id}
                                  id={`${question.id}-${option.id}`}
                                  disabled={showResults}
                                />
                                <Label
                                  htmlFor={`${question.id}-${option.id}`}
                                  className={`flex items-center ${
                                    showResults &&
                                    option.id === question.correctOptionId
                                      ? "text-green-600 font-medium"
                                      : showResults &&
                                        selectedAnswers[question.id] ===
                                          option.id &&
                                        option.id !== question.correctOptionId
                                      ? "text-red-600 line-through"
                                      : ""
                                  }`}
                                >
                                  {option.text}
                                  {showResults &&
                                    option.id === question.correctOptionId && (
                                      <CheckCircle className="h-4 w-4 ml-2 text-green-600" />
                                    )}
                                  {showResults &&
                                    selectedAnswers[question.id] ===
                                      option.id &&
                                    option.id !== question.correctOptionId && (
                                      <X className="h-4 w-4 ml-2 text-red-600" />
                                    )}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>

          <TabsContent value="all" className="mt-4">
            <div className="space-y-12">
              {segments.flatMap((segment, segmentIndex) =>
                segment.questions.map((question, questionIndex) => {
                  const globalIndex =
                    segments
                      .slice(0, segmentIndex)
                      .reduce((acc, s) => acc + s.questions.length, 0) +
                    questionIndex +
                    1;

                  return (
                    <div
                      key={question.id}
                      className="space-y-4 pb-6 border-b last:border-0"
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium">
                          {globalIndex}. {question.question}
                        </h3>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          Segment {segmentIndex + 1}:{" "}
                          {formatDuration(segment.startTime)} -{" "}
                          {formatDuration(segment.endTime)}
                        </span>
                      </div>

                      <RadioGroup
                        value={selectedAnswers[question.id] || ""}
                        onValueChange={(value) =>
                          handleAnswerSelect(question.id, value)
                        }
                      >
                        {question.options.map((option) => (
                          <div
                            key={option.id}
                            className="flex items-center space-x-2"
                          >
                            <RadioGroupItem
                              value={option.id}
                              id={`all-${question.id}-${option.id}`}
                              disabled={showResults}
                            />
                            <Label
                              htmlFor={`all-${question.id}-${option.id}`}
                              className={`flex items-center ${
                                showResults &&
                                option.id === question.correctOptionId
                                  ? "text-green-600 font-medium"
                                  : showResults &&
                                    selectedAnswers[question.id] ===
                                      option.id &&
                                    option.id !== question.correctOptionId
                                  ? "text-red-600 line-through"
                                  : ""
                              }`}
                            >
                              {option.text}
                              {showResults &&
                                option.id === question.correctOptionId && (
                                  <CheckCircle className="h-4 w-4 ml-2 text-green-600" />
                                )}
                              {showResults &&
                                selectedAnswers[question.id] === option.id &&
                                option.id !== question.correctOptionId && (
                                  <X className="h-4 w-4 ml-2 text-red-600" />
                                )}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-8 flex justify-end gap-4">
          {showResults ? (
            <Button onClick={resetAnswers} variant="outline">
              Try Again
            </Button>
          ) : (
            <Button onClick={checkAnswers}>Check Answers</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MCQSection;
