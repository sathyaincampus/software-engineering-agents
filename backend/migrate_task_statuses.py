#!/usr/bin/env python3
"""
Migration script to analyze generated code and mark tasks as complete
"""
import json
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.project_storage import project_storage

def analyze_task_completion(session_id: str):
    """
    Analyze generated code files and determine which tasks are complete
    """
    project_dir = project_storage.get_project_dir(session_id)
    code_dir = project_dir / "code"
    
    # Load sprint plan
    sprint_plan = project_storage.load_step(session_id, "sprint_plan")
    if not sprint_plan:
        print(f"❌ No sprint plan found for session {session_id}")
        return
    
    tasks = sprint_plan.get("sprint_plan", [])
    if not tasks:
        print(f"❌ No tasks found in sprint plan")
        return
    
    print(f"\n📊 Analyzing {len(tasks)} tasks for session {session_id}...")
    print(f"📁 Code directory: {code_dir}\n")
    
    # Task completion mapping based on file patterns
    task_file_patterns = {
        "TASK-001": ["README.md", "IMPLEMENTATION_GUIDE.md", "HOW_TO_RUN.md"],
        "TASK-002": ["UI_SCREENSHOTS.html"],
        "TASK-003": ["backend/src/routes/auth.py", "backend/src/models/user.py", "backend/src/controllers/authController"],
        "TASK-004": ["backend/src/routes/auth.py", "backend/src/services/googleAuth", "backend/src/config/passport"],
        "TASK-005": ["backend/src/routes/profile", "backend/src/models/profile", "backend/src/controllers/profileController"],
        "TASK-006": ["backend/src/services/s3", "backend/src/routes/upload", "backend/src/controllers/uploadController"],
        "TASK-007": ["backend/src/routes/parental", "backend/src/models/parentalControl", "backend/src/controllers/parentalController"],
        "TASK-008": ["frontend/src/screens/Auth/", "frontend/src/components/Auth/"],
        "TASK-009": ["frontend/src/screens/Profile/", "frontend/src/components/Profile/"],
        "TASK-010": ["frontend/src/screens/Parental/", "frontend/src/components/Parental/"],
        "TASK-011": ["backend/src/routes/calendar", "backend/src/models/event", "backend/src/controllers/calendarController"],
        "TASK-012": ["backend/src/models/event", "backend/src/models/category"],
        "TASK-013": ["backend/src/socket", "backend/src/services/socketService"],
        "TASK-014": ["frontend/src/screens/Calendar/", "frontend/src/components/Calendar/"],
        "TASK-015": ["frontend/src/components/Calendar/AddEditEventModal"],
        "TASK-016": ["backend/src/models/recurringEvent", "backend/src/routes/recurring"],
        "TASK-017": ["backend/src/services/recurringService", "backend/src/cron/"],
        "TASK-018": ["frontend/src/components/Calendar/RecurringEventForm"],
        "TASK-019": ["backend/src/routes/tasks", "backend/src/models/task", "backend/src/controllers/taskController"],
        "TASK-020": ["backend/src/models/task", "backend/src/services/taskTracking"],
    }
    
    completed_count = 0
    pending_count = 0
    
    for task in tasks:
        task_id = task.get("task_id")
        title = task.get("title")
        assignee = task.get("assignee", "").lower()
        
        # Check if code files exist for this task
        is_complete = False
        
        # Method 1: Check specific file patterns if defined
        if task_id in task_file_patterns:
            patterns = task_file_patterns[task_id]
            for pattern in patterns:
                # Check if any file matching the pattern exists
                matching_files = list(code_dir.glob(f"**/*{pattern}*"))
                if matching_files:
                    is_complete = True
                    break
        
        # Method 2: General heuristic based on assignee
        if not is_complete:
            if "backend" in assignee:
                # Check for backend files
                backend_files = list((code_dir / "backend").rglob("*.py")) + \
                               list((code_dir / "backend").rglob("*.js"))
                if backend_files:
                    # If backend directory has files, assume early backend tasks are done
                    task_num = int(task_id.split("-")[1])
                    if task_num <= 20:  # First 20 tasks
                        is_complete = True
            elif "frontend" in assignee:
                # Check for frontend files
                frontend_files = list((code_dir / "frontend").rglob("*.tsx")) + \
                                list((code_dir / "frontend").rglob("*.ts")) + \
                                list((code_dir / "frontend").rglob("*.jsx"))
                if frontend_files:
                    # If frontend directory has files, assume early frontend tasks are done
                    task_num = int(task_id.split("-")[1])
                    if task_num <= 20:  # First 20 tasks
                        is_complete = True
        
        # Save task status
        status = "complete" if is_complete else "pending"
        project_storage.save_task_status(session_id, task_id, status)
        
        if is_complete:
            completed_count += 1
            print(f"✅ {task_id}: {title} - COMPLETE")
        else:
            pending_count += 1
            print(f"⏸️  {task_id}: {title} - PENDING")
    
    print(f"\n📈 Summary:")
    print(f"   ✅ Completed: {completed_count}")
    print(f"   ⏸️  Pending: {pending_count}")
    print(f"   📊 Total: {len(tasks)}")
    print(f"\n💾 Task statuses saved to: {project_dir}/task_statuses.json")
    
    return {
        "completed": completed_count,
        "pending": pending_count,
        "total": len(tasks)
    }

if __name__ == "__main__":
    # Default session ID
    session_id = "392a52dd-119c-46c9-9513-726e5066c289"
    
    # Allow override from command line
    if len(sys.argv) > 1:
        session_id = sys.argv[1]
    
    print(f"🔍 Migrating task statuses for session: {session_id}\n")
    
    try:
        result = analyze_task_completion(session_id)
        print(f"\n✅ Migration completed successfully!")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
