#!/usr/bin/env python3
"""
Script to add API key validation to all agent files
"""
import os
from pathlib import Path

# Define the validation code to add
VALIDATION_CODE = """        from app.utils.security import validate_api_key
        
        # Validate API key BEFORE using it
        is_valid, error_msg = validate_api_key(model_config.api_key)
        if not is_valid:
            raise ValueError(error_msg)
        """

# Find all agent files
backend_dir = Path(__file__).parent
agents_dir = backend_dir / "app" / "agents"

agent_files = []
for root, dirs, files in os.walk(agents_dir):
    for file in files:
        if file.endswith(".py") and not file.startswith("__") and file != "TEMPLATE_AGENT.py":
            agent_files.append(Path(root) / file)

print(f"Found {len(agent_files)} agent files:")
for f in agent_files:
    print(f"  - {f.relative_to(backend_dir)}")

print("\nTo add validation, manually edit each file to include the validation check")
print("at the start of each async method that uses model_config.")
