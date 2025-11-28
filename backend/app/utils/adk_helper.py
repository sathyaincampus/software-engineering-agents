import json
import re
import logging

logger = logging.getLogger(__name__)

async def collect_response(async_gen):
    """
    Consumes an async generator from ADK Runner.run_async() and returns the full string response.
    Handles errors gracefully to prevent crashes.
    """
    full_response = ""
    try:
        async for event in async_gen:
            # Check for ModelGenerateContentEvent or similar that contains text
            # We look for 'content' or 'text' in the event or its payload
            if hasattr(event, 'content') and event.content:
                 # event.content might be a Content object or string
                 if hasattr(event.content, 'parts'):
                     for part in event.content.parts:
                         if hasattr(part, 'text') and part.text:
                             full_response += part.text
                 elif isinstance(event.content, str):
                     full_response += event.content
            elif hasattr(event, 'text') and event.text:
                full_response += event.text
                
    except Exception as e:
        error_str = str(e)
        logger.error(f"Error in collect_response: {error_str}")
        
        # Re-raise specific errors that should be handled by error_handler
        if any(keyword in error_str for keyword in [
            "400 INVALID_ARGUMENT",
            "429 RESOURCE_EXHAUSTED", 
            "token count exceeds",
            "quota exceeded"
        ]):
            raise
        
        # For other errors, log and return what we have so far
        logger.warning(f"Partial response collected before error: {len(full_response)} chars")
        if not full_response:
            # If we got nothing, return error info
            return json.dumps({
                "error": "Failed to collect response",
                "details": error_str[:500]
            })
            
    return full_response

def extract_json_from_markdown(text: str) -> str:
    """
    Extract JSON from markdown code blocks.
    Handles formats like:
    - ```json\n{...}\n```
    - ```\n{...}\n```
    - Plain JSON
    """
    # Try to find JSON in markdown code blocks
    patterns = [
        r'```json\s*\n(.*?)\n```',  # ```json ... ```
        r'```\s*\n(.*?)\n```',       # ``` ... ```
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.DOTALL)
        if match:
            return match.group(1).strip()
    
    # If no code block found, return original text
    return text.strip()

def parse_json_response(response: str) -> dict:
    """
    Parse JSON response, handling markdown code blocks and errors.
    
    Returns:
        dict: Parsed JSON or error dict with raw_output
    """
    try:
        # First, try to extract JSON from markdown
        json_text = extract_json_from_markdown(response)
        
        # Try to parse
        return json.loads(json_text)
    
    except json.JSONDecodeError as e:
        # Return error with raw output for debugging
        return {
            "error": f"Failed to parse JSON: {str(e)}",
            "raw_output": response[:1000]  # Limit to first 1000 chars
        }
    except Exception as e:
        return {
            "error": f"Unexpected error: {str(e)}",
            "raw_output": response[:1000]
        }
