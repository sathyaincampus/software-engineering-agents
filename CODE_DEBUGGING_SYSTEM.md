# Code Debugging & Review System

## Overview
This document describes the comprehensive debugging and code review system that has been integrated into the SparkToShip AI platform.

## New Features

### 1. **Regenerate Sprint Plan Button**
- **Location**: Engineering Sprint step in Mission Control
- **Functionality**: The "Regenerate" button (orange button with refresh icon) allows you to recreate the sprint plan if you're not satisfied with the initial results
- **How to use**: Click the "Regenerate" button next to the "Engineering Sprint" title

### 2. **DebuggerAgent** (Backend)
A new AI agent specifically designed for debugging and fixing code issues.

**Capabilities:**
- Analyzes error messages and stack traces
- Identifies root causes of bugs
- Provides corrected code with explanations
- Performs static analysis and linting
- Categorizes issues by severity (critical/warning/info)

**API Endpoints:**
- `POST /agent/debugger/debug` - Debug code based on error messages
- `POST /agent/debugger/lint` - Perform static analysis
- `GET /projects/{session_id}/code/{file_path}` - Get specific code file content

### 3. **CodeViewer Component** (Frontend)
A comprehensive code viewing and debugging interface integrated into Mission Control.

**Features:**

#### File Explorer
- **Tree Structure**: Hierarchical view of all generated files
- **Folder Navigation**: Expandable/collapsible folders
- **File Metadata**: Shows file sizes and paths
- **Quick Access**: Click any file to view its contents

#### Code Display
- **Syntax Highlighting**: Terminal-style code display with green text on dark background
- **Responsive Layout**: Adapts to different screen sizes
- **Loading States**: Shows spinner while fetching file content

#### Linting & Static Analysis
- **Lint Button**: Purple button to run static analysis on the current file
- **Issue Detection**: Identifies errors, warnings, and info-level issues
- **Line Numbers**: Shows exactly where issues occur
- **Severity Icons**: Visual indicators for error types
  - ❌ Red X for errors
  - ⚠️ Yellow triangle for warnings
  - ℹ️ Blue circle for info

#### Interactive Debugging
- **Error Input**: Text field to paste error messages
- **Debug & Fix Button**: Red button to trigger AI-powered debugging
- **Automatic Fixes**: AI analyzes the error and provides corrected code
- **Fix Explanation**: Shows what was wrong and how it was fixed
- **Auto-Apply**: Fixed code is automatically loaded into the editor
- **Severity Badges**: Color-coded based on issue severity

### 4. **Mandatory Documentation Tasks**
The Engineering Manager now automatically includes these tasks in every sprint plan:

1. **Project Documentation**
   - `README.md` - Project overview and setup instructions
   - `IMPLEMENTATION_GUIDE.md` - Technical implementation details
   - `HOW_TO_RUN.md` - Step-by-step running instructions
   - Assigned to: Backend Developer

2. **UI Visualizations**
   - `UI_SCREENSHOTS.html` - Static HTML file simulating app screenshots
   - Assigned to: Frontend Developer

## How to Use the Debugging System

### Scenario 1: View Generated Code
1. Complete the Engineering Sprint (wait for tasks to finish)
2. Click "View & Debug Code" button
3. Browse the file tree on the left
4. Click any file to view its contents

### Scenario 2: Run Static Analysis
1. Open a code file in the CodeViewer
2. Click the "Lint Code" button (purple)
3. Review the issues displayed at the bottom
4. Issues are categorized by severity with line numbers

### Scenario 3: Debug an Error
1. Copy an error message from your terminal/console
2. Open the problematic file in CodeViewer
3. Paste the error message in the debug input field
4. Click "Debug & Fix" button (red)
5. Review the AI's analysis and explanation
6. The fixed code is automatically applied
7. Save the changes by clicking the refresh button

### Scenario 4: Regenerate Sprint Plan
1. Navigate to the Engineering Sprint step
2. Click the "Regenerate" button (orange, top-right of the step card)
3. Wait for the new sprint plan to be generated
4. Review the updated tasks

## Workflow Integration

```
Mission Control → Engineering Sprint → Code Generation
                                    ↓
                            View & Debug Code
                                    ↓
                    ┌───────────────┴───────────────┐
                    ↓                               ↓
            Browse Files                    Debug Errors
                    ↓                               ↓
            Lint Code                      Get AI Fixes
                    ↓                               ↓
            Review Issues              Apply Fixes Automatically
```

## Data Persistence

All debugging activities and code fixes are automatically saved to:
```
backend/data/projects/{session_id}/code/
```

Fixed files overwrite the original files, maintaining version history through the project storage system.

## Technical Details

### Backend Architecture
- **DebuggerAgent**: `backend/app/agents/engineering/debugger_agent.py`
- **API Endpoints**: `backend/app/main.py`
- **Storage**: `backend/app/services/project_storage.py`

### Frontend Architecture
- **CodeViewer**: `frontend/src/components/CodeViewer.tsx`
- **Integration**: `frontend/src/pages/MissionControl.tsx`

### Agent Instructions
- **Backend Dev**: Enhanced to write documentation
- **Frontend Dev**: Enhanced to create UI visualizations
- **Engineering Manager**: Automatically includes documentation tasks

## Future Enhancements

Potential improvements for the debugging system:
1. **Syntax Highlighting**: Add proper language-specific syntax highlighting
2. **Code Editing**: Allow inline editing of code files
3. **Test Execution**: Run tests directly from the UI
4. **Diff View**: Show before/after comparison of fixes
5. **Version Control**: Git integration for tracking changes
6. **Collaborative Debugging**: Multi-user debugging sessions
7. **Performance Profiling**: Identify performance bottlenecks
8. **Security Scanning**: Automated security vulnerability detection

## Troubleshooting

### Issue: Code files not showing
**Solution**: Click the "Refresh Project Files" button

### Issue: Debugger not providing fixes
**Solution**: Ensure the error message is clear and complete. Try rephrasing or providing more context.

### Issue: Lint results not appearing
**Solution**: The file must be selected and loaded before linting. Check that the file content is visible.

### Issue: Sprint plan missing documentation tasks
**Solution**: Regenerate the sprint plan using the "Regenerate" button.

## API Reference

### Debug Code
```typescript
POST /agent/debugger/debug?session_id={session_id}
Body: {
  error_message: string,
  code_files: Record<string, string>,
  context: object
}
Response: {
  analysis: string,
  fixes: Array<{path, content, explanation}>,
  severity: 'critical' | 'warning' | 'info'
}
```

### Lint Code
```typescript
POST /agent/debugger/lint?session_id={session_id}
Body: {
  code_files: Record<string, string>
}
Response: {
  issues: Array<{
    file: string,
    line: number,
    severity: 'error' | 'warning' | 'info',
    message: string
  }>
}
```

### Get Code File
```typescript
GET /projects/{session_id}/code/{file_path}
Response: {
  path: string,
  content: string,
  size: number
}
```

## Conclusion

The debugging and code review system provides a comprehensive solution for viewing, analyzing, and fixing generated code. It combines AI-powered debugging with traditional static analysis to create an intuitive, efficient development workflow.
