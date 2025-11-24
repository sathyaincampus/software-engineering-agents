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
from app.agents.engineering.qa_agent import QAAgent
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

orchestrator.register_agent("idea_generator", idea_agent)
orchestrator.register_agent("product_requirements", prd_agent)
orchestrator.register_agent("requirement_analysis", analysis_agent)
orchestrator.register_agent("software_architect", architect_agent)
orchestrator.register_agent("ux_designer", ux_agent)
orchestrator.register_agent("engineering_manager", eng_manager_agent)
orchestrator.register_agent("backend_dev", backend_dev_agent)
orchestrator.register_agent("frontend_dev", frontend_dev_agent)
orchestrator.register_agent("qa_agent", qa_agent)

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

# ... (previous endpoints)

@app.post("/agent/engineering_manager/run")
async def run_engineering_manager(session_id: str, request: CreateSprintPlanRequest):
    session = orchestrator.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.add_log("Creating Sprint Plan...")
    result = await eng_manager_agent.create_sprint_plan(request.user_stories, request.architecture, session_id)
    session.add_log("Sprint Plan created")
    return result

@app.post("/agent/backend_dev/run")
async def run_backend_dev(session_id: str, request: WriteCodeRequest):
    session = orchestrator.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.add_log(f"Writing Backend Code for task: {request.task.get('title')}...")
    result = await backend_dev_agent.write_code(request.task, request.context, session_id)
    session.add_log("Backend Code written")
    return result

@app.post("/agent/frontend_dev/run")
async def run_frontend_dev(session_id: str, request: WriteCodeRequest):
    session = orchestrator.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.add_log(f"Writing Frontend Code for task: {request.task.get('title')}...")
    result = await frontend_dev_agent.write_code(request.task, request.context, session_id)
    session.add_log("Frontend Code written")
    return result

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
    return result
