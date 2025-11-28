from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.core.orchestrator import orchestrator
from app.core.config import settings
from app.core.model_config import ModelConfig, AppSettings
from app.core.model_factory import ModelFactory
from app.agents.strategy.idea_generator import IdeaGeneratorAgent
from app.agents.strategy.product_requirements import ProductRequirementsAgent
from app.agents.strategy.requirement_analysis import RequirementAnalysisAgent
from app.agents.architecture.software_architect import SoftwareArchitectAgent
from app.agents.architecture.ux_designer import UXDesignerAgent
from app.agents.engineering.engineering_manager import EngineeringManagerAgent
from app.agents.engineering.backend_dev import BackendDevAgent
from app.agents.engineering.frontend_dev import FrontendDevAgent
from app.agents.engineering.debugger_agent import DebuggerAgent
from app.agents.engineering.qa_agent import QAAgent
from app.services.project_storage import project_storage
from typing import Dict, Any, List
import json
import asyncio
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="ZeroToOne AI API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global settings (must be initialized before agents)
app_settings = AppSettings(
    ai_model_config=ModelConfig(
        provider="google",
        model_name=settings.MODEL_NAME,
        api_key=settings.GOOGLE_API_KEY
    )
)

# Register Agents
idea_agent = IdeaGeneratorAgent()
prd_agent = ProductRequirementsAgent()
analysis_agent = RequirementAnalysisAgent()
architect_agent = SoftwareArchitectAgent()
ux_agent = UXDesignerAgent()
eng_manager_agent = EngineeringManagerAgent()
backend_dev_agent = BackendDevAgent()
frontend_dev_agent = FrontendDevAgent()
qa_agent = QAAgent()
debugger_agent = DebuggerAgent()

orchestrator.register_agent("idea_generator", idea_agent)
orchestrator.register_agent("product_requirements", prd_agent)
orchestrator.register_agent("requirement_analysis", analysis_agent)
orchestrator.register_agent("software_architect", architect_agent)
orchestrator.register_agent("ux_designer", ux_agent)
orchestrator.register_agent("engineering_manager", eng_manager_agent)
orchestrator.register_agent("backend_dev", backend_dev_agent)
orchestrator.register_agent("frontend_dev", frontend_dev_agent)
orchestrator.register_agent("qa_agent", qa_agent)
orchestrator.register_agent("debugger_agent", debugger_agent)

# ... (previous models)

class DesignArchitectureRequest(BaseModel):
    requirements: Dict[str, Any]

class DesignUIRequest(BaseModel):
    requirements: Dict[str, Any]

class StartSessionRequest(BaseModel):
    project_name: str

class GenerateIdeasRequest(BaseModel):
    keywords: str

class GeneratePRDRequest(BaseModel):
    idea_context: Dict[str, Any]

class AnalyzePRDRequest(BaseModel):
    prd_content: str

class CreateSprintPlanRequest(BaseModel):
    user_stories: List[Dict[str, Any]]
    architecture: Dict[str, Any]

class WriteCodeRequest(BaseModel):
    task: Dict[str, Any]
    context: Dict[str, Any]

class ReviewCodeRequest(BaseModel):
    code_files: Dict[str, Any]

class DebugCodeRequest(BaseModel):
    error_message: str
    code_files: Dict[str, str]
    context: Dict[str, Any]

class LintCodeRequest(BaseModel):
    code_files: Dict[str, str]

# ... (previous endpoints)


@app.post("/agent/engineering_manager/run")
async def run_engineering_manager(session_id: str, request: CreateSprintPlanRequest):
    session = orchestrator.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.add_log("Creating Sprint Plan...")
    result = await eng_manager_agent.create_sprint_plan(request.user_stories, request.architecture, session_id)
    session.add_log("Sprint Plan created")
    
    # Save sprint plan to filesystem
    try:
        file_path = project_storage.save_step(session_id, "sprint_plan", result)
        session.add_log(f"💾 Saved sprint plan to {file_path}")
    except Exception as e:
        logger.error(f"Failed to save sprint plan: {e}")
    
    # Generate and save story-to-task mapping
    try:
        story_map = generate_story_map(result)
        file_path = project_storage.save_step(session_id, "story_map", story_map)
        session.add_log(f"💾 Saved story map to {file_path}")
    except Exception as e:
        logger.error(f"Failed to save story map: {e}")
        
    return result

def generate_story_map(sprint_plan_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate a story-to-task mapping from the sprint plan.
    
    Returns:
        {
            "stories": {
                "Story Name": {
                    "tasks": ["TASK-001", "TASK-002"],
                    "backend_tasks": ["TASK-001"],
                    "frontend_tasks": ["TASK-002"],
                    "total_tasks": 2,
                    "effort_distribution": {"High": 1, "Medium": 1, "Low": 0}
                }
            },
            "orphan_tasks": ["TASK-003"],  # Tasks without story_id
            "total_stories": 5,
            "total_tasks": 50
        }
    """
    tasks = sprint_plan_result.get("sprint_plan", [])
    
    story_map = {
        "stories": {},
        "orphan_tasks": [],
        "total_stories": 0,
        "total_tasks": len(tasks)
    }
    
    for task in tasks:
        story_id = task.get("story_id")
        task_id = task.get("task_id")
        assignee = task.get("assignee", "").lower()
        effort = task.get("effort", "Medium")
        
        if not story_id:
            # Task without story_id
            story_map["orphan_tasks"].append(task_id)
            continue
        
        # Initialize story entry if not exists
        if story_id not in story_map["stories"]:
            story_map["stories"][story_id] = {
                "tasks": [],
                "backend_tasks": [],
                "frontend_tasks": [],
                "total_tasks": 0,
                "effort_distribution": {"High": 0, "Medium": 0, "Low": 0}
            }
        
        # Add task to story
        story_entry = story_map["stories"][story_id]
        story_entry["tasks"].append(task_id)
        story_entry["total_tasks"] += 1
        
        # Categorize by assignee
        if "backend" in assignee:
            story_entry["backend_tasks"].append(task_id)
        elif "frontend" in assignee:
            story_entry["frontend_tasks"].append(task_id)
        
        # Track effort distribution
        if effort in story_entry["effort_distribution"]:
            story_entry["effort_distribution"][effort] += 1
    
    story_map["total_stories"] = len(story_map["stories"])
    
    return story_map


@app.post("/agent/backend_dev/run")
async def run_backend_dev(session_id: str, request: WriteCodeRequest):
    from app.utils.error_handler import handle_adk_errors
    
    session = orchestrator.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.add_log(f"Writing Backend Code for task: {request.task.get('title')}...")
    
    # Wrap the agent call with error handler
    async def execute_task():
        return await backend_dev_agent.write_code(request.task, request.context, session_id)
    
    result = await handle_adk_errors(execute_task)
    
    # Check if there was an error
    if not result.get("success"):
        error_info = {
            "error": result.get("error"),
            "error_type": result.get("error_type"),
            "retry_after": result.get("retry_after"),
            "recoverable": result.get("recoverable"),
            "suggestion": result.get("suggestion"),
            "task_id": request.task.get('task_id')
        }
        session.add_log(f"❌ Error: {result.get('error')}")
        if result.get("suggestion"):
            session.add_log(f"💡 Suggestion: {result.get('suggestion')}")
        
        # Return error info instead of raising HTTPException
        return error_info
    
    # Success path
    actual_result = result.get("data")
    session.add_log("Backend Code written")
    
    # Save code files
    if "files" in actual_result:
        for file in actual_result["files"]:
            try:
                file_path = project_storage.save_code_file(session_id, file["path"], file["content"])
                session.add_log(f"💾 Saved {file['path']}")
            except Exception as e:
                logger.error(f"Failed to save file {file.get('path')}: {e}")
    
    # Save task status as complete
    task_id = request.task.get('task_id')
    if task_id:
        try:
            project_storage.save_task_status(session_id, task_id, 'complete')
            session.add_log(f"✅ Task {task_id} marked as complete")
        except Exception as e:
            logger.error(f"Failed to save task status: {e}")
    
    return actual_result

@app.post("/agent/frontend_dev/run")
async def run_frontend_dev(session_id: str, request: WriteCodeRequest):
    from app.utils.error_handler import handle_adk_errors
    
    session = orchestrator.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.add_log(f"Writing Frontend Code for task: {request.task.get('title')}...")
    
    # Wrap the agent call with error handler
    async def execute_task():
        return await frontend_dev_agent.write_code(request.task, request.context, session_id)
    
    result = await handle_adk_errors(execute_task)
    
    # Check if there was an error
    if not result.get("success"):
        error_info = {
            "error": result.get("error"),
            "error_type": result.get("error_type"),
            "retry_after": result.get("retry_after"),
            "recoverable": result.get("recoverable"),
            "suggestion": result.get("suggestion"),
            "task_id": request.task.get('task_id')
        }
        session.add_log(f"❌ Error: {result.get('error')}")
        if result.get("suggestion"):
            session.add_log(f"💡 Suggestion: {result.get('suggestion')}")
        
        # Return error info instead of raising HTTPException
        return error_info
    
    # Success path
    actual_result = result.get("data")
    session.add_log("Frontend Code written")
    
    # Save code files
    if "files" in actual_result:
        for file in actual_result["files"]:
            try:
                file_path = project_storage.save_code_file(session_id, file["path"], file["content"])
                session.add_log(f"💾 Saved {file['path']}")
            except Exception as e:
                logger.error(f"Failed to save file {file.get('path')}: {e}")
    
    # Save task status as complete
    task_id = request.task.get('task_id')
    if task_id:
        try:
            project_storage.save_task_status(session_id, task_id, 'complete')
            session.add_log(f"✅ Task {task_id} marked as complete")
        except Exception as e:
            logger.error(f"Failed to save task status: {e}")
                
    return actual_result

@app.post("/agent/qa_agent/run")
async def run_qa_agent(session_id: str, request: ReviewCodeRequest):
    session = orchestrator.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.add_log("Reviewing Code...")
    result = await qa_agent.review_code(request.code_files, session_id)
    session.add_log("Code Review complete")
    return result

@app.post("/agent/software_architect/run")
async def run_software_architect(session_id: str, request: DesignArchitectureRequest):
    session = orchestrator.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.add_log("Designing architecture...")
    result = await architect_agent.design_architecture(request.requirements, session_id)
    session.add_log("Architecture design complete")
    
    # Save to filesystem
    try:
        file_path = project_storage.save_step(session_id, "architecture", result)
        session.add_log(f"💾 Saved architecture to {file_path}")
    except Exception as e:
        logger.error(f"Failed to save architecture: {e}")
    
    return result

@app.post("/agent/ux_designer/run")
async def run_ux_designer(session_id: str, request: DesignUIRequest):
    session = orchestrator.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.add_log("Designing UI...")
    result = await ux_agent.design_ui(request.requirements, session_id)
    session.add_log("UI design complete")
    return result


@app.get("/")
async def root():
    return {"message": "ZeroToOne AI Backend is running"}

@app.post("/session/start")
async def start_session(request: StartSessionRequest):
    session = orchestrator.create_session()
    session.project_name = request.project_name
    return session

@app.get("/session/{session_id}")
async def get_session(session_id: str):
    session = orchestrator.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@app.post("/agent/idea_generator/run")
async def run_idea_generator(session_id: str, request: GenerateIdeasRequest):
    session = orchestrator.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.add_log(f"Generating ideas for keywords: {request.keywords}")
    logger.info(f"[IdeaGenerator] Starting for session {session_id}, keywords: {request.keywords}")
    
    try:
        # Add timeout to prevent hanging
        result = await asyncio.wait_for(
            idea_agent.generate_ideas(request.keywords, session_id),
            timeout=app_settings.ai_model_config.timeout
        )
        
        session.add_log("Ideas generated successfully")
        logger.info(f"[IdeaGenerator] Success for session {session_id}")
        
        # Save to filesystem
        try:
            file_path = project_storage.save_step(session_id, "ideas", result)
            logger.info(f"[IdeaGenerator] Saved to {file_path}")
            session.add_log(f"💾 Saved ideas to {file_path}")
        except Exception as e:
            logger.error(f"[IdeaGenerator] Failed to save: {e}")
        
        # Debug logging
        logger.debug(f"[DEBUG] Result type: {type(result)}")
        logger.debug(f"[DEBUG] Result content: {str(result)[:500]}")
        
        return result
        
    except asyncio.TimeoutError:
        error_msg = f"Idea generation timed out after {app_settings.ai_model_config.timeout}s"
        logger.error(f"[IdeaGenerator] {error_msg}")
        session.add_log(f"ERROR: {error_msg}")
        raise HTTPException(status_code=504, detail=error_msg)
    
    except Exception as e:
        error_msg = f"Error generating ideas: {str(e)}"
        logger.error(f"[IdeaGenerator] {error_msg}", exc_info=True)
        session.add_log(f"ERROR: {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)

@app.post("/agent/product_requirements/run")
async def run_product_requirements(session_id: str, request: GeneratePRDRequest):
    session = orchestrator.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.add_log("Generating PRD...")
    result = await prd_agent.generate_prd(request.idea_context, session_id)
    session.add_log("PRD generated successfully")
    
    # Save to filesystem
    try:
        file_path = project_storage.save_step(session_id, "prd", result)
        session.add_log(f"💾 Saved PRD to {file_path}")
    except Exception as e:
        logger.error(f"Failed to save PRD: {e}")
    
    return {"prd": result}

class SettingsRequest(BaseModel):
    provider: str
    model_name: str
    api_key: str
    temperature: float = 0.7
    timeout: int = 120

@app.get("/settings")
async def get_settings():
    """Get current application settings (API key masked)"""
    return {
        "provider": app_settings.ai_model_config.provider,
        "model_name": app_settings.ai_model_config.model_name,
        "temperature": app_settings.ai_model_config.temperature,
        "timeout": app_settings.ai_model_config.timeout,
        "debug_mode": app_settings.debug_mode,
        "api_key_set": bool(app_settings.ai_model_config.api_key)
    }

@app.post("/settings")
async def update_settings(request: SettingsRequest):
    """Update application settings"""
    global app_settings
    app_settings.ai_model_config = ModelConfig(
        provider=request.provider,
        model_name=request.model_name,
        api_key=request.api_key,
        temperature=request.temperature,
        timeout=request.timeout
    )
    logger.info(f"Settings updated: {request.provider} / {request.model_name}")
    return {"status": "success", "message": "Settings updated. Please restart agents for changes to take effect."}

@app.get("/models/{provider}")
async def get_available_models(provider: str):
    """Get available models for a provider"""
    return ModelFactory.get_available_models(provider)

@app.get("/health")
async def health_check():
    """Health check endpoint with detailed status"""
    return {
        "status": "healthy",
        "active_sessions": len(orchestrator.sessions),
        "model_provider": app_settings.ai_model_config.provider,
        "model_name": app_settings.ai_model_config.model_name,
        "debug_mode": app_settings.debug_mode
    }

@app.post("/agent/requirement_analysis/run")
async def run_requirement_analysis(session_id: str, request: AnalyzePRDRequest):
    session = orchestrator.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.add_log("Analyzing PRD...")
    result = await analysis_agent.analyze_prd(request.prd_content, session_id)
    session.add_log("PRD analysis complete")
    
    # Save to filesystem
    try:
        file_path = project_storage.save_step(session_id, "user_stories", result)
        session.add_log(f"💾 Saved user stories to {file_path}")
    except Exception as e:
        logger.error(f"Failed to save user stories: {e}")
    
    return result

# Project Management Endpoints
@app.get("/projects")
async def list_projects():
    """List all projects"""
    return project_storage.list_projects()

@app.get("/projects/{session_id}")
async def get_project_summary(session_id: str):
    """Get project summary and file list"""
    return project_storage.get_project_summary(session_id)

@app.get("/projects/{session_id}/export")
async def export_project(session_id: str):
    """Export project as ZIP file"""
    from fastapi.responses import FileResponse
    
    zip_path = project_storage.export_project(session_id)
    if not zip_path:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return FileResponse(
        path=str(zip_path),
        media_type="application/zip",
        filename=f"project-{session_id}.zip"
    )


@app.get("/projects/{session_id}/task_statuses")
async def get_task_statuses(session_id: str):
    """Get all task execution statuses"""
    statuses = project_storage.load_task_statuses(session_id)
    return {"session_id": session_id, "task_statuses": statuses}

@app.post("/projects/{session_id}/task_statuses")
async def save_task_statuses(session_id: str, task_statuses: dict):
    """Save task execution statuses"""
    for task_id, status in task_statuses.items():
        project_storage.save_task_status(session_id, task_id, status)
    return {"status": "success", "saved_count": len(task_statuses)}

@app.get("/projects/{session_id}/{step_name}")
async def get_project_step(session_id: str, step_name: str):
    """Get a specific step's output"""
    result = project_storage.load_step(session_id, step_name)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Step '{step_name}' not found")
    return {"step": step_name, "data": result}


@app.get("/projects/{session_id}/code/{file_path:path}")
async def get_code_file(session_id: str, file_path: str):
    """Get a specific code file's content"""
    project_dir = project_storage.get_project_dir(session_id)
    code_file = project_dir / "code" / file_path
    
    if not code_file.exists():
        raise HTTPException(status_code=404, detail=f"File '{file_path}' not found")
    
    with open(code_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    return {
        "path": file_path,
        "content": content,
        "size": code_file.stat().st_size
    }

@app.post("/agent/debugger/debug")
async def debug_code(session_id: str, request: DebugCodeRequest):
    """Debug code based on error messages"""
    session = orchestrator.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.add_log(f"Debugger analyzing error: {request.error_message[:100]}...")
    
    result = await debugger_agent.debug_code(
        error_message=request.error_message,
        code_files=request.code_files,
        context=request.context,
        session_id=session_id
    )
    
    session.add_log("Debugger analysis complete")
    
    # Save fixed files if provided
    if "fixes" in result:
        for fix in result.get("fixes", []):
            try:
                file_path = project_storage.save_code_file(
                    session_id, 
                    fix["path"], 
                    fix["content"]
                )
                session.add_log(f"💾 Applied fix to {fix['path']}")
            except Exception as e:
                logger.error(f"Failed to save fix for {fix.get('path')}: {e}")
    
    return result

@app.post("/agent/debugger/lint")
async def lint_code(session_id: str, request: LintCodeRequest):
    """Perform static analysis and linting"""
    session = orchestrator.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.add_log("Running static analysis...")
    
    result = await debugger_agent.lint_code(
        code_files=request.code_files,
        session_id=session_id
    )
    
    session.add_log("Static analysis complete")
    
    return result

