from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import uvicorn
import logging
import json
import re
import uuid
from tenacity import retry, stop_after_attempt, wait_fixed
import asyncio

from app.llm_client import generate_mcqs_json_only
from app.utils import segment_text

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


app = FastAPI()

class TranscriptRequest(BaseModel):
    transcript: str

class Option(BaseModel):
    option: str
    value: str

class MCQ(BaseModel):
    id: str
    question: str
    options: List[Option]
    correct_answer: Option


def parse_timestamp(timestamp: str) -> int:
    """Converts 'mm:ss' to seconds"""
    mins, secs = map(int, timestamp.split(":"))
    return mins * 60 + secs

def split_transcript_by_time(transcript: str, chunk_seconds: int = 300) -> List[str]:
    lines = transcript.split("\n")
    entries = []
    current_chunk = []
    current_time = 0
    last_split_time = 0

    for line in lines:
        timestamp_match = re.match(r"^(\d{1,2}:\d{2})$", line.strip())
        if timestamp_match:
            current_time = parse_timestamp(timestamp_match.group(1))
            if current_time - last_split_time >= chunk_seconds:
                if current_chunk:
                    entries.append("\n".join(current_chunk))
                    current_chunk = []
                    last_split_time = current_time
        else:
            current_chunk.append(line)

    if current_chunk:
        entries.append("\n".join(current_chunk))

    return entries

def sanitize_mcq(mcq):
    for opt in mcq.get("options", []):
        if not "option" in opt and any(k.startswith("option") for k in opt):
            key = next(k for k in opt if k.startswith("option"))
            opt["option"] = opt.pop(key)
    return mcq

    
@retry(stop=stop_after_attempt(2), wait=wait_fixed(1))
async def process_chunk(chunk: str, idx: int, transcript_id: str):
    print(f"Processing chunk {idx + 1}")
    mcq_json_str = generate_mcqs_json_only(chunk)  # Call sync function
    mcqs = json.loads(mcq_json_str)
    mcqs = [sanitize_mcq(mcq) for mcq in mcqs]


    if isinstance(mcqs, list) and mcqs and mcqs[0].get("error"):
        raise ValueError(mcqs[0]["message"])
    
    return mcqs

@app.post("/generate-mcqs", response_model=List[MCQ])
async def mcq_endpoint(payload: TranscriptRequest):
    print(payload, "current payload from node js server.")
    try:
        print("Received transcript")

        chunks = split_transcript_by_time(payload.transcript)
        print(f"Total chunks: {len(chunks)}")
        transcript_id = str(uuid.uuid4())

        tasks = [
            process_chunk(chunk, idx, transcript_id)
            for idx, chunk in enumerate(chunks)
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        all_mcqs = []
        for result in results:
            if isinstance(result, Exception):
                print(f"Chunk failed: {result}")
                continue
            all_mcqs.extend(result)

        return all_mcqs

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))