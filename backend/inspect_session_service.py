from google.adk.sessions import InMemorySessionService
import inspect

print("InMemorySessionService methods:")
print([m for m in dir(InMemorySessionService) if not m.startswith('_')])

print("\nInspecting create_session signature:")
try:
    sig = inspect.signature(InMemorySessionService.create_session)
    print(sig)
except Exception as e:
    print(f"Error inspecting signature: {e}")
