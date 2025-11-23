import inspect
from google.adk import Agent

print("Agent methods:")
print(dir(Agent))

print("\nInspecting Agent.__call__ signature:")
try:
    sig = inspect.signature(Agent.__call__)
    print(sig)
except Exception as e:
    print(f"Error inspecting signature: {e}")
