import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group"
import { Label } from "../components/ui/label"
import { Badge } from "../components/ui/badge"
import { CheckCircle, X, RotateCcw } from "lucide-react"

interface MCQ {
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
}

interface MCQViewerProps {
  mcqs: MCQ[]
  showAnswers: boolean
}

const MCQViewer = ({ mcqs, showAnswers }: MCQViewerProps) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [quizMode, setQuizMode] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const handleAnswerSelect = (questionId: string, option: string) => {
    if (showAnswers && !quizMode) return // Prevent selection when answers are shown

    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }))
  }

  const startQuiz = () => {
    setQuizMode(true)
    setShowResults(false)
    setSelectedAnswers({})
  }

  const submitQuiz = () => {
    setShowResults(true)
  }

  const resetQuiz = () => {
    setQuizMode(false)
    setShowResults(false)
    setSelectedAnswers({})
  }

  const calculateScore = () => {
    let correct = 0
    mcqs.forEach((mcq) => {
      if (selectedAnswers[mcq.id] === mcq.correct_answer.option) {
        correct++
      }
    })
    return { correct, total: mcqs.length, percentage: Math.round((correct / mcqs.length) * 100) }
  }

  const { correct, total, percentage } = showResults ? calculateScore() : { correct: 0, total: 0, percentage: 0 }

  return (
    <div className="space-y-6">
      {/* Quiz Controls */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {!quizMode && (
            <Button onClick={startQuiz} variant="default">
              Start Quiz
            </Button>
          )}
          {quizMode && !showResults && (
            <Button onClick={submitQuiz} disabled={Object.keys(selectedAnswers).length !== mcqs.length}>
              Submit Quiz
            </Button>
          )}
          {(quizMode || showResults) && (
            <Button onClick={resetQuiz} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
        </div>

        {showResults && (
          <div className="text-right">
            <div className="text-2xl font-bold">{percentage}%</div>
            <div className="text-sm text-muted-foreground">
              {correct} out of {total} correct
            </div>
          </div>
        )}
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {mcqs.map((mcq, index) => {
          const isCorrect = showResults && selectedAnswers[mcq.id] === mcq.correct_answer.option
          const isIncorrect =
            showResults && selectedAnswers[mcq.id] && selectedAnswers[mcq.id] !== mcq.correct_answer.option

          return (
            <Card key={mcq.id} className={`${isCorrect ? "border-green-500" : isIncorrect ? "border-red-500" : ""}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">
                    {index + 1}. {mcq.question}
                  </CardTitle>
                  {showResults && (
                    <Badge variant={isCorrect ? "default" : isIncorrect ? "destructive" : "secondary"}>
                      {isCorrect ? "Correct" : isIncorrect ? "Incorrect" : "Not Answered"}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={selectedAnswers[mcq.id] || ""}
                  onValueChange={(value) => handleAnswerSelect(mcq.id, value)}
                  disabled={showAnswers && !quizMode}
                >
                  {mcq.options.map((option) => {
                    const isSelected = selectedAnswers[mcq.id] === option.option
                    const isCorrectOption = option.option === mcq.correct_answer.option
                    const showCorrectAnswer = (showAnswers && !quizMode) || showResults

                    return (
                      <div key={option.option} className="flex items-center space-x-2">
                        <RadioGroupItem
                          value={option.option}
                          id={`${mcq.id}-${option.option}`}
                          disabled={showAnswers && !quizMode}
                        />
                        <Label
                          htmlFor={`${mcq.id}-${option.option}`}
                          className={`flex-1 flex items-center justify-between cursor-pointer ${
                            showCorrectAnswer && isCorrectOption
                              ? "text-green-600 font-medium"
                              : showResults && isSelected && !isCorrectOption
                                ? "text-red-600"
                                : ""
                          }`}
                        >
                          <span>
                            {option.option}. {option.value}
                          </span>
                          {showCorrectAnswer && isCorrectOption && <CheckCircle className="h-4 w-4 text-green-600" />}
                          {showResults && isSelected && !isCorrectOption && <X className="h-4 w-4 text-red-600" />}
                        </Label>
                      </div>
                    )
                  })}
                </RadioGroup>

                {showAnswers && !quizMode && (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">Correct Answer:</p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {mcq.correct_answer.option}. {mcq.correct_answer.value}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default MCQViewer
