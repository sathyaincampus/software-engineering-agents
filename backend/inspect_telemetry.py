from google.adk import telemetry
import inspect

print("Telemetry exports:")
print(dir(telemetry))

if hasattr(telemetry, 'setup_telemetry'):
    print("\nInspecting setup_telemetry:")
    print(inspect.signature(telemetry.setup_telemetry))
