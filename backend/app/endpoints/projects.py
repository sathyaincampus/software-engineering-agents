
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

@app.get("/projects/{session_id}/{step_name}")
async def get_project_step(session_id: str, step_name: str):
    """Get a specific step's output"""
    result = project_storage.load_step(session_id, step_name)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Step '{step_name}' not found")
    return {"step": step_name, "data": result}
