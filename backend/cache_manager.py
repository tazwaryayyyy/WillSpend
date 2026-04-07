import time
import hashlib
import json
import logging
from typing import Any, Dict, Optional
from functools import wraps

logger = logging.getLogger(__name__)

class TTLCache:
    """Simple in-memory cache with TTL support."""
    
    def __init__(self, ttl_seconds: int = 600):
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.ttl = ttl_seconds
        self.hits = 0
        self.misses = 0
    
    def get(self, key: str) -> Optional[Any]:
        """Get item from cache if not expired."""
        if key in self.cache:
            data = self.cache[key]
            if time.time() - data['timestamp'] < self.ttl:
                self.hits += 1
                logger.debug(f"Cache hit for key: {key}")
                return data['value']
            else:
                del self.cache[key]
        
        self.misses += 1
        logger.debug(f"Cache miss for key: {key}")
        return None
    
    def set(self, key: str, value: Any) -> None:
        """Set item in cache with current timestamp."""
        self.cache[key] = {
            'value': value,
            'timestamp': time.time()
        }
        logger.debug(f"Cache set for key: {key}")
    
    def clear(self) -> None:
        """Clear all cache entries."""
        self.cache.clear()
        logger.info("Cache cleared")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        total_requests = self.hits + self.misses
        hit_rate = (self.hits / total_requests * 100) if total_requests > 0 else 0
        return {
            'hits': self.hits,
            'misses': self.misses,
            'hit_rate_percent': round(hit_rate, 2),
            'cache_size': len(self.cache),
            'ttl_seconds': self.ttl
        }

# Global cache instances
simulation_cache = TTLCache(ttl_seconds=600)  # 10 minutes for simulations
ai_cache = TTLCache(ttl_seconds=300)  # 5 minutes for AI responses

def generate_cache_key(*args, **kwargs) -> str:
    """Generate a consistent cache key from function arguments."""
    # Convert all arguments to a serializable format
    serializable_args = []
    for arg in args:
        if hasattr(arg, 'dict'):  # Pydantic model
            serializable_args.append(arg.dict())
        elif hasattr(arg, '__dict__'):  # Object
            serializable_args.append(str(arg))
        else:  # Primitive
            serializable_args.append(arg)
    
    # Convert kwargs to sorted dict for consistency
    serializable_kwargs = {}
    for k, v in sorted(kwargs.items()):
        if hasattr(v, 'dict'):  # Pydantic model
            serializable_kwargs[k] = v.dict()
        elif hasattr(v, '__dict__'):  # Object
            serializable_kwargs[k] = str(v)
        else:  # Primitive
            serializable_kwargs[k] = v
    
    # Create hash from combined arguments
    combined = {
        'args': serializable_args,
        'kwargs': serializable_kwargs
    }
    key_string = json.dumps(combined, sort_keys=True, default=str)
    return hashlib.md5(key_string.encode()).hexdigest()

def cached_simulation(ttl_seconds: int = 600):
    """Decorator for caching simulation results."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            cache_key = generate_cache_key(*args, **kwargs)
            
            # Try to get from cache
            cached_result = simulation_cache.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            # Execute function and cache result
            result = func(*args, **kwargs)
            simulation_cache.set(cache_key, result)
            return result
        
        return wrapper
    return decorator

def cached_ai_call(ttl_seconds: int = 300):
    """Decorator for caching AI responses."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            cache_key = generate_cache_key(*args, **kwargs)
            
            # Try to get from cache
            cached_result = ai_cache.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            # Execute function and cache result
            result = func(*args, **kwargs)
            ai_cache.set(cache_key, result)
            return result
        
        return wrapper
    return decorator

def get_cache_stats() -> Dict[str, Any]:
    """Get statistics for all caches."""
    return {
        'simulation_cache': simulation_cache.get_stats(),
        'ai_cache': ai_cache.get_stats()
    }

def clear_all_caches() -> None:
    """Clear all caches."""
    simulation_cache.clear()
    ai_cache.clear()
