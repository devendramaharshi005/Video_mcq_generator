import { v4 as uuidv4 } from "uuid"

interface MCQOption {
  option: string
  value: string
}

interface MCQ {
  videoId: string
  id: string
  question: string
  options: MCQOption[]
  correct_answer: {
    option: string
    value: string
  }
}

const sampleQuestions = [
  {
    question: "What is the main topic discussed in this video?",
    options: [
      "Machine Learning fundamentals",
      "Data Science applications",
      "Software Development practices",
      "Business Analytics",
    ],
  },
  {
    question: "Which concept was emphasized as most important?",
    options: ["Data preprocessing", "Model validation", "Feature engineering", "Algorithm selection"],
  },
  {
    question: "What tool was recommended for beginners?",
    options: ["Python", "R", "SQL", "Excel"],
  },
  {
    question: "According to the video, what is the first step in any data project?",
    options: ["Understanding the problem", "Collecting data", "Choosing algorithms", "Building visualizations"],
  },
  {
    question: "Which metric was mentioned for evaluating model performance?",
    options: ["Accuracy", "Precision", "Recall", "F1-Score"],
  },
]

export const generateMockMCQs = (videoId: string, videoTitle: string): MCQ[] => {
  const numQuestions = Math.floor(Math.random() * 3) + 3 // 3-5 questions

  return Array.from({ length: numQuestions }, (_, index) => {
    const questionTemplate = sampleQuestions[index % sampleQuestions.length]
    const correctIndex = Math.floor(Math.random() * 4)

    const options: MCQOption[] = questionTemplate.options.map((option, idx) => ({
      option: String.fromCharCode(65 + idx), // A, B, C, D
      value: option,
    }))

    return {
      videoId,
      id: uuidv4(),
      question: `${questionTemplate.question} (Based on "${videoTitle}")`,
      options,
      correct_answer: {
        option: options[correctIndex].option,
        value: options[correctIndex].value,
      },
    }
  })
}
