#!/usr/bin/env python3
"""
Quick test to verify the API key configuration changes work correctly.
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

def test_imports():
    """Test that all modules can be imported"""
    print("Testing imports...")
    try:
        from app.core.base_agent import BaseAgent
        from app.core.model_config import ModelConfig
        from app.agents.strategy.idea_generator import IdeaGeneratorAgent
        from app.agents.engineering.backend_dev import BackendDevAgent
        print("✅ All imports successful")
        return True
    except Exception as e:
        print(f"❌ Import failed: {e}")
        return False

def test_base_agent():
    """Test BaseAgent initialization"""
    print("\nTesting BaseAgent...")
    try:
        from app.core.base_agent import BaseAgent
        
        # Create a test agent
        agent = BaseAgent(
            name="test_agent",
            description="Test agent",
            instruction="Test instruction"
        )
        
        assert agent.name == "test_agent"
        assert agent._model is None  # Should not be created yet
        assert agent._runner is None  # Should not be created yet
        
        print("✅ BaseAgent initialization works")
        return True
    except Exception as e:
        print(f"❌ BaseAgent test failed: {e}")
        return False

def test_model_config():
    """Test ModelConfig"""
    print("\nTesting ModelConfig...")
    try:
        from app.core.model_config import ModelConfig
        
        config = ModelConfig(
            provider="google",
            model_name="gemini-2.0-flash-exp",
            api_key="test_key_123",
            temperature=0.7
        )
        
        assert config.provider == "google"
        assert config.api_key == "test_key_123"
        
        print("✅ ModelConfig works")
        return True
    except Exception as e:
        print(f"❌ ModelConfig test failed: {e}")
        return False

def test_agent_inheritance():
    """Test that agents inherit from BaseAgent"""
    print("\nTesting agent inheritance...")
    try:
        from app.core.base_agent import BaseAgent
        from app.agents.strategy.idea_generator import IdeaGeneratorAgent
        from app.agents.engineering.backend_dev import BackendDevAgent
        
        idea_agent = IdeaGeneratorAgent()
        backend_agent = BackendDevAgent()
        
        assert isinstance(idea_agent, BaseAgent)
        assert isinstance(backend_agent, BaseAgent)
        assert hasattr(idea_agent, '_get_or_create_runner')
        
        print("✅ Agent inheritance works")
        return True
    except Exception as e:
        print(f"❌ Agent inheritance test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_config_optional_api_key():
    """Test that config works without API key"""
    print("\nTesting optional API key in config...")
    try:
        from app.core.config import settings
        
        # Should not fail even if GOOGLE_API_KEY is not in .env
        print(f"  API Key from .env: {'Set' if settings.GOOGLE_API_KEY else 'Not set (OK)'}")
        print(f"  Model Name: {settings.MODEL_NAME}")
        
        print("✅ Config works without required API key")
        return True
    except Exception as e:
        print(f"❌ Config test failed: {e}")
        return False

def main():
    print("=" * 60)
    print("API Key Configuration Test Suite")
    print("=" * 60)
    
    tests = [
        test_imports,
        test_base_agent,
        test_model_config,
        test_agent_inheritance,
        test_config_optional_api_key,
    ]
    
    results = []
    for test in tests:
        results.append(test())
    
    print("\n" + "=" * 60)
    print(f"Results: {sum(results)}/{len(results)} tests passed")
    print("=" * 60)
    
    if all(results):
        print("\n🎉 All tests passed! The API key configuration is working correctly.")
        print("\nNext steps:")
        print("1. Start the backend: cd backend && uvicorn app.main:app --reload --port 8050")
        print("2. Start the frontend: cd frontend && npm run dev")
        print("3. Open the app and enter your API key in Settings")
        return 0
    else:
        print("\n❌ Some tests failed. Please review the errors above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
