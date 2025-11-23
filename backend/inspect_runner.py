import inspect
from google.adk import Runner

print("Inspecting Runner signature:")
try:
    sig = inspect.signature(Runner)
    print(sig)
except Exception as e:
    print(f"Error inspecting signature: {e}")

print("\nRunner methods:")
print([m for m in dir(Runner) if not m.startswith('_')])
