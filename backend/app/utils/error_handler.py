"""
Error handling utilities for graceful recovery from API errors.
"""
import asyncio
import logging
from typing import Any, Callable, Optional
from functools import wraps

logger = logging.getLogger(__name__)

class TokenExhaustedError(Exception):
    """Raised when token limit is exceeded"""
    def __init__(self, message: str, retry_after: Optional[int] = None):
        super().__init__(message)
        self.retry_after = retry_after

class RateLimitError(Exception):
    """Raised when rate limit is exceeded"""
    def __init__(self, message: str, retry_after: Optional[int] = None):
        super().__init__(message)
        self.retry_after = retry_after

def extract_retry_delay(error_details: dict) -> Optional[int]:
    """Extract retry delay from error response"""
    try:
        if 'details' in error_details:
            for detail in error_details['details']:
                if detail.get('@type') == 'type.googleapis.com/google.rpc.RetryInfo':
                    retry_delay = detail.get('retryDelay', '0s')
                    # Parse delay like "19s" or "19.384878961s"
                    return int(float(retry_delay.rstrip('s')))
    except Exception as e:
        logger.warning(f"Failed to extract retry delay: {e}")
    return None

async def handle_adk_errors(func: Callable, *args, **kwargs) -> dict:
    """
    Wrapper for ADK agent calls that handles common errors gracefully.
    
    Returns:
        dict: Either the successful result or an error dict with:
            - error: str (error message)
            - error_type: str ('token_exhausted', 'rate_limit', 'timeout', 'unknown')
            - retry_after: int (seconds to wait before retry, if applicable)
            - recoverable: bool (whether the error can be recovered from)
    """
    try:
        result = await func(*args, **kwargs)
        return {"success": True, "data": result}
        
    except Exception as e:
        error_str = str(e)
        error_dict = {"success": False, "recoverable": True}
        
        # Check for token exhaustion (400 INVALID_ARGUMENT)
        if "400 INVALID_ARGUMENT" in error_str or "token count exceeds" in error_str.lower():
            logger.error(f"Token limit exceeded: {error_str}")
            error_dict.update({
                "error": "Input token limit exceeded. Please reduce context size or use a model with larger context window.",
                "error_type": "token_exhausted",
                "recoverable": False,  # Cannot auto-recover, needs user intervention
                "suggestion": "Try reducing the amount of context being sent, or split the task into smaller chunks."
            })
            
        # Check for rate limiting (429 RESOURCE_EXHAUSTED)
        elif "429 RESOURCE_EXHAUSTED" in error_str or "quota exceeded" in error_str.lower():
            retry_after = None
            
            # Try to extract retry delay from error message
            if "Please retry in" in error_str:
                try:
                    # Extract delay like "Please retry in 19.384878961s"
                    import re
                    match = re.search(r'retry in ([\d.]+)s', error_str)
                    if match:
                        retry_after = int(float(match.group(1))) + 1  # Add 1s buffer
                except:
                    pass
            
            if retry_after is None:
                retry_after = 60  # Default to 60 seconds
            
            logger.warning(f"Rate limit exceeded. Retry after {retry_after}s")
            error_dict.update({
                "error": f"API rate limit exceeded. Please wait {retry_after} seconds before retrying.",
                "error_type": "rate_limit",
                "retry_after": retry_after,
                "recoverable": True,
                "suggestion": f"The system will automatically retry in {retry_after} seconds. You can also manually retry later."
            })
            
        # Check for timeout
        elif isinstance(e, asyncio.TimeoutError):
            logger.error("Request timed out")
            error_dict.update({
                "error": "Request timed out. The operation took too long to complete.",
                "error_type": "timeout",
                "recoverable": True,
                "suggestion": "Try again or break down the task into smaller pieces."
            })
            
        # Unknown error
        else:
            logger.error(f"Unexpected error: {error_str}", exc_info=True)
            error_dict.update({
                "error": f"An unexpected error occurred: {error_str[:200]}",
                "error_type": "unknown",
                "recoverable": False,
                "suggestion": "Check the logs for more details."
            })
        
        return error_dict

async def retry_with_backoff(
    func: Callable,
    max_retries: int = 3,
    initial_delay: int = 1,
    max_delay: int = 60,
    *args,
    **kwargs
) -> Any:
    """
    Retry a function with exponential backoff.
    
    Args:
        func: Async function to retry
        max_retries: Maximum number of retry attempts
        initial_delay: Initial delay in seconds
        max_delay: Maximum delay in seconds
    """
    delay = initial_delay
    last_error = None
    
    for attempt in range(max_retries + 1):
        try:
            result = await handle_adk_errors(func, *args, **kwargs)
            
            # If successful, return immediately
            if result.get("success"):
                return result
            
            # If not recoverable, don't retry
            if not result.get("recoverable"):
                return result
            
            # If rate limited, use the suggested retry_after
            if result.get("error_type") == "rate_limit" and result.get("retry_after"):
                delay = result["retry_after"]
            
            last_error = result
            
            # Don't sleep on the last attempt
            if attempt < max_retries:
                logger.info(f"Attempt {attempt + 1}/{max_retries} failed. Retrying in {delay}s...")
                await asyncio.sleep(delay)
                delay = min(delay * 2, max_delay)  # Exponential backoff
                
        except Exception as e:
            logger.error(f"Retry attempt {attempt + 1} failed: {e}")
            last_error = {
                "success": False,
                "error": str(e),
                "error_type": "unknown",
                "recoverable": False
            }
            
            if attempt < max_retries:
                await asyncio.sleep(delay)
                delay = min(delay * 2, max_delay)
    
    return last_error or {"success": False, "error": "Max retries exceeded", "recoverable": False}
