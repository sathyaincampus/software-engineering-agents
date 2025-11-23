import inspect
from google.adk import Runner

print("Inspecting Runner.run_async signature:")
try:
    sig = inspect.signature(Runner.run_async)
    print(sig)
except Exception as e:
    print(f"Error inspecting signature: {e}")
