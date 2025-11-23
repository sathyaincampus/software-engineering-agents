from google.adk.apps import App
import inspect

print("Inspecting App signature:")
try:
    sig = inspect.signature(App)
    print(sig)
except Exception as e:
    print(f"Error inspecting signature: {e}")
