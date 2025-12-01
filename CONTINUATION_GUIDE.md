# Continuing from Where You Left Off - Guide

## Overview
This guide explains how to resume your project development, manage token usage, and utilize the new features added to the UI.

## 🔄 How to Continue from Where You Left Off

### Method 1: Using the Project Sidebar (Recommended)
1. **Locate the Project Sidebar**: On the right side of the Mission Control page, you'll see "Recent Projects"
2. **Click on a Project**: Click on any project to load all its saved data
3. **Automatic State Restoration**: The system will automatically:
   - Load all generated ideas, PRD, user stories, architecture, sprint plan, and code
   - Set the active step to where you left off
   - Restore all project files

### Method 2: Manual Session ID
If you know your session ID:
```javascript
// The session ID is stored in localStorage
const sessionId = localStorage.getItem('currentProjectId');
```

### What Gets Saved Automatically
The following data is persisted for each project:
- ✅ Ideas generated
- ✅ Selected idea
- ✅ Product Requirements Document (PRD)
- ✅ User stories
- ✅ System architecture
- ✅ UI design
- ✅ Sprint plan
- ✅ Backend code
- ✅ Frontend code
- ✅ QA review

### Backend API Endpoints for Loading
```
GET /projects - List all projects
GET /projects/{session_id}/ideas - Load ideas
GET /projects/{session_id}/prd - Load PRD
GET /projects/{session_id}/user_stories - Load user stories
GET /projects/{session_id}/architecture - Load architecture
GET /projects/{session_id}/sprint_plan - Load sprint plan
GET /projects/{session_id}/backend_code - Load backend code
GET /projects/{session_id}/frontend_code - Load frontend code
```

## 💰 Token Optimization Strategies

### 1. Resume Instead of Regenerate
- **DON'T**: Start a new session for the same project
- **DO**: Load the existing project from the sidebar
- **Savings**: ~90% of tokens by reusing existing data

### 2. Use Regenerate Sparingly
- Each step has a "Regenerate" button
- Only use it if you're truly unsatisfied with the output
- Consider editing the generated content manually instead

### 3. Incremental Development
- Complete one step at a time
- Review the output before proceeding
- This prevents wasting tokens on incorrect assumptions

### 4. Batch Operations
- The sprint execution runs all tasks sequentially
- This is more efficient than running tasks individually

### 5. Cache-Friendly Workflow
```
1. Generate ideas → Save session ID
2. Close browser
3. Return later → Load project from sidebar
4. Continue from where you left off
```

## 🎨 New UI Features

### 1. Collapsible Sidebars

#### Main Sidebar (SparkToShip AI)
- **Toggle Button**: Click the hamburger menu (☰) or X icon in the header
- **Collapsed Width**: 64px (icon-only mode)
- **Expanded Width**: 288px (full navigation)
- **Persistence**: State saved in localStorage as `sidebarCollapsed`

#### Project Sidebar (Recent Projects)
- **Toggle Button**: Click the chevron icon (◀/▶) in the sidebar header
- **Collapsed Width**: 48px
- **Expanded Width**: 256px
- **Persistence**: State saved in localStorage as `projectSidebarExpanded`

#### System Logs Panel
- **Toggle Button**: Click the chevron icon (◀/▶) in the logs header
- **Collapsed Width**: 1 column (minimal)
- **Expanded Width**: 4 columns (full logs)
- **Persistence**: State saved in localStorage as `logsCollapsed`
- **Dynamic Layout**: Main content area expands when logs are collapsed

### 2. Syntax-Highlighted Code Viewer

#### Features
- **Automatic Language Detection**: Based on file extension
- **Supported Languages**: TypeScript, JavaScript, Python, JSON, Markdown, CSS, HTML, YAML, Bash, SQL, Go, Rust, Java, C++, C, XML
- **Line Numbers**: Displayed for easy reference
- **Dark Theme**: VS Code Dark Plus theme
- **Scrollable**: Handles large files efficiently

#### Usage
1. Click "View & Debug Code" button after sprint completion
2. Navigate the file tree on the left
3. Click any file to view with syntax highlighting
4. Use the debugging tools to lint and fix errors

### 3. Code Walkthrough Generator

#### Features
- **Three Formats**:
  - **Text-Based**: Markdown documentation
  - **Image-Based**: Visual diagrams (coming soon - requires backend implementation)
  - **Video-Based**: Animated explanations (coming soon - requires backend implementation)

#### Usage
1. Complete the engineering sprint
2. Click "Generate Code Walkthrough" button
3. Select your preferred format
4. Click "Generate Walkthrough"
5. Download the generated documentation

#### Backend Implementation Needed
You'll need to implement these endpoints:
```python
@app.post("/agent/walkthrough/generate")
async def generate_walkthrough(request: WalkthroughRequest):
    """
    Generate code walkthrough in specified format
    
    Args:
        session_id: Project session ID
        type: 'text' | 'image' | 'video'
    
    Returns:
        For text: { "walkthrough": "markdown content" }
        For image: { "image_url": "url to generated image" }
        For video: { "video_url": "url to generated video" }
    """
    pass
```

## 🐛 Debugging Workflow

### Code Viewer Features
1. **File Browser**: Tree view of all generated files
2. **Syntax Highlighting**: Automatic based on file type
3. **Lint Code**: Click "Lint Code" to check for errors
4. **Debug & Fix**: 
   - Paste error message in the input field
   - Click "Debug & Fix"
   - AI will analyze and suggest fixes
   - Fixes are automatically applied to the code view

### Lint Results
- Displayed below the code editor
- Shows line numbers, severity, and messages
- Color-coded: Red (errors), Yellow (warnings), Blue (info)

## 📱 Responsive Layout

### Viewing Space Optimization
With all sidebars collapsed:
- **Main Sidebar**: 64px (was 288px) → **224px saved**
- **Project Sidebar**: 48px (was 256px) → **208px saved**
- **System Logs**: 1 column (was 4 columns) → **~75% saved**

**Total Additional Space**: ~500-600px for code viewing

### Recommended Layout for Coding
1. Collapse main sidebar (click ☰)
2. Collapse project sidebar (click ◀)
3. Collapse system logs (click ◀)
4. Result: Maximum space for code viewer

## 🔧 Technical Details

### State Management
- **Global State**: React Context (`ProjectContext`)
- **Local Storage**: Persists UI preferences and current project ID
- **Backend Storage**: All project data saved to backend

### File Structure
```
frontend/src/
├── components/
│   ├── CodeViewer.tsx          # Syntax-highlighted code viewer
│   ├── CodeWalkthrough.tsx     # Walkthrough generator
│   ├── MarkdownViewer.tsx      # Markdown renderer
│   ├── ProjectSidebar.tsx      # Recent projects sidebar
│   └── ...
├── context/
│   └── ProjectContext.tsx      # Global state management
├── layouts/
│   └── DashboardLayout.tsx     # Main layout with collapsible sidebar
└── pages/
    └── MissionControl.tsx      # Main workflow page
```

### Dependencies Added
```json
{
  "react-syntax-highlighter": "^16.1.0",
  "@types/react-syntax-highlighter": "^15.5.11"
}
```

## 🚀 Quick Start Checklist

- [ ] Load existing project from sidebar
- [ ] Collapse unnecessary sidebars for more space
- [ ] Review generated code with syntax highlighting
- [ ] Use lint and debug features to fix issues
- [ ] Generate code walkthrough for documentation
- [ ] Save session ID for future reference

## 💡 Tips

1. **Always load existing projects** instead of starting new sessions
2. **Use the regenerate button** only when necessary
3. **Collapse sidebars** when viewing/editing code
4. **Generate walkthroughs** for documentation and onboarding
5. **Check system logs** for debugging information

## 🔮 Future Enhancements

### Planned Features
- [ ] Search functionality across all files
- [ ] Code diff viewer for regenerated code
- [ ] Export entire project as ZIP
- [ ] Real-time collaboration
- [ ] Version history for each step
- [ ] Custom AI model selection
- [ ] Token usage dashboard

### Backend Endpoints Needed
```
POST /agent/walkthrough/generate - Generate walkthroughs
GET /projects/{session_id}/token_usage - Get token usage stats
POST /projects/{session_id}/export - Export project as ZIP
```

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify backend is running on `http://localhost:8050`
3. Clear localStorage if state seems corrupted: `localStorage.clear()`
4. Check system logs panel for detailed error messages

---

**Last Updated**: 2025-11-27
**Version**: 1.0.0
