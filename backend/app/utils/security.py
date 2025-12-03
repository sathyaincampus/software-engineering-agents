"""
Security utilities for handling sensitive data like API keys.
"""

def mask_api_key(api_key: str) -> str:
    """
    Mask an API key for safe logging.
    Shows only the last 4 characters.
    
    Args:
        api_key: The API key to mask
        
    Returns:
        Masked string like "****abcd"
        
    Examples:
        >>> mask_api_key("AIzaSyABC123XYZ789")
        "****Z789"
        >>> mask_api_key("")
        "****"
        >>> mask_api_key("abc")
        "****abc"
    """
    if not api_key:
        return "****"
    
    if len(api_key) <= 4:
        return f"****{api_key}"
    
    return f"****{api_key[-4:]}"


def validate_api_key(api_key: str) -> tuple[bool, str]:
    """
    Validate that an API key is provided and looks reasonable.
    
    Args:
        api_key: The API key to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not api_key:
        return False, "API key is required. Please set your API key in Settings."
    
    if len(api_key) < 10:
        return False, "API key appears to be invalid (too short)."
    
    # Basic format check for Google API keys
    if not api_key.startswith("AIza"):
        return False, "API key format appears invalid. Google API keys typically start with 'AIza'."
    
    return True, ""
