from typing import List

def segment_text(transcript: str, chunk_duration: int = 5) -> List[str]:
    """
    Splits the transcript into chunks of approximately 700 words each.
    The chunk_duration parameter is ignored in this simulation.
    """
    words = transcript.split()
    chunk_size = 700  # Simulating 5-min chunks as 700 words
    return [" ".join(words[i:i + chunk_size]) for i in range(0, len(words), chunk_size)]
