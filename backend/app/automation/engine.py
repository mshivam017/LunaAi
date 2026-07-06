import os
import subprocess
import re
import shutil
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.database.models import PermissionRule, SystemLog

class AutomationEngine:
    # Supported app launches mapped to Windows shell targets
    APPS = {
        "vscode": {"cmd": "code", "name": "Visual Studio Code"},
        "notepad": {"cmd": "notepad", "name": "Notepad"},
        "calculator": {"cmd": "calc", "name": "Calculator"},
        "chrome": {"cmd": "start chrome", "name": "Google Chrome"},
        "edge": {"cmd": "start msedge", "name": "Microsoft Edge"},
        "explorer": {"cmd": "explorer", "name": "File Explorer"},
        "spotify": {"cmd": "start spotify", "name": "Spotify"},
        "terminal": {"cmd": "start powershell", "name": "Windows PowerShell"},
        "downloads": {"cmd": "explorer.exe shell:Downloads", "name": "Downloads Folder"},
        "desktop": {"cmd": "explorer.exe shell:Desktop", "name": "Desktop Folder"},
        "documents": {"cmd": "explorer.exe shell:Personal", "name": "Documents Folder"}
    }

    @classmethod
    def detect_intent(cls, prompt: str) -> Optional[Dict[str, Any]]:
        text = prompt.lower().strip()
        
        # 1. Match app opening intents
        for key, info in cls.APPS.items():
            pattern = rf"\b(open|launch|start|run)\b.*\b{key}\b"
            # Special case for vs code / visual studio code
            if key == "vscode":
                pattern = rf"\b(open|launch|start|run)\b.*\b(vs\s?code|visual\s?studio\s?code)\b"
                
            if re.search(pattern, text) or text == key or text == f"open {key}":
                return {
                    "intent": "open_app",
                    "app_key": key,
                    "app_name": info["name"],
                    "requires_permission": True,
                    "action_id": f"open_{key}"
                }
                
        # 2. Match downloads organization intent
        if any(w in text for w in ["organize downloads", "clean downloads", "organize my downloads"]):
            return {
                "intent": "organize_downloads",
                "requires_permission": True,
                "action_id": "organize_downloads"
            }

        return None

    @classmethod
    def check_permission(cls, action_id: str, db: Session) -> str:
        rule = db.query(PermissionRule).filter(PermissionRule.action == action_id).first()
        if not rule:
            # Create a default "ask" permission rule
            rule = PermissionRule(action=action_id, status="ask")
            db.add(rule)
            db.commit()
            db.refresh(rule)
        return rule.status

    @classmethod
    def execute_action(cls, action_id: str, db: Session) -> Dict[str, Any]:
        log_message = ""
        try:
            # Handle App Launch actions
            for key, info in cls.APPS.items():
                if action_id == f"open_{key}":
                    # Run target in background
                    subprocess.Popen(info["cmd"], shell=True)
                    log_message = f"Successfully launched {info['name']}"
                    cls._log(db, "info", log_message)
                    return {"success": True, "message": log_message}

            # Handle Downloads Organization
            if action_id == "organize_downloads":
                result = cls._organize_downloads()
                log_message = f"Downloads organized: {result}"
                cls._log(db, "info", log_message)
                return {"success": True, "message": log_message}
                
            return {"success": False, "message": f"Unknown action: {action_id}"}
            
        except Exception as e:
            error_msg = f"Failed to execute {action_id}: {str(e)}"
            cls._log(db, "error", error_msg)
            return {"success": False, "message": error_msg}

    @staticmethod
    def _organize_downloads() -> str:
        downloads_path = os.path.join(os.path.expanduser('~'), 'Downloads')
        if not os.path.exists(downloads_path):
            return "Downloads folder not found."

        # Define category folders
        categories = {
            "Documents": [".pdf", ".docx", ".doc", ".xlsx", ".xls", ".txt", ".pptx", ".ppt", ".csv", ".rtf"],
            "Images": [".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp", ".bmp"],
            "Installers": [".exe", ".msi", ".apk"],
            "Archives": [".zip", ".rar", ".7z", ".tar", ".gz", ".bz2"],
            "Audio-Video": [".mp3", ".mp4", ".wav", ".mkv", ".mov", ".avi", ".wma", ".flac"],
            "Code": [".py", ".js", ".ts", ".jsx", ".tsx", ".html", ".css", ".json", ".yaml", ".yml", ".sh", ".bat"]
        }

        # Create category directories if they don't exist
        for folder in categories.keys():
            os.makedirs(os.path.join(downloads_path, folder), exist_ok=True)
        os.makedirs(os.path.join(downloads_path, "Others"), exist_ok=True)

        moved_count = 0
        
        # Scan files in Downloads root
        for filename in os.listdir(downloads_path):
            file_path = os.path.join(downloads_path, filename)
            
            # Skip if it is a directory
            if os.path.isdir(file_path):
                continue
                
            file_ext = os.path.splitext(filename)[1].lower()
            dest_folder = "Others"
            
            # Find appropriate folder
            for folder, extensions in categories.items():
                if file_ext in extensions:
                    dest_folder = folder
                    break
                    
            dest_path = os.path.join(downloads_path, dest_folder, filename)
            
            try:
                # Resolve duplicates by appending incremental numbers
                if os.path.exists(dest_path):
                    name_part, ext_part = os.path.splitext(filename)
                    counter = 1
                    while os.path.exists(dest_path):
                        new_name = f"{name_part}_{counter}{ext_part}"
                        dest_path = os.path.join(downloads_path, dest_folder, new_name)
                        counter += 1
                
                shutil.move(file_path, dest_path)
                moved_count += 1
            except Exception:
                # Silently skip file if it's currently locked/in use
                continue

        return f"Moved {moved_count} files into sorted subdirectories."

    @staticmethod
    def _log(db: Session, level: str, message: str):
        log_entry = SystemLog(level=level, message=message)
        db.add(log_entry)
        db.commit()
