import json
import httpx
from typing import List, Dict, Any
import time
import logging

# Set up logging for debugging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants
OLLAMA_URL = "http://localhost:11434/api/chat"
GENERATE_URL = "http://localhost:11434/api/generate"  # Alternative endpoint
TIMEOUT = 240.0

# HTTP client with retries
_client = httpx.Client(
    timeout=TIMEOUT,
    limits=httpx.Limits(max_keepalive_connections=5, max_connections=10)
)

# Simple and direct system prompt
SYSTEM_PROMPT = """Generate only 2 multiple choice questions from this transcript. Return ONLY valid JSON array format:
[{"id":"q1","question":"Your question here?","options":[{"option":"A","value":"Answer A"},{"option":"B","value":"Answer B"},{"option":"C","value":"Answer C"},{"option":"D","value":"Answer D"}],"correct_answer":{"option":"A","value":"Answer A"}}]"""

def test_ollama_connection() -> bool:
    """Test if Ollama is running and accessible"""
    try:
        response = _client.get("http://localhost:11434/api/tags", timeout=10)
        logger.info(f"Ollama connection test: {response.status_code}")
        return response.status_code == 200
    except Exception as e:
        logger.error(f"Ollama connection failed: {e}")
        return False

def generate_mcqs_chat_api(transcript: str) -> List[Dict[str, Any]]:
    """Use the chat API endpoint"""
    try:
        if not test_ollama_connection():
            raise RuntimeError("Ollama server is not accessible at localhost:11434")
        
        messages = [
            # {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Transcript: {transcript}"}
        ]
        
        payload = {
            "model": "mcq-fast:latest",
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": 0.3,
                "num_predict": 1500
            }
        }
        
        logger.info("Sending request to Ollama chat API...")
        response = _client.post(OLLAMA_URL, json=payload)
        
        logger.info(f"Response status: {response.status_code}")
        logger.info(f"Response headers: {dict(response.headers)}")
        
        if response.status_code != 200:
            raise RuntimeError(f"HTTP {response.status_code}: {response.text}")
        
        data = response.json()
        logger.info(f"Response structure keys: {list(data.keys())}")
        
        # Extract content from response
        content = None
        if "message" in data and "content" in data["message"]:
            content = data["message"]["content"]
        elif "response" in data:
            content = data["response"]
        
        if not content:
            raise RuntimeError(f"No content found in response: {data}")
        
        logger.info(f"Raw content: {content[:200]}...")
        return parse_json_content(content)
        
    except httpx.RequestError as e:
        raise RuntimeError(f"Network error: {e}")
    except Exception as e:
        raise RuntimeError(f"Chat API error: {e}")

def generate_mcqs_generate_api(transcript: str) -> List[Dict[str, Any]]:
    """Fallback to generate API endpoint"""
    try:
        prompt = f"{SYSTEM_PROMPT}\n\nTranscript: {transcript}\n\nJSON Response:"
        
        payload = {
            "model": "mcq-fast:latest",
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.3,
                "num_predict": 1500
            }
        }
        
        logger.info("Trying generate API endpoint...")
        response = _client.post(GENERATE_URL, json=payload)
        
        if response.status_code != 200:
            raise RuntimeError(f"HTTP {response.status_code}: {response.text}")
        
        data = response.json()
        content = data.get("response", "")
        
        if not content:
            raise RuntimeError(f"No response content: {data}")
        
        logger.info(f"Generate API content: {content[:200]}...")
        return parse_json_content(content)
        
    except Exception as e:
        raise RuntimeError(f"Generate API error: {e}")

def parse_json_content(content: str) -> List[Dict[str, Any]]:
    """Parse JSON content with multiple fallback strategies"""
    content = content.strip()
    
    # Remove markdown code blocks
    if "```" in content:
        lines = content.split('\n')
        json_lines = []
        in_code_block = False
        
        for line in lines:
            if line.strip().startswith("```"):
                in_code_block = not in_code_block
                continue
            if in_code_block or line.strip().startswith('[') or line.strip().startswith('{'):
                json_lines.append(line)
        
        content = '\n'.join(json_lines)
    
    # Find JSON array or object
    start_idx = content.find('[')
    if start_idx == -1:
        start_idx = content.find('{')
    
    if start_idx != -1:
        content = content[start_idx:]
        
        # Find the end of JSON
        bracket_count = 0
        end_idx = -1
        
        for i, char in enumerate(content):
            if char in '[{':
                bracket_count += 1
            elif char in ']}':
                bracket_count -= 1
                if bracket_count == 0:
                    end_idx = i + 1
                    break
        
        if end_idx != -1:
            content = content[:end_idx]
    
    try:
        parsed = json.loads(content)
        if isinstance(parsed, dict):
            return [parsed]
        elif isinstance(parsed, list):
            return parsed
        else:
            raise ValueError("Parsed content is neither dict nor list")
    except json.JSONDecodeError as e:
        raise RuntimeError(f"JSON parsing failed: {e}\nContent: {content}")

def generate_mcqs(transcript: str) -> List[Dict[str, Any]]:
    """Main function to generate MCQs with fallback strategies"""
    if not transcript or not transcript.strip():
        raise ValueError("Transcript cannot be empty")
    
    # Try chat API first
    try:
        return generate_mcqs_chat_api(transcript)
    except Exception as e:
        logger.warning(f"Chat API failed: {e}")
    
    # Fallback to generate API
    try:
        return generate_mcqs_generate_api(transcript)
    except Exception as e:
        logger.warning(f"Generate API failed: {e}")
        raise RuntimeError(f"Both API endpoints failed. Last error: {e}")

def generate_mcqs_json_only(transcript: str) -> str:
    """Generate MCQs and return only JSON string output with detailed error info"""
    try:
        mcqs = generate_mcqs(transcript)
        return json.dumps(mcqs, indent=2, ensure_ascii=False)
    except Exception as e:
        logger.error(f"Error generating MCQs: {e}")
        error_response = [{
            "error": True,
            "message": str(e),
            "timestamp": time.time(),
            "ollama_accessible": test_ollama_connection(),
            "transcript_length": len(transcript) if transcript else 0
        }]
        return json.dumps(error_response, indent=2)

def cleanup():
    """Close the HTTP client"""
    _client.close()