from pydantic import BaseModel
from typing import List, Dict, Any, Literal

class TaskDelegation(BaseModel):
    sender: str
    recipient: str
    task_type: Literal["code", "review", "design", "test"]
    payload: Dict[str, Any] # The actual work context
    artifacts: List[str] # Paths to relevant files

class TaskResult(BaseModel):
    status: Literal["success", "failure", "blocked"]
    output_files: List[str]
    metrics: Dict[str, float] # Token cost, time taken
