#!/usr/bin/env python3
"""
Fix specific Mermaid diagram issues:
1. Fix API Endpoint Structure graph (invalid arrow syntax)
2. Will be used to fix other diagrams as needed
"""

import json
from pathlib import Path

def fix_api_endpoint_diagram(diagram_code):
    """Fix the API Endpoint Structure diagram"""
    
    # Check if this is the API endpoint diagram
    if 'API Gateway' not in diagram_code or 'AuthService' not in diagram_code:
        return diagram_code
    
    # Correct version of the diagram
    fixed_diagram = """graph TD
    subgraph APIGateway[API Gateway]
        A[POST /api/v1/auth/login]
        B[GET /api/v1/auth/google]
        C[GET /api/v1/auth/google/callback]
        D[GET /api/v1/users/me]
        E[PUT /api/v1/users/me]
        F[GET /api/v1/events]
        G[POST /api/v1/events]
        H[GET /api/v1/events/:id]
        I[PUT /api/v1/events/:id]
        J[DELETE /api/v1/events/:id]
        K[GET /api/v1/tasks]
        L[POST /api/v1/tasks]
        M[PUT /api/v1/tasks/:id/complete]
        N[GET /api/v1/rewards]
        O[POST /api/v1/rewards/redeem]
        P[GET /api/v1/notifications]
        Q[POST /api/v1/sync/google]
    end

    subgraph Services[Backend Services]
        AuthService[Auth Service]
        UserService[User Service]
        CalendarService[Calendar Service]
        TaskService[Task Service]
        RewardService[Reward Service]
        NotificationService[Notification Service]
        SyncService[Sync Service]
    end

    AuthService --> A
    AuthService --> B
    AuthService --> C
    UserService --> D
    UserService --> E
    CalendarService --> F
    CalendarService --> G
    CalendarService --> H
    CalendarService --> I
    CalendarService --> J
    TaskService --> K
    TaskService --> L
    TaskService --> M
    RewardService --> N
    RewardService --> O
    NotificationService --> P
    SyncService --> Q"""
    
    return fixed_diagram

def clean_mermaid_code(diagram_code):
    """Remove markdown code fences"""
    cleaned = diagram_code.strip()
    if cleaned.startswith('```mermaid'):
        cleaned = cleaned[10:]
    if cleaned.startswith('```'):
        cleaned = cleaned[3:]
    if cleaned.endswith('```'):
        cleaned = cleaned[:-3]
    
    cleaned = cleaned.strip().strip('`')
    
    # Fix API endpoint diagram if needed
    if 'API Gateway' in cleaned and 'AuthService -->' in cleaned:
        cleaned = fix_api_endpoint_diagram(cleaned)
    
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
                    print(f"  Fixed diagram {i+1} in section {section.get('section_id', 'unknown')}: {section.get('title', 'unknown')}")
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
