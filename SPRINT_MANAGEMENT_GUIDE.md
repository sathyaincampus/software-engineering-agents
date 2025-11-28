# Sprint Management & Code Generation - Complete Guide

## Overview
This guide explains how to manage sprint execution, handle failures, and resume code generation from where you left off.

## 🎯 Key Features

### 1. **Regenerate Sprint Plan**
- **Location**: "Regenerate" button in the Engineering Sprint step header
- **Purpose**: Creates a new sprint plan if you're unhappy with the current tasks
- **When to use**: 
  - Sprint plan doesn't match your requirements
  - You want to reorganize tasks differently
  - Architecture has changed significantly

### 2. **Smart Sprint Execution**
The system intelligently manages sprint execution with three states:

#### State 1: Initial Sprint (No tasks executed yet)
**Button**: "Start Sprint Execution" (Blue)
- Appears when sprint plan exists but no tasks have been executed
- Initializes all tasks as 'pending'
- Executes all tasks sequentially

#### State 2: Incomplete Sprint (Some tasks pending/failed)
**Button**: "Resume Sprint (Continue from where it left off)" (Orange)
- Appears when there are failed or pending tasks
- Shows count of failed and pending tasks
- **Smart Resume**: Skips completed tasks, only runs pending/failed ones
- **Token Efficient**: Doesn't re-run successful tasks

#### State 3: Completed Sprint
**Message**: "Sprint successfully completed!" (Green)
- All tasks completed successfully
- Ready to view and debug code

### 3. **Individual Task Controls**

Each task card shows different controls based on its status:

#### Pending Tasks
- **Status Badge**: Gray "Pending"
- **Run Button**: Blue "Run" button (appears after sprint has started)
- **Action**: Executes just this specific task

#### Loading Tasks
- **Status Badge**: Blue "Loading" with spinner
- **Background**: Blue highlight
- **No buttons**: Task is currently executing

#### Completed Tasks
- **Status Badge**: Green "Complete" with checkmark
- **Background**: Green highlight
- **No buttons**: Task successfully completed

#### Failed Tasks
- **Status Badge**: Red "Error" with X icon
- **Background**: Red highlight
- **Retry Button**: Red "Retry" button
- **Action**: Re-executes just this failed task

## 💡 How to Continue from Where You Left Off

### Scenario 1: Token Limit Exceeded Mid-Sprint

**What happens:**
```
Task 1: ✅ Complete
Task 2: ✅ Complete
Task 3: ❌ Error (Token limit exceeded)
Task 4: ⏸️  Pending
Task 5: ⏸️  Pending
```

**How to resume:**
1. **Change your API keys** (as you mentioned you did)
2. Click the **"Resume Sprint"** button
3. System will:
   - ✅ Skip Task 1 (already complete)
   - ✅ Skip Task 2 (already complete)
   - 🔄 Retry Task 3 (failed)
   - ▶️  Execute Task 4 (pending)
   - ▶️  Execute Task 5 (pending)

**Token savings**: ~60% (only runs 3 tasks instead of 5)

### Scenario 2: Specific Task Failed

**What happens:**
```
Task 1: ✅ Complete
Task 2: ❌ Error (Syntax error in generated code)
Task 3: ✅ Complete
```

**How to fix:**
1. Click the **"Retry" button** on Task 2 only
2. System will re-execute just that task
3. Other tasks remain unchanged

### Scenario 3: Load Existing Project with Partial Code

**What happens:**
- You load a project from the sidebar
- Sprint plan exists
- Some code was generated previously
- Task statuses are not loaded (limitation)

**How to resume:**
1. The sprint plan will show all tasks
2. Click **"Start Sprint Execution"**
3. System will attempt to generate all code
4. **Backend should check** if code already exists and skip

**Recommended Backend Enhancement:**
```python
@app.post("/agent/backend_dev/run")
async def run_backend_dev(task, session_id):
    # Check if code already exists for this task
    existing_code = await storage.get_task_code(session_id, task.task_id)
    if existing_code:
        return {"status": "already_complete", "code": existing_code}
    
    # Generate new code
    code = await generate_code(task)
    await storage.save_task_code(session_id, task.task_id, code)
    return {"status": "success", "code": code}
```

## 🔄 Complete Workflow Examples

### Example 1: Fresh Start
```
1. Create sprint plan → ✅
2. Click "Start Sprint Execution" → ▶️
3. All 5 tasks execute sequentially → ✅✅✅✅✅
4. View generated code → 👀
```

### Example 2: Resume After Failure
```
1. Sprint running → ▶️▶️▶️
2. Task 3 fails (token limit) → ✅✅❌⏸️⏸️
3. Change API keys → 🔑
4. Click "Resume Sprint" → ⏭️⏭️🔄▶️▶️
5. Completes remaining tasks → ✅✅✅✅✅
```

### Example 3: Fix Individual Task
```
1. Sprint completes with one error → ✅✅❌✅✅
2. Review error in logs → 📋
3. Click "Retry" on failed task → 🔄
4. Task completes → ✅✅✅✅✅
```

### Example 4: Manual Task Execution
```
1. Sprint plan created → 📋
2. Click "Start Sprint" → ▶️
3. First 2 tasks complete → ✅✅⏸️⏸️⏸️
4. Pause to review code → 👀
5. Click "Run" on Task 3 → ▶️
6. Click "Run" on Task 4 → ▶️
7. Complete remaining tasks → ✅✅✅✅✅
```

## 🎨 Visual Status Indicators

### Task Card Colors
- **Green background**: Task completed successfully
- **Red background**: Task failed with error
- **Blue background**: Task currently executing
- **Gray background**: Task pending execution

### Button Colors
- **Blue "Start Sprint"**: Initial execution
- **Orange "Resume Sprint"**: Continue incomplete sprint
- **Red "Retry"**: Retry failed task
- **Blue "Run"**: Execute pending task
- **Orange "Regenerate"**: Regenerate sprint plan

## 📊 Sprint Progress Tracking

The system shows real-time progress:

```
┌─────────────────────────────────────┐
│ Engineering Sprint                   │
│ [Regenerate]                         │
├─────────────────────────────────────┤
│ 1. Setup Backend ✅ Complete         │
│ 2. Create API    ✅ Complete         │
│ 3. Add Auth      ❌ Error [Retry]    │
│ 4. Frontend UI   ⏸️  Pending [Run]   │
│ 5. Testing       ⏸️  Pending [Run]   │
├─────────────────────────────────────┤
│ 2 failed, 2 pending                  │
│ [Resume Sprint]                      │
└─────────────────────────────────────┘
```

## 🚀 Best Practices

### 1. **Monitor System Logs**
- Watch for token usage warnings
- Check for API errors
- Verify task completion messages

### 2. **Use Resume Instead of Restart**
- ✅ Click "Resume Sprint" to continue
- ❌ Don't click "Regenerate" unless you want new tasks
- 💰 Saves tokens by skipping completed work

### 3. **Retry Individual Tasks First**
- If only one task failed, use its "Retry" button
- Faster than resuming entire sprint
- More targeted error fixing

### 4. **Review Before Proceeding**
- Check completed tasks before continuing
- Use "View & Debug Code" to inspect output
- Fix issues early to prevent cascading failures

### 5. **Save Your Session ID**
- Copy session ID from URL or localStorage
- Allows you to resume later
- Useful for long-running sprints

## 🔧 Technical Implementation

### State Management
```typescript
// Task statuses are stored in component state
const [taskStatuses, setTaskStatuses] = useState<Record<string, Status>>({
  'TASK-001': 'complete',
  'TASK-002': 'complete',
  'TASK-003': 'error',
  'TASK-004': 'pending',
  'TASK-005': 'pending'
});
```

### Smart Resume Logic
```typescript
const runSprint = async (resumeFromCurrent = false) => {
  for (const task of tasks) {
    // Skip completed tasks when resuming
    if (taskStatuses[task.task_id] === 'complete') {
      addLog(`⏭️ Skipping ${task.task_id} (already complete)`);
      continue;
    }
    
    // Execute pending or failed tasks
    await executeTask(task);
  }
};
```

### Individual Task Retry
```typescript
const retryTask = async (task) => {
  setTaskStatuses(prev => ({ ...prev, [task.task_id]: 'loading' }));
  try {
    await executeTask(task);
    setTaskStatuses(prev => ({ ...prev, [task.task_id]: 'complete' }));
  } catch (e) {
    setTaskStatuses(prev => ({ ...prev, [task.task_id]: 'error' }));
  }
};
```

## 🐛 Troubleshooting

### Issue: "Resume Sprint" button not appearing
**Cause**: All tasks are either complete or loading
**Solution**: Wait for loading tasks to finish, or check if all tasks completed

### Issue: Tasks re-running even though they completed
**Cause**: Task statuses not persisted across page reloads
**Solution**: Backend should track task completion and return existing code

### Issue: Token limit still exceeded after resume
**Cause**: Individual task requires too many tokens
**Solution**: 
1. Break task into smaller subtasks
2. Use a model with higher token limit
3. Simplify the task requirements

### Issue: Can't see generated code
**Cause**: Code browser not refreshed
**Solution**: Click "Refresh Project Files" button

## 📈 Future Enhancements

### Planned Features
- [ ] Persist task statuses to backend
- [ ] Show token usage per task
- [ ] Estimate remaining tokens
- [ ] Parallel task execution (where possible)
- [ ] Task dependencies visualization
- [ ] Rollback to previous task version
- [ ] Export sprint execution report

### Backend Endpoints Needed
```
GET  /projects/{session_id}/task_statuses - Get task execution status
POST /projects/{session_id}/task_statuses - Save task status
GET  /projects/{session_id}/task/{task_id}/code - Get code for specific task
POST /projects/{session_id}/task/{task_id}/retry - Retry specific task
```

## 💰 Token Optimization Tips

1. **Always Resume**: Use "Resume Sprint" instead of starting over
2. **Retry Individually**: Fix single failures with "Retry" button
3. **Review Incrementally**: Check code after each task to catch issues early
4. **Load Projects**: Resume existing projects instead of creating new ones
5. **Monitor Logs**: Watch for token warnings and stop before limits

---

**Last Updated**: 2025-11-27
**Version**: 2.0.0
