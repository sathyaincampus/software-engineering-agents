from google.adk.agents.invocation_context import InvocationContext

print("InvocationContext fields:")
for name, field in InvocationContext.model_fields.items():
    print(f"{name}: {field.annotation}")
