# 🎥 Video to MCQs Generator

An AI-powered full-stack application to automatically convert educational videos/ podcasts into MCQs using transcript generation and LLM-based question synthesis.

## 🎥 Video Demos

### 🔹 Output Samples
- [Wildfire Video Generated MCQs](videos_and_results/output_samples/wildfire_video_generated_mcqs.mp4)
- [JS Lecture Transcript + MCQ](videos_and_results/output_samples/transcript_for_js_lecture_as_well_mcq_processing.mp4)
- [MongoDB Entries with MCQs](videos_and_results/output_samples/mongo_database_entries_with_transcripts_and_mcqs.mp4)
- [India Mountain Ranges Explained](videos_and_results/output_samples/india_mountain_ranges_explained..mp4)

### 🔹 Input Videos
- [Mountain Ranges of India](videos_and_results/input_videos/All%20Important%20Mountain%20Ranges%20of%20India%20in%201%20Video%20_%20SMART%20Revision%20through%20Animation%20_%20UPSC%202023-24.mp4)
- [JavaScript Promises in 10 Minutes](videos_and_results/input_videos/JavaScript%20Promises%20In%2010%20Minutes.mp4)
- [Canadian Wildfires (June 2023)](videos_and_results/input_videos/20230607_me_canadian_wildfires.mp4) (audio only .mp4 file for fast mcq generation.)


## 🚀 Tech Stack

### 🖥️ Frontend

- React (Vite)
- Typescript
- Shedcn
- TailwindCSS
- Axios for API calls
- React Query for caching and retry logics

### 🧠 Backend

- Node.js + Express
- MongoDB (with Mongoose ORM)
- FastAPI (LLM integration for MCQ generation)
- used `model`/`routes`/`controllers`/`services` for code management and redablity.

### 🛠️ Services

- **AssemblyAI** – for speech-to-text transcription
- **Ollama** – for generating MCQs using LLM (offline/local)

## Run Poject

## ▶️ Run Project

### 🧠 1. Run the FastAPI Service (MCQ Generator)

```bash
cd pyservice
pip install -r requirements.txt
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Ensure ollama is running locally and the appropriate model (e.g., llama3) is pulled.

🌐 2. Start the React Frontend

```bash
cd client/video_mcq_fe
npm install
npm run dev
```

🖥️ 3. Start the Express Backend Server

*Note* : Make sure mongodb is up and running.

```bash
cd server
npm install
npm run dev
```

## Appliations Dependencies :

These are the following dependencies for running this project:

1. Docker installation.
2. Mongo image up and running inside docker.
3. Ollama desktop installed.
4. Assembly ai api free account for transcription speed and accuracy.

## 📂 Project Structure

```bash
video_project/
├── client/
├── server/
├── pyservice          # FastAPI MCQ generator using Ollama
└── README.md
```

### MongoDB Docker Setup

This project sets up a MongoDB container using Docker and makes it accessible at [`http://localhost:27017/`](http://localhost:27017/).

#### 🐳 Requirements

- [Docker](https://docs.docker.com/get-docker/) installed on your machine

#### 🚀 Getting Started

#### 1. pull a Mongo image using command

```bash
docker pull mongo
```

#### 2. Run MongoDB in a Docker container

Use the following command to run MongoDB and expose it on port `27017`:

```bash
docker run -d --name mongo -p 27017:27017 mongo
```

varify the container is running on the [`http://localhost:27017`](http://localhost:27017).

### Ollama desktop installation for windows.

download ollama for windows : `https://ollama.com/download`

#### 🚀 Getting Started

create a custom model using ollama named : `mcq-fast:latest`

```cmd
PS C:\Users\DevendraMaharshi> ollama list
NAME               ID              SIZE      MODIFIED
mcq-fast:latest    ef655f9652d0    2.2 GB    20 hours ago
phi3:mini          4f2222927938    2.2 GB    21 hours ago
mistral:7b         f974a74358d6    4.1 GB    2 days ago
```

I have used `phi3:mini` for creating custom model by using some system prompt listed in the file `mcq-generator.modelfile`.

##### steps :

1. Go to the directory where `mcq-generator.modelfile` is present.

2. Run command

```bash
ollama create mcq-fast -f mcq-generator.modelfile
```

Question: why choosed `phi3:mini`?

answer: faster than mistral, lightweight and accurate for mcq generation.
