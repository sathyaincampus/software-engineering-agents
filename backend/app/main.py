from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from app.core.orchestrator import orchestrator
from app.agents.strategy.idea_generator import IdeaGeneratorAgent
from app.agents.strategy.product_requirements import ProductRequirementsAgent
from app.agents.strategy.requirement_analysis import RequirementAnalysisAgent
from app.agents.architecture.software_architect import SoftwareArchitectAgent
from app.agents.architecture.ux_designer import UXDesignerAgent
from typing import Dict, Any

app = FastAPI(title="ZeroToOne AI API", version="1.0")
idea_agent = IdeaGeneratorAgent()
prd_agent = ProductRequirementsAgent()
analysis_agent = RequirementAnalysisAgent()
architect_agent = SoftwareArchitectAgent()
ux_agent = UXDesignerAgent()

orchestrator.register_agent("idea_generator", idea_agent)
orchestrator.register_agent("product_requirements", prd_agent)
orchestrator.register_agent("requirement_analysis", analysis_agent)
orchestrator.register_agent("software_architect", architect_agent)
orchestrator.register_agent("ux_designer", ux_agent)

# ... (previous models)

class DesignArchitectureRequest(BaseModel):
    requirements: Dict[str, Any]

class DesignUIRequest(BaseModel):
    requirements: Dict[str, Any]

# ... (previous endpoints)

@app.post("/agent/software_architect/run")
async def run_software_architect(session_id: str, request: DesignArchitectureRequest):
    session = orchestrator.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.add_log("Designing architecture...")
    result = architect_agent.design_architecture(request.requirements)
    session.add_log("Architecture design complete")
    return result

@app.post("/agent/ux_designer/run")
async def run_ux_designer(session_id: str, request: DesignUIRequest):
    session = orchestrator.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.add_log("Designing UI...")
    result = ux_agent.design_ui(request.requirements)
    session.add_log("UI design complete")
    return result

class StartSessionRequest(BaseModel):
    project_name: str

class GenerateIdeasRequest(BaseModel):
    keywords: str

class GeneratePRDRequest(BaseModel):
    idea_context: Dict[str, Any]

class AnalyzePRDRequest(BaseModel):
    prd_content: str

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
    result = await idea_agent.generate_ideas(request.keywords)
    session.add_log("Ideas generated successfully")
    return result

@app.post("/agent/product_requirements/run")
async def run_product_requirements(session_id: str, request: GeneratePRDRequest):
    session = orchestrator.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.add_log("Generating PRD...")
    result = await prd_agent.generate_prd(request.idea_context)
    session.add_log("PRD generated successfully")
    return {"prd": result}

@app.post("/agent/requirement_analysis/run")
async def run_requirement_analysis(session_id: str, request: AnalyzePRDRequest):
    session = orchestrator.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.add_log("Analyzing PRD...")
    result = await analysis_agent.analyze_prd(request.prd_content)
    session.add_log("PRD analysis complete")
    return result
