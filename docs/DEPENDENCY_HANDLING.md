# Dependency-Aware Sprint Execution

## Overview

The sprint execution system now includes intelligent dependency checking to prevent cascading failures when tasks fail. This ensures that dependent tasks are automatically skipped if their prerequisites fail, saving API calls and providing clear feedback.

## How It Works

### Dependency Detection

The system identifies dependencies based on two criteria:

1. **Story-Based Dependencies**: Tasks with the same `story_id` are considered related
2. **Frontend-Backend Dependencies**: Frontend tasks depend on backend tasks within the same story

### Dependency Checking Logic

Before executing each task, the system checks:

```typescript
checkDependencies(task, allTasks, taskStatuses)
```

**For all tasks:**
- Finds all earlier tasks in the same story
- Checks if any have status `error` or `skipped`
- If yes, skips current task

**For frontend tasks:**
- Finds all backend tasks in the same story
- Checks if any have status `error` or `skipped`
- If yes, skips current task

### Example Flow

Given this sprint plan:

```
Story: "User Authentication and Profile Setup"
├── TASK-003: User Authentication Setup (Backend)
├── TASK-004: Google OAuth Integration (Backend)
├── TASK-005: User Profile Management API (Backend)
├── TASK-008: Signup and Login UI (Frontend)
└── TASK-009: Profile Setup UI (Frontend)
```

**Scenario 1: Backend Task Fails**

```
1. TASK-003 (Backend Auth) → ❌ FAILS
2. TASK-004 (Google OAuth) → ⏭️  SKIPPED
   Reason: "Required task(s) failed: TASK-003"
3. TASK-005 (Profile API) → ⏭️  SKIPPED
   Reason: "Required task(s) failed: TASK-003"
4. TASK-008 (Signup UI) → ⏭️  SKIPPED
   Reason: "Backend dependencies failed: TASK-003"
5. TASK-009 (Profile UI) → ⏭️  SKIPPED
   Reason: "Backend dependencies failed: TASK-003"
```

**Scenario 2: Middle Task Fails**

```
1. TASK-003 (Backend Auth) → ✓ SUCCESS
2. TASK-004 (Google OAuth) → ❌ FAILS
3. TASK-005 (Profile API) → ⏭️  SKIPPED
   Reason: "Required task(s) failed: TASK-004"
4. TASK-008 (Signup UI) → ⏭️  SKIPPED
   Reason: "Backend dependencies failed: TASK-004"
5. TASK-009 (Profile UI) → ⏭️  SKIPPED
   Reason: "Backend dependencies failed: TASK-004"
```

**Scenario 3: Frontend Task Fails (Backend OK)**

```
1. TASK-003 (Backend Auth) → ✓ SUCCESS
2. TASK-004 (Google OAuth) → ✓ SUCCESS
3. TASK-005 (Profile API) → ✓ SUCCESS
4. TASK-008 (Signup UI) → ❌ FAILS
5. TASK-009 (Profile UI) → ⏭️  SKIPPED
   Reason: "Required task(s) failed: TASK-008"
```

## UI Indicators

### Task Status Colors

- **Pending**: Gray - Not started yet
- **Loading**: Blue (pulsing) - Currently executing
- **Complete**: Green - Successfully completed
- **Error**: Red - Failed during execution
- **Skipped**: Yellow - Skipped due to failed dependencies

### Log Messages

**When a task is skipped:**
```
⏭️  Skipping TASK-008: Dependencies failed
   💡 Backend dependencies failed: TASK-003, TASK-004
```

**When a task fails with dependents:**
```
❌ TASK-003 failed: Agent returned empty response
📝 Details: Processed 5 events but got no text content
💡 The agent may have encountered an error or the prompt may need adjustment
⚠️  TASK-003 failed - 6 dependent task(s) will be skipped
```

**When a task fails without dependents:**
```
❌ TASK-041 failed: Agent returned empty response
⚠️  TASK-041 failed, continuing to next task...
```

## Benefits

### 1. Prevents Wasted API Calls

Without dependency checking:
```
TASK-003 fails → Still tries TASK-004, TASK-005, TASK-008, TASK-009
Result: 4 more API calls that will likely fail
```

With dependency checking:
```
TASK-003 fails → Skips TASK-004, TASK-005, TASK-008, TASK-009
Result: 0 wasted API calls, instant feedback
```

### 2. Clear Failure Cascade Visibility

Users can immediately see:
- Which task originally failed
- How many tasks were affected
- Why dependent tasks were skipped

### 3. Faster Sprint Completion

Skipping dependent tasks is instant, whereas executing them would take:
- API call time (5-30 seconds each)
- Potential timeout waiting for failures
- Rate limit delays

### 4. Better Error Messages

Instead of:
```
❌ TASK-008 failed: Cannot create UI without backend API
```

You get:
```
⏭️  Skipping TASK-008: Dependencies failed
   💡 Backend dependencies failed: TASK-003
```

## Implementation Details

### Helper Functions

#### `checkDependencies(task, allTasks, statuses)`

**Purpose**: Check if a task's dependencies have failed

**Returns**: 
- `null` if all dependencies passed
- Error message string if dependencies failed

**Logic**:
1. Find current task index in task list
2. Get all earlier tasks with same `story_id`
3. Check if any have status `error` or `skipped`
4. For frontend tasks, also check backend tasks in same story

#### `findDependentTasks(task, allTasks)`

**Purpose**: Find tasks that depend on the current task

**Returns**: Array of dependent tasks

**Logic**:
1. Find current task index
2. Get all later tasks with same `story_id`
3. Return array of dependent tasks

### Task Status Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Task Execution Flow                     │
└─────────────────────────────────────────────────────────────┘

For each task in sprint plan:
  │
  ├─► Already complete? → Skip (log: "already complete")
  │
  ├─► Check dependencies
  │    │
  │    ├─► Dependencies failed? → Mark as SKIPPED
  │    │                          Log: "Dependencies failed"
  │    │                          Continue to next task
  │    │
  │    └─► Dependencies OK → Continue
  │
  ├─► Execute task
  │    │
  │    ├─► Success → Mark as COMPLETE
  │    │
  │    └─► Error
  │         │
  │         ├─► Rate limit → Auto-retry with countdown
  │         │
  │         ├─► Token exhausted → STOP sprint
  │         │
  │         ├─► Unrecoverable → STOP sprint
  │         │
  │         └─► Generic error → Mark as ERROR
  │                             Check dependent tasks
  │                             Log warning
  │                             Continue to next task
  │
  └─► Next task
```

## Configuration

### Adjusting Dependency Logic

To modify what constitutes a dependency, edit the `checkDependencies` function:

```typescript
// Current: Same story_id = dependency
if (task.story_id) {
    const earlierTasksInStory = allTasks
        .slice(0, currentTaskIndex)
        .filter(t => t.story_id === task.story_id);
    // ...
}

// Example: Add explicit dependency field
if (task.depends_on) {
    const dependencies = allTasks.filter(t => 
        task.depends_on.includes(t.task_id)
    );
    // ...
}
```

### Disabling Dependency Checking

To disable dependency checking (not recommended):

```typescript
// Comment out the dependency check
// const hasDependencyFailures = checkDependencies(task, tasks, taskStatuses);
// if (hasDependencyFailures) {
//     addLog(`⏭️  Skipping ${task.task_id}: Dependencies failed`);
//     setTaskStatuses(prev => ({ ...prev, [task.task_id]: 'skipped' }));
//     continue;
// }
```

## Testing

### Test Scenario 1: Backend Failure

1. Start sprint with tasks TASK-003 to TASK-009
2. Force TASK-003 to fail (e.g., by causing an error)
3. Verify:
   - TASK-004, TASK-005 marked as `skipped`
   - TASK-008, TASK-009 marked as `skipped`
   - Logs show dependency failure reasons

### Test Scenario 2: Frontend Failure

1. Start sprint with tasks TASK-003 to TASK-009
2. Let TASK-003 to TASK-005 succeed
3. Force TASK-008 to fail
4. Verify:
   - TASK-009 marked as `skipped`
   - Logs show "Required task(s) failed: TASK-008"

### Test Scenario 3: Independent Tasks

1. Start sprint with tasks from different stories
2. Force one task to fail
3. Verify:
   - Only tasks in same story are skipped
   - Tasks in other stories continue executing

## Related Files

- `frontend/src/pages/MissionControl.tsx` - Main implementation
- `ADDITIONAL_FIXES.md` - Error handling documentation
- `docs/ERROR_HANDLING.md` - Comprehensive error handling guide

## Future Enhancements

1. **Explicit Dependencies**: Add `depends_on` field to task schema
2. **Partial Dependencies**: Allow tasks to proceed if some (but not all) dependencies succeed
3. **Dependency Graph Visualization**: Show dependency tree in UI
4. **Smart Retry**: Automatically retry failed tasks and their dependents
5. **Dependency Analysis**: Pre-flight check to validate dependency graph
