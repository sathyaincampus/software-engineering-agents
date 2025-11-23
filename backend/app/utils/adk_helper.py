async def collect_response(async_gen):
    """
    Consumes an async generator from ADK Runner.run_async() and returns the full string response.
    """
    full_response = ""
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
            
    return full_response
