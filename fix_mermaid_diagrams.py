#!/usr/bin/env python3
"""
Fix Mermaid ER diagrams based on official Mermaid documentation.
https://mermaid.js.org/syntax/entityRelationshipDiagram.html

Key rules:
- Attribute format: type name key
- Type must start with alphabetic character
- Keys: PK, FK, UK (or combinations like "PK, FK")
- No underscores in types like "PK_FK"
"""

import json
import re
from pathlib import Path

def fix_er_diagram(diagram_code):
    """Fix ER diagram syntax to match Mermaid standards"""
    
    # Check if this is an ER diagram
    if not diagram_code.strip().startswith('erDiagram'):
        return diagram_code
    
    lines = diagram_code.split('\n')
    fixed_lines = []
    in_entity_block = False
    
    for line in lines:
        stripped = line.strip()
        
        # Keep erDiagram declaration
        if stripped == 'erDiagram':
            fixed_lines.append(line)
            continue
        
        # Keep relationship lines
        if '||--' in stripped or '}o--' in stripped or '}|--' in stripped or '||..' in stripped:
            fixed_lines.append(line)
            continue
        
        # Entity declaration (e.g., "USERS {")
        if stripped.endswith('{') and not in_entity_block:
            fixed_lines.append(line)
            in_entity_block = True
            continue
        
        # End of entity block
        if stripped == '}':
            fixed_lines.append(line)
            in_entity_block = False
            continue
        
        # Attribute line inside entity block
        if in_entity_block and stripped:
            # Parse attribute: type name key
            # Examples:
            #   uuid user_id PK
            #   string email
            #   uuid parent_id FK
            
            parts = stripped.split()
            if len(parts) >= 2:
                attr_type = parts[0]
                attr_name = parts[1]
                attr_key = ' '.join(parts[2:]) if len(parts) > 2 else ''
                
                # Fix type - must start with alphabetic character
                # Map common types to valid Mermaid types
                type_mapping = {
                    'uuid': 'string',
                    'int': 'int',
                    'text': 'string',
                    'timestamp': 'datetime',
                    'date': 'date',
                    'boolean': 'bool',
                    'string': 'string'
                }
                
                fixed_type = type_mapping.get(attr_type.lower(), 'string')
                
                # Fix key - replace PK_FK with "PK, FK"
                if attr_key == 'PK_FK':
                    attr_key = '"PK, FK"'
                elif attr_key and not attr_key.startswith('"'):
                    # Keys should be PK, FK, or UK
                    if attr_key in ['PK', 'FK', 'UK']:
                        pass  # Already correct
                    else:
                        attr_key = ''  # Remove invalid keys
                
                # Reconstruct line with proper indentation
                indent = '        '  # 8 spaces for attributes
                if attr_key:
                    fixed_line = f'{indent}{fixed_type} {attr_name} {attr_key}'
                else:
                    fixed_line = f'{indent}{fixed_type} {attr_name}'
                
                fixed_lines.append(fixed_line)
            else:
                fixed_lines.append(line)
        else:
            fixed_lines.append(line)
    
    return '\n'.join(fixed_lines)

def clean_mermaid_code(diagram_code):
    """Remove markdown code fences and fix syntax"""
    # Remove ```mermaid and ``` wrappers
    cleaned = diagram_code.strip()
    if cleaned.startswith('```mermaid'):
        cleaned = cleaned[10:]
    if cleaned.startswith('```'):
        cleaned = cleaned[3:]
    if cleaned.endswith('```'):
        cleaned = cleaned[:-3]
    
    cleaned = cleaned.strip().strip('`')
    
    # Fix ER diagram syntax
    if cleaned.strip().startswith('erDiagram'):
        cleaned = fix_er_diagram(cleaned)
    
    return cleaned.strip()

def fix_walkthrough_file(file_path):
    """Fix Mermaid diagrams in a walkthrough JSON file"""
    print(f"Processing {file_path.name}...")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    fixed_count = 0
    
    # Process each section
    for section in data.get('sections', []):
        if 'diagrams' in section and section['diagrams']:
            new_diagrams = []
            for i, diagram in enumerate(section['diagrams']):
                cleaned = clean_mermaid_code(diagram)
                new_diagrams.append(cleaned)
                if cleaned != diagram:
                    fixed_count += 1
                    print(f"  Fixed diagram {i+1} in section {section.get('section_id', 'unknown')}")
            section['diagrams'] = new_diagrams
    
    # Save fixed file
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"  Total fixed in {file_path.name}: {fixed_count} diagrams")
    return fixed_count

def main():
    # Find all walkthrough JSON files
    project_dir = Path('/Users/sathya/web/python/adk/software-engineering-agents/backend/data/projects/392a52dd-119c-46c9-9513-726e5066c289')
    
    walkthrough_files = list(project_dir.glob('walkthrough_*.json'))
    
    if not walkthrough_files:
        print("No walkthrough files found!")
        return
    
    total_fixed = 0
    for file_path in walkthrough_files:
        total_fixed += fix_walkthrough_file(file_path)
    
    print(f"\n✅ Total diagrams fixed: {total_fixed}")
    print("🎉 Done! Refresh your browser to see the fixed diagrams.")

if __name__ == '__main__':
    main()
