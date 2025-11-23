"""
Test script to verify ADK implementation
"""
import asyncio
import sys
sys.path.insert(0, '/Users/sathya/web/python/adk/software-engineering-agents/backend')

from app.core.orchestrator import orchestrator
from app.agents.strategy.idea_generator import IdeaGeneratorAgent

async def test_idea_generation():
    print("=" * 60)
    print("Testing ADK Implementation")
    print("=" * 60)
    
    # Step 1: Create session
    print("\n1. Creating session...")
    session = orchestrator.create_session()
    print(f"   ✓ Session created: {session.session_id}")
    
    # Step 2: Initialize agent
    print("\n2. Initializing IdeaGeneratorAgent...")
    idea_agent = IdeaGeneratorAgent()
    print("   ✓ Agent initialized")
    
    # Step 3: Generate ideas
    print("\n3. Generating ideas...")
    try:
        result = await idea_agent.generate_ideas(
            keywords="parent kid calendar app",
            session_id=session.session_id
        )
        print("   ✓ Ideas generated successfully!")
        print(f"\n4. Result preview:")
        print(f"   {str(result)[:200]}...")
        
        return True
    except Exception as e:
        print(f"   ✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_idea_generation())
    print("\n" + "=" * 60)
    if success:
        print("✓ TEST PASSED - ADK implementation working correctly!")
    else:
        print("✗ TEST FAILED - Check errors above")
    print("=" * 60)
