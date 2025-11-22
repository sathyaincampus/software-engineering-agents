import os
from typing import Dict, Any

class FileManager:
    def __init__(self, base_path: str = "generated_projects"):
        self.base_path = base_path
        if not os.path.exists(self.base_path):
            os.makedirs(self.base_path)

    def save_code(self, session_id: str, file_path: str, content: str):
        # Create session directory
        session_dir = os.path.join(self.base_path, session_id)
        if not os.path.exists(session_dir):
            os.makedirs(session_dir)

        # Full path for the file
        full_path = os.path.join(session_dir, file_path)
        
        # Create subdirectories if needed
        os.makedirs(os.path.dirname(full_path), exist_ok=True)

        # Write content
        with open(full_path, "w") as f:
            f.write(content)
        
        return full_path

file_manager = FileManager()
