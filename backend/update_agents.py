#!/usr/bin/env python3
"""
Update all agents to use the robust JSON parsing helper
"""
import re
from pathlib import Path

# List of agent files to update
agent_files = [
    "backend/app/agents/strategy/requirement_analysis.py",
    "backend/app/agents/strategy/product_requirements.py",
    "backend/app/agents/engineering/engineering_manager.py",
    "backend/app/agents/engineering/backend_dev.py",
    "backend/app/agents/engineering/frontend_dev.py",
    "backend/app/agents/engineering/qa_agent.py",
    "backend/app/agents/architecture/ux_designer.py",
]

# Pattern to find and replace
old_import = "from app.utils.adk_helper import collect_response"
new_import = "from app.utils.adk_helper import collect_response, parse_json_response"

old_parsing = r"""        try:
            text = str\(response\)
            if "```json" in text:
                text = text\.split\("```json"\)\[1\]\.split\("```"\)\[0\]
            elif "```" in text:
                text = text\.split\("```"\)\[1\]\.split\("```"\)\[0\]
            return json\.loads\(text.*?\)
        except Exception.*?:
            return \{.*?"raw_output".*?\}"""

new_parsing = """        
        # Use robust JSON parsing
        return parse_json_response(response)"""

for file_path in agent_files:
    path = Path(file_path)
    if not path.exists():
        print(f"Skipping {file_path} - not found")
        continue
    
    content = path.read_text()
    
    # Update import
    if old_import in content:
        content = content.replace(old_import, new_import)
        print(f"✓ Updated import in {file_path}")
    
    # Update parsing logic
    content = re.sub(old_parsing, new_parsing, content, flags=re.DOTALL)
    
    path.write_text(content)
    print(f"✓ Updated {file_path}")

print("\n✅ All agents updated!")
