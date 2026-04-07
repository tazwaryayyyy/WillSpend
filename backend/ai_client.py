import os
import time
import hashlib
import logging
from typing import Optional, Dict, Any
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Simple in-memory cache with TTL
class SimpleCache:
    def __init__(self, ttl_seconds: int = 300):
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.ttl = ttl_seconds
    
    def get(self, key: str) -> Optional[str]:
        if key in self.cache:
            data = self.cache[key]
            if time.time() - data['timestamp'] < self.ttl:
                return data['value']
            else:
                del self.cache[key]
        return None
    
    def set(self, key: str, value: str) -> None:
        self.cache[key] = {
            'value': value,
            'timestamp': time.time()
        }

# Global cache instance
cache = SimpleCache(ttl_seconds=300)  # 5 minutes TTL

def get_cache_key(prompt: str, context: str = "") -> str:
    """Generate a cache key from prompt and context."""
    combined = f"{prompt}|{context}"
    return hashlib.md5(combined.encode()).hexdigest()

def retry_with_backoff(func, max_retries: int = 3, base_delay: float = 1.0):
    """Retry function with exponential backoff."""
    for attempt in range(max_retries):
        try:
            return func()
        except Exception as e:
            if attempt == max_retries - 1:
                raise e
            
            delay = base_delay * (2 ** attempt)
            logger.warning(f"Attempt {attempt + 1} failed, retrying in {delay}s: {str(e)}")
            time.sleep(delay)

def call_groq_api(prompt: str) -> str:
    """Call Groq API."""
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable is required")
    
    client = Groq(api_key=api_key)
    
    def make_request():
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=600,
            temperature=0.7
        )
        return response.choices[0].message.content
    
    return retry_with_backoff(make_request)

def get_ai_response(prompt: str, context: str = "") -> str:
    """
    Get AI response from Groq API with caching and retry logic.
    
    Args:
        prompt: The prompt to send to the AI
        context: Optional context to include in cache key
    
    Returns:
        AI response string
    """
    # Check cache first
    cache_key = get_cache_key(prompt, context)
    cached_response = cache.get(cache_key)
    if cached_response:
        logger.info("Returning cached AI response")
        return cached_response
    
    try:
        logger.info("Using Groq provider")
        response = call_groq_api(prompt)
        
        # Cache the response
        cache.set(cache_key, response)
        return response
        
    except Exception as e:
        logger.error(f"AI provider error: {str(e)}")
        
        # Fallback response
        fallback = "Our AI is temporarily unavailable. Here's a typical insight: delaying savings by one year can cost you 6% of your principal in lost compound interest."
        return fallback

def get_current_ai_provider() -> str:
    """Get the currently configured AI provider."""
    return "groq"
