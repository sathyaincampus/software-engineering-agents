import inspect
from google.adk import Agent
from google.adk.models import Gemini

print("Inspecting Agent.run_async signature:")
try:
    sig = inspect.signature(Agent.run_async)
    print(sig)
except Exception as e:
    print(f"Error inspecting signature: {e}")

print("\nInspecting Agent.run signature:")
try:
    sig = inspect.signature(Agent.run)
    print(sig)
except Exception as e:
    print(f"Error inspecting signature: {e}")
