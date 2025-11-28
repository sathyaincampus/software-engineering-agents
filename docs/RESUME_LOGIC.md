# Resume Logic with Dependency Handling

## The Problem

When resuming a sprint with partial completion, we need to handle this scenario correctly:

```
TASK-001: complete ✓
TASK-002: complete ✓
TASK-003: error ❌ (from previous run)
TASK-004: pending
TASK-005: pending
```

**Question**: Should TASK-004 be skipped because TASK-003 has status `error`?

**Answer**: **NO!** We should retry TASK-003, and only skip TASK-004 if TASK-003 fails **in this run**.

## The Solution

### Tracking Failures Per Run

We use a `Set<string>` called `failedInThisRun` to track which tasks failed **during the current sprint execution**:

```typescript
const runSprint = async (resumeFromCurrent = false) => {
    // Track which tasks failed in THIS run (not previous runs)
    const failedInThisRun = new Set<string>();
    
    // ... rest of sprint logic
}
```

### Dependency Checking

The `checkDependencies` function now only checks `failedInThisRun`, not the persisted task statuses:

```typescript
const checkDependencies = (
    task: any,
    allTasks: any[],
    failedInThisRun: Set<string>  // Only check current run failures
): string | null => {
    // Check if any earlier tasks in the same story failed IN THIS RUN
    const failedDependencies = earlierTasksInStory.filter(t =>
        failedInThisRun.has(t.task_id)  // Not checking statuses!
    );
    // ...
}
```

### Tracking Failures

Whenever a task fails, we add it to `failedInThisRun`:

```typescript
// When task fails
setTaskStatuses(prev => ({ ...prev, [task.task_id]: 'error' }));
failedInThisRun.add(task.task_id); // Track failure in current run
```

## Execution Flow Examples

### Example 1: Resume with Failed Task

**Initial State (from previous run):**
```
TASK-001: complete ✓
TASK-002: complete ✓
TASK-003: error ❌ (Backend Auth - failed yesterday)
TASK-004: pending (Google OAuth - depends on TASK-003)
TASK-005: pending (Profile API - depends on TASK-003)
TASK-008: pending (Signup UI - depends on TASK-003)
```

**User clicks "Resume Sprint":**

```typescript
runSprint(resumeFromCurrent: true)
failedInThisRun = new Set()  // Empty! Fresh start
```

**Execution:**

1. **TASK-001**: Status = `complete` → Skip ✓
2. **TASK-002**: Status = `complete` → Skip ✓
3. **TASK-003**: Status = `error` (from yesterday)
   - Check dependencies: `failedInThisRun.has(...)` → No failures in THIS run
   - **Execute TASK-003** (retry it!)
   - **Scenario A**: Succeeds → Status = `complete`, continue
   - **Scenario B**: Fails → Status = `error`, `failedInThisRun.add('TASK-003')`

**If TASK-003 succeeds (Scenario A):**

4. **TASK-004**: Status = `pending`
   - Check dependencies: `failedInThisRun.has('TASK-003')` → `false`
   - **Execute TASK-004** ✓
5. **TASK-005**: Execute ✓
6. **TASK-008**: Execute ✓

**If TASK-003 fails again (Scenario B):**

4. **TASK-004**: Status = `pending`
   - Check dependencies: `failedInThisRun.has('TASK-003')` → `true`
   - **Skip TASK-004** (dependency failed in THIS run)
   - Log: "Required task(s) failed: TASK-003"
5. **TASK-005**: Skip (same reason)
6. **TASK-008**: Skip (backend dependency failed)

### Example 2: Resume with Mixed Statuses

**Initial State:**
```
TASK-001: complete ✓
TASK-002: error ❌
TASK-003: complete ✓
TASK-004: pending
TASK-005: error ❌
TASK-006: pending
```

**User clicks "Resume Sprint":**

```
failedInThisRun = new Set()  // Fresh start
```

**Execution:**

1. **TASK-001**: Skip (complete)
2. **TASK-002**: Status = `error`
   - Check dependencies: No failures in THIS run
   - **Retry TASK-002**
   - If succeeds → Continue
   - If fails → `failedInThisRun.add('TASK-002')`
3. **TASK-003**: Skip (complete)
4. **TASK-004**: 
   - Check dependencies based on TASK-002's result in THIS run
   - If TASK-002 succeeded → Execute
   - If TASK-002 failed → Skip
5. **TASK-005**: Status = `error`
   - **Retry TASK-005**
6. **TASK-006**:
   - Check dependencies based on TASK-005's result in THIS run

## Key Benefits

### 1. Allows Retrying Failed Tasks

Without this fix:
```
TASK-003 has status 'error' → TASK-004 always skipped
User can never recover from TASK-003 failure
```

With this fix:
```
TASK-003 has status 'error' → Retry TASK-003
If succeeds → TASK-004 executes
If fails → TASK-004 skipped (but can retry again later)
```

### 2. Prevents Stale Failures from Blocking

**Old behavior:**
- TASK-003 failed yesterday
- Today you fix the issue (e.g., update API key)
- Resume sprint
- TASK-004 still skipped because TASK-003 has status `error`
- ❌ Can't make progress!

**New behavior:**
- TASK-003 failed yesterday
- Today you fix the issue
- Resume sprint
- TASK-003 is retried (fresh chance!)
- If succeeds → TASK-004 executes
- ✓ Can make progress!

### 3. Maintains Dependency Safety

Even though we ignore old statuses, we still maintain safety:
- If TASK-003 fails **in this run** → TASK-004 is skipped
- Dependencies are still enforced
- Just based on current run, not historical data

## Implementation Details

### State Management

**Persisted State (taskStatuses):**
- Saved to backend
- Persists across page reloads
- Shows historical status
- Used for UI display

**Runtime State (failedInThisRun):**
- Only exists during sprint execution
- Resets on each `runSprint()` call
- Used for dependency checking
- Not persisted

### Resume vs Fresh Start

**Fresh Start (`resumeFromCurrent = false`):**
```typescript
// Reset all statuses to pending
const initialStatuses = {};
tasks.forEach(t => initialStatuses[t.task_id] = 'pending');
setTaskStatuses(initialStatuses);
```

**Resume (`resumeFromCurrent = true`):**
```typescript
// Keep existing statuses
// Don't reset taskStatuses
// But failedInThisRun is still empty (fresh)
```

## Testing Scenarios

### Test 1: Retry Failed Task

1. Run sprint, TASK-003 fails
2. Fix the issue (e.g., update code, API key)
3. Click "Resume Sprint"
4. Verify: TASK-003 is retried (not skipped)
5. If succeeds: TASK-004 executes
6. If fails: TASK-004 skipped

### Test 2: Multiple Failed Tasks

1. Run sprint, TASK-002 and TASK-005 fail
2. Click "Resume Sprint"
3. Verify: Both are retried
4. Dependent tasks only skip if dependencies fail in THIS run

### Test 3: Partial Completion

1. Run sprint, complete TASK-001, TASK-002, TASK-003
2. TASK-004 fails
3. Click "Resume Sprint"
4. Verify: TASK-001, TASK-002, TASK-003 skipped (complete)
5. Verify: TASK-004 retried
6. Verify: TASK-005 only skips if TASK-004 fails in THIS run

## Edge Cases Handled

### Case 1: Task Fails Multiple Times

```
Run 1: TASK-003 fails → failedInThisRun.add('TASK-003')
User clicks "Resume Sprint"
Run 2: failedInThisRun = new Set() (reset)
        TASK-003 retried → Can succeed this time!
```

### Case 2: Dependency Chain

```
TASK-003 → TASK-004 → TASK-005 (all depend on each other)
TASK-003 fails in Run 1
Resume Sprint (Run 2):
  - TASK-003 retried
  - If succeeds: TASK-004, TASK-005 execute
  - If fails: TASK-004, TASK-005 skipped
```

### Case 3: Mixed Success/Failure

```
Story has: TASK-003 (Backend), TASK-004 (Backend), TASK-008 (Frontend)
Run 1: TASK-003 succeeds, TASK-004 fails
Resume Sprint (Run 2):
  - TASK-003 skipped (complete)
  - TASK-004 retried
  - TASK-008 depends on result of TASK-004 in THIS run
```

## Related Files

- `frontend/src/pages/MissionControl.tsx` - Implementation
- `docs/DEPENDENCY_HANDLING.md` - Dependency logic documentation
- `ADDITIONAL_FIXES.md` - Error handling documentation

## Future Enhancements

1. **Manual Dependency Override**: Allow user to force execute a task even if dependencies failed
2. **Dependency Graph Visualization**: Show which tasks are blocked and why
3. **Smart Retry**: Automatically retry failed tasks with exponential backoff
4. **Batch Retry**: "Retry all failed tasks" button
5. **Dependency Analysis**: Pre-flight check to show what will be skipped
