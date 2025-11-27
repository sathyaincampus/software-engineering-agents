"""
Project storage service for persisting session data
"""
import json
import os
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional
import shutil

class ProjectStorage:
    """Handles saving and loading project data to/from filesystem"""
    
    def __init__(self, base_dir: str = "data/projects"):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)
    
    def get_project_dir(self, session_id: str) -> Path:
        """Get project directory for a session"""
        project_dir = self.base_dir / session_id
        project_dir.mkdir(parents=True, exist_ok=True)
        return project_dir
    
    def save_step(self, session_id: str, step_name: str, data: Any) -> str:
        """
        Save a workflow step's output
        
        Args:
            session_id: Session identifier
            step_name: Name of the step (ideas, prd, user_stories, etc.)
            data: Data to save
            
        Returns:
            Path to saved file
        """
        project_dir = self.get_project_dir(session_id)
        
        # Determine file extension and format
        if isinstance(data, (dict, list)):
            file_path = project_dir / f"{step_name}.json"
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
        else:
            # Save as markdown for text content
            file_path = project_dir / f"{step_name}.md"
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(str(data))
        
        # Update metadata
        self._update_metadata(session_id, step_name)
        
        return str(file_path)
    
    def load_step(self, session_id: str, step_name: str) -> Optional[Any]:
        """Load a workflow step's output"""
        project_dir = self.get_project_dir(session_id)
        
        # Try JSON first
        json_path = project_dir / f"{step_name}.json"
        if json_path.exists():
            with open(json_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        
        # Try markdown
        md_path = project_dir / f"{step_name}.md"
        if md_path.exists():
            with open(md_path, 'r', encoding='utf-8') as f:
                return f.read()
        
        return None
    
    def save_code_file(self, session_id: str, file_path: str, content: str):
        """Save a generated code file"""
        project_dir = self.get_project_dir(session_id)
        code_dir = project_dir / "code"
        
        # Create full path
        full_path = code_dir / file_path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Write file
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return str(full_path)
    
    def _update_metadata(self, session_id: str, step_name: str):
        """Update project metadata"""
        project_dir = self.get_project_dir(session_id)
        metadata_path = project_dir / "metadata.json"
        
        # Load existing metadata
        if metadata_path.exists():
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
        else:
            metadata = {
                "session_id": session_id,
                "created_at": datetime.now().isoformat(),
                "steps_completed": [],
                "last_updated": None
            }
        
        # Update metadata
        if step_name not in metadata["steps_completed"]:
            metadata["steps_completed"].append(step_name)
        metadata["last_updated"] = datetime.now().isoformat()
        
        # Save metadata
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
    
    def get_project_summary(self, session_id: str) -> Dict[str, Any]:
        """Get project summary"""
        project_dir = self.get_project_dir(session_id)
        metadata_path = project_dir / "metadata.json"
        
        if not metadata_path.exists():
            return None
        
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
        
        # List all files
        files = []
        for file_path in project_dir.rglob('*'):
            if file_path.is_file() and file_path.name != 'metadata.json':
                files.append({
                    "path": str(file_path.relative_to(project_dir)),
                    "size": file_path.stat().st_size,
                    "modified": datetime.fromtimestamp(file_path.stat().st_mtime).isoformat()
                })
        
        # Return flattened structure for easier access
        return {
            "exists": True,
            "session_id": metadata.get("session_id"),
            "project_name": metadata.get("project_name", "Untitled Project"),
            "created_at": metadata.get("created_at"),
            "last_modified": metadata.get("last_updated"),
            "steps_completed": metadata.get("steps_completed", []),
            "files": files,
            "total_files": len(files)
        }
    
    def export_project(self, session_id: str) -> Optional[Path]:
        """Export project as ZIP file"""
        import zipfile
        
        project_dir = self.get_project_dir(session_id)
        if not project_dir.exists():
            return None
        
        # Create ZIP file
        zip_path = self.base_dir / f"{session_id}.zip"
        
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for file_path in project_dir.rglob('*'):
                if file_path.is_file():
                    arcname = file_path.relative_to(project_dir)
                    zipf.write(file_path, arcname)
        
        return zip_path
    
    def list_projects(self) -> list[Dict[str, Any]]:
        """List all projects"""
        projects = []
        
        for project_dir in self.base_dir.iterdir():
            if project_dir.is_dir():
                metadata_path = project_dir / "metadata.json"
                if metadata_path.exists():
                    with open(metadata_path, 'r') as f:
                        metadata = json.load(f)
                    projects.append({
                        "session_id": project_dir.name,
                        "created_at": metadata.get("created_at"),
                        "last_modified": metadata.get("last_updated"),
                        "steps_completed": metadata.get("steps_completed", [])
                    })
        
        return sorted(projects, key=lambda x: x.get("last_modified", ""), reverse=True)

# Global instance
project_storage = ProjectStorage()
