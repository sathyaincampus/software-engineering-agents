# End-to-End Testing Integration

## Overview

The E2E Testing Agent automatically generates comprehensive test plans after all development tasks are complete. It creates test suites covering critical user flows, API integration, UI/UX, error handling, and edge cases.

## How It Works

### 1. Automatic Trigger

**When**: After all coding/development tasks in the sprint are marked as "complete"

**What Happens**:
1. System detects all tasks are complete
2. "Generate E2E Tests" button appears
3. User clicks button to generate test plan
4. E2E Test Agent analyzes:
   - User stories
   - Architecture
   - Generated code (backend + frontend)
5. Generates comprehensive test plan
6. Saves test plan to project directory

### 2. Test Plan Generation

The agent creates:

**Test Suites**: Organized by feature/story
```json
{
  "suite_name": "User Authentication Flow",
  "description": "Tests for user signup, login, and profile management",
  "test_cases": [...]
}
```

**Test Cases**: Detailed test scenarios
```json
{
  "test_id": "E2E-001",
  "name": "User can sign up with email and password",
  "description": "Verify that a new user can successfully create an account",
  "priority": "Critical",
  "type": "Integration",
  "steps": [
    "Navigate to signup page",
    "Enter valid email and password",
    "Click signup button",
    "Verify user is redirected to dashboard"
  ],
  "expected_result": "User account is created and user is logged in",
  "test_data": {
    "email": "test@example.com",
    "password": "SecurePass123!"
  },
  "dependencies": [],
  "estimated_time": "2 minutes"
}
```

**Coverage Summary**:
```json
{
  "total_test_cases": 25,
  "critical_tests": 8,
  "high_priority_tests": 10,
  "medium_priority_tests": 5,
  "low_priority_tests": 2,
  "api_tests": 12,
  "ui_tests": 8,
  "integration_tests": 5
}
```

**Test Execution Plan**:
```json
{
  "smoke_tests": ["E2E-001", "E2E-002"],
  "regression_tests": ["E2E-001", "E2E-003", "E2E-005"],
  "estimated_total_time": "45 minutes"
}
```

## Where to See Test Progress

### 1. Mission Control - Engineering Sprint Section

**After all tasks are complete**:
```
┌─────────────────────────────────────────────────────┐
│  Engineering Sprint                                 │
├─────────────────────────────────────────────────────┤
│  ✓ TASK-001: Project Documentation (Complete)      │
│  ✓ TASK-002: UI Visualizations (Complete)          │
│  ...                                                │
│  ✓ TASK-051: Subscription UI (Complete)            │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │  🎉 All tasks complete!                       │ │
│  │                                               │ │
│  │  [🧪 Generate E2E Test Plan]  ← CLICK THIS   │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 2. Test Plan Viewer (New Tab)

**After generation**:
```
┌─────────────────────────────────────────────────────┐
│  Tabs: [Task List] [Story Map] [E2E Tests] ← NEW!  │
├─────────────────────────────────────────────────────┤
│  Test Coverage Summary                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │    25    │ │    8     │ │   45min  │           │
│  │  Tests   │ │ Critical │ │ Est Time │           │
│  └──────────┘ └──────────┘ └──────────┘           │
│                                                     │
│  Test Suites                                        │
│  ▼ User Authentication Flow (8 tests)               │
│    ├─ E2E-001: User can sign up ⚠️ Critical        │
│    ├─ E2E-002: User can login ⚠️ Critical          │
│    └─ E2E-003: Password reset 🔶 High              │
│                                                     │
│  ▼ Family Calendar Management (5 tests)             │
│    ├─ E2E-011: Create event ⚠️ Critical            │
│    └─ E2E-012: Edit event 🔶 High                  │
└─────────────────────────────────────────────────────┘
```

### 3. Logs Panel

**Real-time progress**:
```
[10:30:15] 🧪 Generating E2E Test Plan...
[10:30:18] Analyzing user stories...
[10:30:22] Reviewing architecture...
[10:30:28] Creating test scenarios...
[10:30:35] ✓ Generated 25 test cases
[10:30:36] 💾 Saved E2E test plan to e2e_test_plan.json
```

## Test Case Structure

### Priority Levels

- **Critical** ⚠️: Must pass before release (auth, core features)
- **High** 🔶: Important functionality
- **Medium** 🔵: Standard features
- **Low** ⚪: Nice-to-have features

### Test Types

- **API**: Backend API endpoint tests
- **UI**: Frontend user interface tests
- **Integration**: End-to-end user flow tests

### Test Case Example

```json
{
  "test_id": "E2E-015",
  "name": "Parent can create task for child",
  "description": "Verify parent can assign task to child with points",
  "priority": "Critical",
  "type": "Integration",
  "steps": [
    "Login as parent",
    "Navigate to task management",
    "Click 'Create Task'",
    "Enter task details (name, description, points)",
    "Select child from dropdown",
    "Click 'Assign Task'",
    "Verify task appears in child's task list"
  ],
  "expected_result": "Task is created and assigned to child with correct points",
  "test_data": {
    "parent_email": "parent@test.com",
    "child_name": "Johnny",
    "task_name": "Clean room",
    "points": 10
  },
  "dependencies": ["E2E-001", "E2E-003"],
  "estimated_time": "3 minutes"
}
```

## Viewing Test Results

### Test Plan File

**Location**: `/backend/data/projects/{session_id}/e2e_test_plan.json`

**Access via API**:
```http
GET /projects/{session_id}/e2e_test_plan
```

**Response**:
```json
{
  "step": "e2e_test_plan",
  "data": {
    "test_suites": [...],
    "coverage_summary": {...},
    "test_execution_plan": {...}
  }
}
```

### Frontend Integration

**Load test plan**:
```typescript
const response = await fetch(`${API_BASE_URL}/projects/${sessionId}/e2e_test_plan`);
const { data: testPlan } = await response.json();

// Access test suites
testPlan.test_suites.forEach(suite => {
  console.log(`Suite: ${suite.suite_name}`);
  console.log(`Tests: ${suite.test_cases.length}`);
});
```

## Test Execution (Future)

### Current Status

✅ **Test Plan Generation**: Fully implemented
❌ **Test Execution**: Not yet implemented

### Future Implementation

The E2E Test Agent will integrate with:

1. **Playwright** (for UI tests)
2. **Pytest** (for API tests)
3. **Cypress** (alternative for UI tests)

**Execution Flow**:
```
1. Generate test plan
2. Click "Run Tests" button
3. Agent converts test cases to executable code
4. Runs tests against deployed application
5. Reports results (passed/failed/skipped)
6. Generates test report with screenshots
```

## Benefits

### 1. Comprehensive Coverage

- Tests all user stories
- Covers critical paths
- Includes edge cases
- Tests error handling

### 2. Prioritized Testing

- Run critical tests first (smoke tests)
- Regression test suite for releases
- Performance and security tests

### 3. Documentation

- Test cases serve as living documentation
- Clear steps for manual testing
- Expected results defined

### 4. Quality Assurance

- Catch bugs before deployment
- Verify all features work end-to-end
- Ensure integration between components

### 5. Maintainability

- Well-organized test suites
- Clear test IDs and names
- Dependencies tracked

## Example Test Suites

### 1. User Authentication Flow

- Sign up with email/password
- Sign up with Google OAuth
- Login with valid credentials
- Login with invalid credentials
- Password reset flow
- Profile management
- Parental controls

### 2. Family Calendar Management

- Create calendar event
- Edit calendar event
- Delete calendar event
- Assign event to family member
- Set event category and color
- Real-time sync across devices

### 3. Task Management for Kids

- Parent creates task
- Child views assigned tasks
- Child marks task as complete
- Parent approves completion
- Points awarded correctly
- Task history tracked

### 4. Gamified Rewards System

- Define reward with point cost
- Child redeems reward
- Points deducted correctly
- Parent approves redemption
- Reward history tracked

## API Endpoints

### Generate E2E Test Plan

```http
POST /agent/e2e_test/generate?session_id={session_id}
```

**Response**:
```json
{
  "test_suites": [...],
  "coverage_summary": {...},
  "test_execution_plan": {...}
}
```

### Get Test Plan

```http
GET /projects/{session_id}/e2e_test_plan
```

## Files

### Backend

- `backend/app/agents/engineering/e2e_test_agent.py` - E2E Test Agent
- `backend/app/main.py` - API endpoint registration
- `backend/data/projects/{session_id}/e2e_test_plan.json` - Generated test plan

### Frontend (To Be Created)

- `frontend/src/components/TestPlanViewer.tsx` - Test plan viewer
- `frontend/src/pages/MissionControl.tsx` - Integration point

## Next Steps

### Phase 1: Test Plan Generation ✅

- [x] Create E2E Test Agent
- [x] Register agent in backend
- [x] Add API endpoint
- [x] Save test plan to project

### Phase 2: UI Integration (In Progress)

- [ ] Create TestPlanViewer component
- [ ] Add "E2E Tests" tab to Engineering Sprint
- [ ] Add "Generate E2E Tests" button
- [ ] Display test suites and test cases
- [ ] Show coverage summary

### Phase 3: Test Execution (Future)

- [ ] Integrate Playwright for UI tests
- [ ] Integrate Pytest for API tests
- [ ] Add "Run Tests" button
- [ ] Show test execution progress
- [ ] Display test results (passed/failed)
- [ ] Generate test report with screenshots

### Phase 4: CI/CD Integration (Future)

- [ ] Run tests on every commit
- [ ] Block deployment if critical tests fail
- [ ] Generate test coverage reports
- [ ] Track test metrics over time

## Troubleshooting

### Test Plan Not Generated

**Check**:
1. All development tasks are complete
2. User stories and architecture are loaded
3. Backend is running
4. Check logs for errors

### Missing Test Cases

**Possible Causes**:
1. User stories not detailed enough
2. Architecture missing components
3. Agent needs more context

**Solution**: Regenerate with more detailed user stories

### Test Plan Too Large

**If test plan has too many tests**:
1. Focus on critical paths first
2. Group similar tests
3. Prioritize by user story importance

## Related Documentation

- `docs/DEPENDENCY_HANDLING.md` - Task dependency logic
- `docs/STORY_MAP.md` - Story-to-task mapping
- `docs/ERROR_HANDLING.md` - Error handling system
