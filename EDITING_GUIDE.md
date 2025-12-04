# Editing Features - SparkToShip

## Overview

SparkToShip now supports **full editing capabilities** for all key artifacts before code generation. This allows you to refine and customize the AI-generated content to match your exact requirements.

## What Can You Edit?

### 1. **Product Requirements Document (PRD)**
- **When**: After the PRD is generated (Step 2)
- **How**: Click the "Edit" button in the PRD viewer
- **What**: Edit the entire PRD in markdown format
- **Benefits**: 
  - Refine feature descriptions
  - Add missing requirements
  - Clarify ambiguous specifications
  - Adjust scope and priorities

### 2. **User Stories**
- **When**: After requirement analysis (Step 3)
- **How**: Click "Edit User Stories" button
- **What**: 
  - Add new user stories
  - Remove unnecessary stories
  - Modify story titles, descriptions, and priorities
  - Change story IDs
- **Benefits**:
  - Ensure all critical user flows are covered
  - Adjust priorities based on business needs
  - Add edge cases or special scenarios

### 3. **Architecture & Tech Stack**
- **When**: After architecture design (Step 4)
- **How**: Click "Edit Architecture" button
- **What**: Edit the entire architecture JSON including:
  - **Tech Stack**: Change frontend/backend frameworks, databases, DevOps tools
  - **System Diagrams**: Modify Mermaid diagram code
  - **Sequence Diagrams**: Update user flow diagrams
  - **API Design Principles**: Adjust architectural decisions
  - **Database Schema**: Modify data models
- **Benefits**:
  - Use your preferred technology stack
  - Adjust architectural patterns
  - Optimize for your infrastructure
  - Ensure compliance with company standards

## How to Use

### Editing Workflow

1. **Generate Initial Content**: Let the AI agents create the initial PRD, user stories, and architecture
2. **Review**: Carefully review the generated content
3. **Edit**: Click the "Edit" button on any section you want to modify
4. **Make Changes**: 
   - For PRD: Edit markdown text directly
   - For User Stories: Use the visual editor to add/remove/modify stories
   - For Architecture: Edit the JSON configuration (advanced)
5. **Save**: Click "Save Changes" to persist your edits
6. **Proceed**: Continue to the next step - your edits will be used for code generation

### Important Notes

- ✅ **All edits are saved** to your project files
- ✅ **Edits persist** across sessions when you reload a project
- ✅ **Code generation uses your edited content**, not the original AI output
- ✅ **You can edit multiple times** before proceeding to the next step
- ⚠️ **Architecture JSON editing** requires understanding of the JSON structure

## Architecture JSON Structure

When editing architecture, you'll work with a JSON object containing:

```json
{
  "tech_stack": {
    "frontend": {
      "framework": "React",
      "language": "TypeScript",
      "styling": "Tailwind CSS"
    },
    "backend": {
      "framework": "FastAPI",
      "language": "Python",
      "api_style": "REST"
    },
    "database": {
      "primary": "PostgreSQL",
      "caching": "Redis"
    },
    "devops": {
      "containerization": "Docker",
      "orchestration": "Kubernetes"
    }
  },
  "system_diagram": {
    "format": "mermaid",
    "code": "graph TD\n  A[Client] --> B[Load Balancer]\n  ..."
  },
  "sequence_diagrams": [
    {
      "name": "User Login Flow",
      "description": "Authentication sequence",
      "format": "mermaid",
      "code": "sequenceDiagram\n  participant U as User\n  ..."
    }
  ],
  "data_model": {
    "schema": [
      {
        "table": "users",
        "columns": [
          {"name": "id", "type": "UUID", "primary_key": true},
          {"name": "email", "type": "VARCHAR(255)", "unique": true}
        ]
      }
    ]
  }
}
```

### Tips for Architecture Editing

1. **Validate JSON**: Ensure your JSON is valid before saving
2. **Mermaid Syntax**: Use [Mermaid Live Editor](https://mermaid.live) to test diagram code
3. **Tech Stack Consistency**: Ensure frontend and backend choices are compatible
4. **Incremental Changes**: Make small changes and save frequently

## Backend API Endpoints

The editing feature uses these new endpoints:

- `PUT /projects/{session_id}/prd` - Update PRD content
- `PUT /projects/{session_id}/architecture` - Update architecture configuration
- `PUT /projects/{session_id}/user_stories` - Update user stories

## Benefits of Editing Before Code Generation

1. **Accuracy**: Ensure the AI understands your exact requirements
2. **Control**: Maintain full control over technical decisions
3. **Compliance**: Align with company standards and policies
4. **Optimization**: Choose the best tech stack for your use case
5. **Completeness**: Add missing requirements or edge cases
6. **Quality**: Higher quality generated code that matches your needs

## Future Enhancements

- [ ] Visual diagram editor (drag-and-drop)
- [ ] Template library for common architectures
- [ ] Validation and suggestions for tech stack choices
- [ ] Diff view to see what changed
- [ ] Version history for edits
- [ ] Collaborative editing with team members

## Troubleshooting

### "Failed to save changes"
- Check your internet connection
- Ensure the session is still active
- Try refreshing the page and editing again

### "Invalid JSON format" (Architecture editing)
- Use a JSON validator to check your syntax
- Look for missing commas, brackets, or quotes
- Copy the original JSON and make small changes

### Changes not reflected in code generation
- Ensure you clicked "Save Changes" before proceeding
- Check the system logs for confirmation messages
- Reload the project to verify changes were saved

## Questions?

If you encounter any issues or have suggestions for improving the editing experience, please open an issue on GitHub.
