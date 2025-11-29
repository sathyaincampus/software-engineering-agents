# How to View Generated Walkthroughs - Step by Step Guide

## Quick Answer
**Location**: Mission Control page → Scroll to bottom → Click "Generate Code Walkthrough" button

---

## Detailed Steps

### Step 1: Navigate to Mission Control
1. Open the app in your browser
2. Click on **"Mission Control"** in the left sidebar
3. Or go directly to: `http://localhost:3000/mission-control`

### Step 2: Load Your Project
1. Look at the **left sidebar** under "Recent Projects"
2. Click on **"FamilyFlow"** (your project)
3. Wait for the project to load

### Step 3: Scroll to Bottom
1. Scroll down to the **bottom** of the Mission Control page
2. You should see the "Engineering Sprint" section
3. Below the task list, there should be a purple button

### Step 4: Click "Generate Code Walkthrough"
1. Look for a **purple button** that says:
   - "Generate Code Walkthrough" (if not clicked yet)
   - "Hide Walkthrough Generator" (if already clicked)
2. Click this button

### Step 5: View Existing Walkthroughs
1. After clicking, the Walkthrough Generator will appear below
2. You'll see two buttons at the top:
   - **"Generate New"**
   - **"View Existing"** ← Click this one!
3. Click **"View Existing"**

### Step 6: Switch Between Walkthrough Types
1. You'll see 3 tabs:
   - 📄 **Text-Based**
   - 🖼️ **Image-Based**
   - 🎥 **Video-Based**
2. Click any tab to view that walkthrough type
3. All 3 should be enabled (not grayed out)

---

## Visual Guide

```
┌─────────────────────────────────────────────────────┐
│ Mission Control                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Engineering Sprint                                  │
│ ┌─────────────────────────────────────────────┐   │
│ │ Task List │ Story Map │ E2E Tests           │   │
│ ├─────────────────────────────────────────────┤   │
│ │                                             │   │
│ │ ✓ Task 1 - Complete                         │   │
│ │ ✓ Task 2 - Complete                         │   │
│ │ ✓ Task 3 - Complete                         │   │
│ │                                             │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ 📄 Generate Code Walkthrough                │ ← CLICK HERE!
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ (After clicking, Walkthrough Generator appears)    │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ Code Walkthrough Generator                  │   │
│ │                                             │   │
│ │ [Generate New] [View Existing] ← CLICK!     │   │
│ │                                             │   │
│ │ [📄 Text] [🖼️ Image] [🎥 Video] ← TABS      │   │
│ │                                             │   │
│ │ Walkthrough content appears here...         │   │
│ └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## Troubleshooting

### Issue 1: "Generate Code Walkthrough" Button Not Visible

**Possible Causes**:
1. No tasks are complete yet
2. Project not loaded
3. Need to scroll down

**Solutions**:
1. Make sure at least one task is marked as complete
2. Load your project from the sidebar
3. Scroll to the very bottom of the page

---

### Issue 2: "View Existing" Not Showing Walkthroughs

**Possible Causes**:
1. Walkthroughs not generated yet
2. Backend not running
3. Wrong session ID

**Solutions**:
1. Generate walkthroughs first using "Generate New"
2. Make sure backend is running on port 8050
3. Check that you loaded the correct project

---

### Issue 3: Tabs Are Grayed Out

**Possible Causes**:
1. Walkthroughs not generated for that type
2. Files don't exist

**Solutions**:
1. Click on the grayed-out tab
2. Click "Generate {type} walkthrough" button
3. Wait for generation to complete

---

## Alternative: Direct API Access

If the UI isn't working, you can access walkthroughs directly:

### View Text Walkthrough
```
http://localhost:8050/projects/392a52dd-119c-46c9-9513-726e5066c289/walkthrough_text
```

### View Image Walkthrough
```
http://localhost:8050/projects/392a52dd-119c-46c9-9513-726e5066c289/walkthrough_image
```

### View Video Walkthrough
```
http://localhost:8050/projects/392a52dd-119c-46c9-9513-726e5066c289/walkthrough_video
```

Open these URLs in your browser to see the raw JSON data.

---

## Expected Behavior

### When Button is Visible
- ✅ At least one task is complete
- ✅ Project is loaded
- ✅ You're on Mission Control page
- ✅ Scrolled to bottom

### When Button is Hidden
- ❌ No tasks complete yet
- ❌ No project loaded
- ❌ Not on Mission Control page

### When Walkthroughs Load
- ✅ All 3 tabs enabled
- ✅ Can click between tabs
- ✅ Content appears when tab is clicked
- ✅ Diagrams render visually

---

## Quick Checklist

Before looking for walkthroughs:
- [ ] Backend is running (port 8050)
- [ ] Frontend is running (port 3000)
- [ ] Project "FamilyFlow" is loaded
- [ ] On Mission Control page
- [ ] Scrolled to bottom
- [ ] At least one task is complete
- [ ] Purple button is visible

After clicking button:
- [ ] Walkthrough Generator appears
- [ ] "View Existing" button is visible
- [ ] Clicked "View Existing"
- [ ] 3 tabs are visible
- [ ] At least one tab is enabled

---

## Still Not Seeing It?

### Check Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for errors
4. Check Network tab for failed requests

### Check Backend Logs
1. Look at terminal where backend is running
2. Check for errors when loading walkthroughs
3. Verify files exist in:
   ```
   backend/data/projects/392a52dd.../walkthrough_text.json
   backend/data/projects/392a52dd.../walkthrough_image.json
   backend/data/projects/392a52dd.../walkthrough_video.json
   ```

### Verify Files Exist
```bash
ls -la backend/data/projects/392a52dd-119c-46c9-9513-726e5066c289/walkthrough_*.json
```

Should show:
```
walkthrough_text.json
walkthrough_image.json
walkthrough_video.json
```

---

## Summary

**To view walkthroughs**:
1. Go to Mission Control
2. Load FamilyFlow project
3. Scroll to bottom
4. Click purple "Generate Code Walkthrough" button
5. Click "View Existing"
6. Click tabs to switch between types

**Location**: Bottom of Mission Control page, below task list

**Button color**: Purple

**Button text**: "Generate Code Walkthrough"
