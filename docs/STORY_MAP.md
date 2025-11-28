# Story Map Feature

## Overview

The story map is a JSON file that provides a structured view of how tasks are organized by user stories. It's automatically generated when the sprint plan is created and saved alongside it.

## Purpose

The story map makes it easy to:
1. **Visualize Dependencies**: See which tasks belong to which stories
2. **Track Progress by Story**: Monitor completion at the story level
3. **Understand Task Distribution**: See backend vs frontend task breakdown
4. **Estimate Effort**: View effort distribution per story
5. **Identify Orphan Tasks**: Find tasks without associated stories

## Structure

### Top Level

```json
{
  "stories": { ... },           // Map of story_id to story details
  "orphan_tasks": [ ... ],      // Tasks without story_id
  "total_stories": 10,          // Total number of stories
  "total_tasks": 51             // Total number of tasks
}
```

### Story Entry

Each story in the `stories` object has this structure:

```json
"User Authentication and Profile Setup": {
  "tasks": [                    // All task IDs in this story
    "TASK-003",
    "TASK-004",
    "TASK-005",
    "TASK-006",
    "TASK-007",
    "TASK-008",
    "TASK-009",
    "TASK-010"
  ],
  "backend_tasks": [            // Backend task IDs
    "TASK-003",
    "TASK-004",
    "TASK-005",
    "TASK-006",
    "TASK-007"
  ],
  "frontend_tasks": [           // Frontend task IDs
    "TASK-008",
    "TASK-009",
    "TASK-010"
  ],
  "total_tasks": 8,             // Total tasks in this story
  "effort_distribution": {      // Breakdown by effort level
    "High": 5,
    "Medium": 3,
    "Low": 0
  }
}
```

## Generation

The story map is automatically generated when the sprint plan is created:

```python
# In backend/app/main.py
@app.post("/agent/engineering_manager/run")
async def run_engineering_manager(...):
    # Create sprint plan
    result = await eng_manager_agent.create_sprint_plan(...)
    
    # Save sprint plan
    project_storage.save_step(session_id, "sprint_plan", result)
    
    # Generate and save story map
    story_map = generate_story_map(result)
    project_storage.save_step(session_id, "story_map", story_map)
```

## Storage

**Location**: `/backend/data/projects/{session_id}/story_map.json`

**Example**:
```
/backend/data/projects/392a52dd-119c-46c9-9513-726e5066c289/
├── sprint_plan.json
├── story_map.json          ← Story map
├── architecture.json
└── ...
```

## API Access

### Get Story Map

```http
GET /projects/{session_id}/story_map
```

**Response**:
```json
{
  "step": "story_map",
  "data": {
    "stories": { ... },
    "orphan_tasks": [ ... ],
    "total_stories": 10,
    "total_tasks": 51
  }
}
```

### Example Usage

```typescript
// Frontend code
const response = await fetch(`${API_BASE_URL}/projects/${sessionId}/story_map`);
const { data: storyMap } = await response.json();

// Access story details
const authStory = storyMap.stories["User Authentication and Profile Setup"];
console.log(`Auth story has ${authStory.total_tasks} tasks`);
console.log(`Backend: ${authStory.backend_tasks.length}, Frontend: ${authStory.frontend_tasks.length}`);
```

## Use Cases

### 1. Dependency Visualization

Show which tasks depend on each other:

```typescript
function getDependencies(taskId: string, storyMap: StoryMap) {
  // Find which story this task belongs to
  for (const [storyName, story] of Object.entries(storyMap.stories)) {
    if (story.tasks.includes(taskId)) {
      // Get all earlier tasks in the same story
      const taskIndex = story.tasks.indexOf(taskId);
      return story.tasks.slice(0, taskIndex);
    }
  }
  return [];
}
```

### 2. Progress Tracking by Story

Calculate completion percentage per story:

```typescript
function getStoryProgress(storyName: string, storyMap: StoryMap, taskStatuses: Record<string, string>) {
  const story = storyMap.stories[storyName];
  const completedTasks = story.tasks.filter(taskId => taskStatuses[taskId] === 'complete');
  return (completedTasks.length / story.total_tasks) * 100;
}
```

### 3. Effort Estimation

Calculate total effort by story:

```typescript
function getStoryEffort(storyName: string, storyMap: StoryMap) {
  const story = storyMap.stories[storyName];
  const effortPoints = { High: 3, Medium: 2, Low: 1 };
  
  let totalEffort = 0;
  for (const [level, count] of Object.entries(story.effort_distribution)) {
    totalEffort += effortPoints[level] * count;
  }
  
  return totalEffort;
}
```

### 4. Identify Blockers

Find which stories are blocked by failed tasks:

```typescript
function getBlockedStories(storyMap: StoryMap, taskStatuses: Record<string, string>) {
  const blockedStories = [];
  
  for (const [storyName, story] of Object.entries(storyMap.stories)) {
    const hasFailedBackend = story.backend_tasks.some(taskId => 
      taskStatuses[taskId] === 'error'
    );
    
    if (hasFailedBackend) {
      blockedStories.push({
        story: storyName,
        failedTasks: story.backend_tasks.filter(taskId => 
          taskStatuses[taskId] === 'error'
        )
      });
    }
  }
  
  return blockedStories;
}
```

### 5. Team Workload Distribution

See how work is distributed between backend and frontend:

```typescript
function getWorkloadDistribution(storyMap: StoryMap) {
  let totalBackend = 0;
  let totalFrontend = 0;
  
  for (const story of Object.values(storyMap.stories)) {
    totalBackend += story.backend_tasks.length;
    totalFrontend += story.frontend_tasks.length;
  }
  
  return {
    backend: totalBackend,
    frontend: totalFrontend,
    ratio: (totalBackend / totalFrontend).toFixed(2)
  };
}
```

## UI Integration Ideas

### 1. Story Progress Dashboard

```tsx
<div className="story-dashboard">
  {Object.entries(storyMap.stories).map(([name, story]) => (
    <div key={name} className="story-card">
      <h3>{name}</h3>
      <div className="progress-bar">
        <div style={{ width: `${getStoryProgress(name)}%` }} />
      </div>
      <div className="stats">
        <span>Backend: {story.backend_tasks.length}</span>
        <span>Frontend: {story.frontend_tasks.length}</span>
        <span>Total: {story.total_tasks}</span>
      </div>
    </div>
  ))}
</div>
```

### 2. Dependency Graph

```tsx
<div className="dependency-graph">
  {Object.entries(storyMap.stories).map(([name, story]) => (
    <div key={name} className="story-node">
      <h4>{name}</h4>
      <div className="task-list">
        {story.tasks.map(taskId => (
          <div key={taskId} className={`task ${taskStatuses[taskId]}`}>
            {taskId}
            {/* Show dependencies */}
            {getDependencies(taskId, storyMap).map(depId => (
              <div className="dependency-line" key={depId} />
            ))}
          </div>
        ))}
      </div>
    </div>
  ))}
</div>
```

### 3. Effort Heatmap

```tsx
<div className="effort-heatmap">
  {Object.entries(storyMap.stories).map(([name, story]) => {
    const effort = getStoryEffort(name, storyMap);
    const intensity = Math.min(effort / 20, 1); // Normalize to 0-1
    
    return (
      <div 
        key={name} 
        className="story-cell"
        style={{ backgroundColor: `rgba(59, 130, 246, ${intensity})` }}
      >
        <span>{name}</span>
        <span>{effort} points</span>
      </div>
    );
  })}
</div>
```

## Benefits

1. **Better Planning**: See task distribution before starting sprint
2. **Progress Visibility**: Track completion at story level
3. **Dependency Management**: Understand task relationships
4. **Resource Allocation**: Balance backend/frontend workload
5. **Risk Identification**: Spot stories with many high-effort tasks
6. **Debugging**: Quickly find which story a failed task belongs to

## Example Story Map

See `docs/examples/story_map_example.json` for a complete example.

## Related Files

- `backend/app/main.py` - Story map generation (`generate_story_map()`)
- `backend/app/services/project_storage.py` - Storage service
- `docs/examples/story_map_example.json` - Example output
- `docs/DEPENDENCY_HANDLING.md` - Dependency logic documentation

## Future Enhancements

1. **Visual Dependency Graph**: Interactive visualization of task dependencies
2. **Story Timeline**: Show estimated completion dates per story
3. **Critical Path Analysis**: Identify which stories are on the critical path
4. **Story Reordering**: Drag-and-drop to reorder stories
5. **Custom Story Grouping**: Group stories by epic or milestone
6. **Export Options**: Export story map as CSV, Excel, or Gantt chart
