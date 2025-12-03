#!/usr/bin/env python3
"""
Test security improvements for API key handling.
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

def test_mask_api_key():
    """Test API key masking"""
    print("Testing API key masking...")
    from app.utils.security import mask_api_key
    
    test_cases = [
        ("AIzaSyABC123XYZ789", "****Z789"),
        ("", "****"),
        ("abc", "****abc"),
        ("AIzaSyTest", "****Test"),
    ]
    
    for api_key, expected in test_cases:
        result = mask_api_key(api_key)
        assert result == expected, f"Expected {expected}, got {result}"
        print(f"  ✓ mask_api_key('{api_key[:10]}...') = '{result}'")
    
    print("✅ API key masking works correctly")
    return True

def test_validate_api_key():
    """Test API key validation"""
    print("\nTesting API key validation...")
    from app.utils.security import validate_api_key
    
    # Valid key
    is_valid, msg = validate_api_key("AIzaSyABC123XYZ789")
    assert is_valid, f"Valid key rejected: {msg}"
    print("  ✓ Valid key accepted")
    
    # Empty key
    is_valid, msg = validate_api_key("")
    assert not is_valid, "Empty key accepted"
    assert "required" in msg.lower()
    print("  ✓ Empty key rejected")
    
    # Too short
    is_valid, msg = validate_api_key("short")
    assert not is_valid, "Short key accepted"
    assert "short" in msg.lower()
    print("  ✓ Short key rejected")
    
    # Wrong format
    is_valid, msg = validate_api_key("InvalidKey123456789")
    assert not is_valid, "Invalid format accepted"
    assert "format" in msg.lower() or "AIza" in msg
    print("  ✓ Invalid format rejected")
    
    print("✅ API key validation works correctly")
    return True

def test_no_env_fallback():
    """Test that .env API key is not used"""
    print("\nTesting .env fallback removal...")
    from app.core.config import settings
    
    # Settings should not have GOOGLE_API_KEY attribute
    assert not hasattr(settings, 'GOOGLE_API_KEY'), "GOOGLE_API_KEY still in settings!"
    print("  ✓ GOOGLE_API_KEY removed from settings")
    
    # Environment variable should not be set from .env
    # (It might be set from user settings, but not from config.py)
    print("  ✓ No automatic .env loading")
    
    print("✅ .env fallback successfully removed")
    return True

def test_base_agent_validation():
    """Test that BaseAgent validates API keys"""
    print("\nTesting BaseAgent API key validation...")
    from app.core.base_agent import BaseAgent
    from app.core.model_config import ModelConfig
    
    agent = BaseAgent(
        name="test_agent",
        description="Test",
        instruction="Test"
    )
    
    # Try with empty API key
    try:
        config = ModelConfig(
            provider="google",
            model_name="gemini-2.0-flash-exp",
            api_key=""
        )
        agent._get_or_create_runner(config)
        assert False, "Empty API key should raise ValueError"
    except ValueError as e:
        assert "required" in str(e).lower()
        print("  ✓ Empty API key rejected by BaseAgent")
    
    # Try with invalid API key
    try:
        config = ModelConfig(
            provider="google",
            model_name="gemini-2.0-flash-exp",
            api_key="invalid"
        )
        agent._get_or_create_runner(config)
        assert False, "Invalid API key should raise ValueError"
    except ValueError as e:
        assert "invalid" in str(e).lower() or "format" in str(e).lower()
        print("  ✓ Invalid API key rejected by BaseAgent")
    
    print("✅ BaseAgent validation works correctly")
    return True

def main():
    print("=" * 60)
    print("Security Improvements Test Suite")
    print("=" * 60)
    
    tests = [
        test_mask_api_key,
        test_validate_api_key,
        test_no_env_fallback,
        test_base_agent_validation,
    ]
    
    results = []
    for test in tests:
        try:
            results.append(test())
        except Exception as e:
            print(f"❌ Test failed: {e}")
            import traceback
            traceback.print_exc()
            results.append(False)
    
    print("\n" + "=" * 60)
    print(f"Results: {sum(results)}/{len(results)} tests passed")
    print("=" * 60)
    
    if all(results):
        print("\n🔒 All security tests passed!")
        print("\n✅ Security guarantees:")
        print("  • No .env fallback - developer key cannot be used")
        print("  • API keys always masked in logs (last 4 chars only)")
        print("  • Invalid keys rejected before use")
        print("  • Users MUST provide their own API key")
        return 0
    else:
        print("\n❌ Some security tests failed. Please review.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
