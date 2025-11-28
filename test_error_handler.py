"""
Test script for error_handler.py

Run this to verify error handling works correctly.
"""
import asyncio
import sys
import os

# Add backend/app to path
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)

from app.utils.error_handler import handle_adk_errors, retry_with_backoff


async def test_success():
    """Test successful execution"""
    print("\n=== Test 1: Success ===")
    
    async def successful_task():
        await asyncio.sleep(0.1)
        return {"result": "success", "data": [1, 2, 3]}
    
    result = await handle_adk_errors(successful_task)
    print(f"Result: {result}")
    assert result["success"] == True
    assert result["data"]["result"] == "success"
    print("✓ Success test passed")


async def test_token_exhausted():
    """Test token exhaustion error"""
    print("\n=== Test 2: Token Exhausted ===")
    
    async def token_exhausted_task():
        raise Exception("400 INVALID_ARGUMENT. The input token count exceeds the maximum number of tokens allowed 1048576.")
    
    result = await handle_adk_errors(token_exhausted_task)
    print(f"Result: {result}")
    assert result["success"] == False
    assert result["error_type"] == "token_exhausted"
    assert result["recoverable"] == False
    print("✓ Token exhausted test passed")


async def test_rate_limit():
    """Test rate limit error"""
    print("\n=== Test 3: Rate Limit ===")
    
    async def rate_limit_task():
        raise Exception("429 RESOURCE_EXHAUSTED. Please retry in 19.384878961s.")
    
    result = await handle_adk_errors(rate_limit_task)
    print(f"Result: {result}")
    assert result["success"] == False
    assert result["error_type"] == "rate_limit"
    assert result["recoverable"] == True
    assert result["retry_after"] == 20  # 19 + 1 buffer
    print("✓ Rate limit test passed")


async def test_timeout():
    """Test timeout error"""
    print("\n=== Test 4: Timeout ===")
    
    async def timeout_task():
        raise asyncio.TimeoutError("Request timed out")
    
    result = await handle_adk_errors(timeout_task)
    print(f"Result: {result}")
    assert result["success"] == False
    assert result["error_type"] == "timeout"
    assert result["recoverable"] == True
    print("✓ Timeout test passed")


async def test_unknown_error():
    """Test unknown error"""
    print("\n=== Test 5: Unknown Error ===")
    
    async def unknown_error_task():
        raise ValueError("Some unexpected error")
    
    result = await handle_adk_errors(unknown_error_task)
    print(f"Result: {result}")
    assert result["success"] == False
    assert result["error_type"] == "unknown"
    assert result["recoverable"] == False
    print("✓ Unknown error test passed")


async def test_retry_with_backoff():
    """Test retry with backoff"""
    print("\n=== Test 6: Retry with Backoff ===")
    
    attempt_count = 0
    
    async def flaky_task():
        nonlocal attempt_count
        attempt_count += 1
        print(f"  Attempt {attempt_count}")
        
        if attempt_count < 3:
            raise Exception("429 RESOURCE_EXHAUSTED. Please retry in 1s.")
        
        return {"result": "success after retries"}
    
    result = await retry_with_backoff(
        flaky_task,
        max_retries=3,
        initial_delay=0.1,  # Fast for testing
        max_delay=1
    )
    
    print(f"Result: {result}")
    assert result["success"] == True
    assert attempt_count == 3
    print("✓ Retry with backoff test passed")


async def main():
    """Run all tests"""
    print("=" * 60)
    print("Testing Error Handler")
    print("=" * 60)
    
    try:
        await test_success()
        await test_token_exhausted()
        await test_rate_limit()
        await test_timeout()
        await test_unknown_error()
        await test_retry_with_backoff()
        
        print("\n" + "=" * 60)
        print("✓ All tests passed!")
        print("=" * 60)
        
    except AssertionError as e:
        print(f"\n✗ Test failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
