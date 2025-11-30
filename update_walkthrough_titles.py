#!/usr/bin/env python3
"""
Script to update walkthrough titles with correct project names
"""
import json
import os
from pathlib import Path

def update_walkthrough_title(walkthrough_path: Path, project_name: str):
    """Update the title in a walkthrough JSON file"""
    if not walkthrough_path.exists():
        print(f"⏭️  Skipping {walkthrough_path.name} (not found)")
        return
    
    with open(walkthrough_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Update the title
    old_title = data.get('title', '')
    new_title = f"Code Walkthrough: {project_name}"
    
    if old_title == new_title:
        print(f"✓ {walkthrough_path.name} already has correct title")
        return
    
    data['title'] = new_title
    
    # Save back
    with open(walkthrough_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Updated {walkthrough_path.name}: '{old_title}' → '{new_title}'")

def main():
    # Path to the FamilyFlow project
    project_dir = Path("backend/data/projects/392a52dd-119c-46c9-9513-726e5066c289")
    
    # Load metadata to get project name
    metadata_path = project_dir / "metadata.json"
    if not metadata_path.exists():
        print(f"❌ Metadata not found at {metadata_path}")
        return
    
    with open(metadata_path, 'r') as f:
        metadata = json.load(f)
    
    project_name = metadata.get('project_name', 'Untitled Project')
    print(f"📝 Updating walkthroughs for project: {project_name}")
    print()
    
    # Update all three walkthrough types
    for walkthrough_type in ['text', 'image', 'video']:
        walkthrough_path = project_dir / f"walkthrough_{walkthrough_type}.json"
        update_walkthrough_title(walkthrough_path, project_name)
    
    print()
    print("✅ All walkthroughs updated!")

if __name__ == "__main__":
    main()
