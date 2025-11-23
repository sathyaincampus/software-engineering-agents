import asyncio
from google.adk import Agent
from google.adk.models import Gemini

async def test_agent_call():
    model = Gemini(model="gemini-2.0-flash-exp")
    agent = Agent(name="test", model=model, instruction="You are a test agent.")
    
    print("Calling agent('hello')...")
    try:
        response = agent("hello")
        print(f"Response type: {type(response)}")
        print(f"Response: {response}")
    except Exception as e:
        print(f"Error calling agent: {e}")

if __name__ == "__main__":
    asyncio.run(test_agent_call())
