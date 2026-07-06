from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import os
import shutil
import uuid
import json

from app.database.db import get_db
from app.database import models
from app.schemas import schemas
from app.services.ollama import OllamaService
from app.services.file_parser import FileParserService
from app.automation.engine import AutomationEngine

import threading

llm_lock = threading.Lock()

router = APIRouter()

# --- Conversation Endpoints ---
@router.get("/conversations", response_model=List[schemas.ConversationResponse])
def get_conversations(db: Session = Depends(get_db)):
    return db.query(models.Conversation).order_by(models.Conversation.updated_at.desc()).all()

@router.post("/conversations", response_model=schemas.ConversationResponse)
def create_conversation(conv: schemas.ConversationCreate, db: Session = Depends(get_db)):
    db_conv = models.Conversation(id=conv.id, title=conv.title)
    db.add(db_conv)
    db.commit()
    db.refresh(db_conv)
    return db_conv

@router.put("/conversations/{conv_id}", response_model=schemas.ConversationResponse)
def rename_conversation(conv_id: str, title: str, db: Session = Depends(get_db)):
    db_conv = db.query(models.Conversation).filter(models.Conversation.id == conv_id).first()
    if not db_conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    db_conv.title = title
    db.commit()
    db.refresh(db_conv)
    return db_conv

@router.delete("/conversations/{conv_id}")
def delete_conversation(conv_id: str, db: Session = Depends(get_db)):
    db_conv = db.query(models.Conversation).filter(models.Conversation.id == conv_id).first()
    if not db_conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    db.delete(db_conv)
    db.commit()
    return {"success": True}

@router.get("/conversations/{conv_id}/messages", response_model=List[schemas.MessageResponse])
def get_messages(conv_id: str, db: Session = Depends(get_db)):
    return db.query(models.Message).filter(models.Message.conversation_id == conv_id).order_by(models.Message.created_at.asc()).all()

# --- Memory Endpoints ---
@router.get("/memory", response_model=List[schemas.MemoryResponse])
def get_memory(db: Session = Depends(get_db)):
    return db.query(models.Memory).all()

@router.post("/memory", response_model=schemas.MemoryResponse)
def create_memory(item: schemas.MemoryCreate, db: Session = Depends(get_db)):
    db_mem = db.query(models.Memory).filter(models.Memory.key == item.key).first()
    if db_mem:
        db_mem.value = item.value
    else:
        db_mem = models.Memory(key=item.key, value=item.value)
        db.add(db_mem)
    db.commit()
    db.refresh(db_mem)
    return db_mem

@router.delete("/memory/{key}")
def delete_memory(key: str, db: Session = Depends(get_db)):
    db_mem = db.query(models.Memory).filter(models.Memory.key == key).first()
    if not db_mem:
        raise HTTPException(status_code=444, detail="Memory key not found")
    db.delete(db_mem)
    db.commit()
    return {"success": True}

# --- Settings Endpoints ---
@router.get("/settings", response_model=List[schemas.SettingResponse])
def get_settings(db: Session = Depends(get_db)):
    return db.query(models.Setting).all()

@router.post("/settings", response_model=schemas.SettingResponse)
def save_setting(item: schemas.SettingCreate, db: Session = Depends(get_db)):
    db_set = db.query(models.Setting).filter(models.Setting.key == item.key).first()
    if db_set:
        db_set.value = item.value
    else:
        db_set = models.Setting(key=item.key, value=item.value)
        db.add(db_set)
    db.commit()
    db.refresh(db_set)
    return db_set

# --- Task (To-do) Endpoints ---
@router.get("/tasks", response_model=List[schemas.TaskResponse])
def get_tasks(db: Session = Depends(get_db)):
    return db.query(models.Task).all()

@router.post("/tasks", response_model=schemas.TaskResponse)
def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db)):
    db_task = models.Task(title=task.title, due_date=task.due_date)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@router.put("/tasks/{task_id}", response_model=schemas.TaskResponse)
def update_task(task_id: int, task: schemas.TaskUpdate, db: Session = Depends(get_db)):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.title is not None:
        db_task.title = task.title
    if task.status is not None:
        db_task.status = task.status
    if task.due_date is not None:
        db_task.due_date = task.due_date
    db.commit()
    db.refresh(db_task)
    return db_task

@router.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(db_task)
    db.commit()
    return {"success": True}

# --- Note Endpoints ---
@router.get("/notes", response_model=List[schemas.NoteResponse])
def get_notes(db: Session = Depends(get_db)):
    return db.query(models.Note).order_by(models.Note.updated_at.desc()).all()

@router.post("/notes", response_model=schemas.NoteResponse)
def create_note(note: schemas.NoteCreate, db: Session = Depends(get_db)):
    db_note = models.Note(id=note.id, title=note.title, content=note.content, folder=note.folder)
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

@router.put("/notes/{note_id}", response_model=schemas.NoteResponse)
def update_note(note_id: str, note: schemas.NoteUpdate, db: Session = Depends(get_db)):
    db_note = db.query(models.Note).filter(models.Note.id == note_id).first()
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    if note.title is not None:
        db_note.title = note.title
    if note.content is not None:
        db_note.content = note.content
    if note.folder is not None:
        db_note.folder = note.folder
    db.commit()
    db.refresh(db_note)
    return db_note

@router.delete("/notes/{note_id}")
def delete_note(note_id: str, db: Session = Depends(get_db)):
    db_note = db.query(models.Note).filter(models.Note.id == note_id).first()
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(db_note)
    db.commit()
    return {"success": True}

# --- Permission Endpoints ---
@router.get("/permissions", response_model=List[schemas.PermissionResponse])
def get_permissions(db: Session = Depends(get_db)):
    return db.query(models.PermissionRule).all()

@router.put("/permissions/{action}", response_model=schemas.PermissionResponse)
def update_permission(action: str, perm: schemas.PermissionUpdate, db: Session = Depends(get_db)):
    db_perm = db.query(models.PermissionRule).filter(models.PermissionRule.action == action).first()
    if not db_perm:
        db_perm = models.PermissionRule(action=action, status=perm.status)
        db.add(db_perm)
    else:
        db_perm.status = perm.status
    db.commit()
    db.refresh(db_perm)
    return db_perm

# --- Logs Endpoints ---
@router.get("/logs", response_model=List[schemas.SystemLogResponse])
def get_logs(db: Session = Depends(get_db)):
    return db.query(models.SystemLog).order_by(models.SystemLog.timestamp.desc()).limit(100).all()

@router.delete("/logs")
def clear_logs(db: Session = Depends(get_db)):
    db.query(models.SystemLog).delete()
    db.commit()
    return {"success": True}

# --- Privacy Reset Endpoint ---
@router.post("/privacy/clear-all")
def factory_reset(db: Session = Depends(get_db)):
    db.query(models.Message).delete()
    db.query(models.Conversation).delete()
    db.query(models.Memory).delete()
    db.query(models.Setting).delete()
    db.query(models.PermissionRule).delete()
    db.query(models.Task).delete()
    db.query(models.Note).delete()
    db.query(models.SystemLog).delete()
    db.commit()
    # Log the reset event
    reset_log = models.SystemLog(level="warning", message="User triggered standard factory reset. Stored databases cleared.")
    db.add(reset_log)
    db.commit()
    return {"success": True}

# --- Document Upload Endpoint ---
@router.post("/upload")
def upload_file(file: UploadFile = File(...)):
    # Save file temporarily to extract contents
    temp_dir = os.path.join(os.path.expanduser("~"), ".luna", "temp")
    os.makedirs(temp_dir, exist_ok=True)
    
    file_path = os.path.join(temp_dir, file.filename)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        text_content = FileParserService.parse_file(file_path)
        
        # Clean up temp file
        os.remove(file_path)
        
        return {
            "filename": file.filename,
            "content": text_content,
            "success": True
        }
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        return {"success": False, "message": str(e)}

# --- Automation Check/Execute ---
@router.post("/automation/detect")
def detect_automation(item: schemas.MessageCreate, db: Session = Depends(get_db)):
    intent = AutomationEngine.detect_intent(item.content)
    if not intent:
        return {"matched": False}
        
    action_id = intent["action_id"]
    status = AutomationEngine.check_permission(action_id, db)
    
    return {
        "matched": True,
        "intent": intent["intent"],
        "action_id": action_id,
        "requires_permission": intent["requires_permission"],
        "status": status, # 'ask', 'allow_always', 'deny_always'
        "app_name": intent.get("app_name", "System Operation")
    }

@router.post("/automation/execute")
def execute_automation(action_id: str = Query(...), db: Session = Depends(get_db)):
    result = AutomationEngine.execute_action(action_id, db)
    return result

# --- Streaming AI Chat completion ---
@router.post("/chat/stream")
def chat_stream(item: schemas.MessageCreate, db: Session = Depends(get_db)):
    # 1. Store the user's message in the database
    db_msg_user = models.Message(
        conversation_id=item.conversation_id,
        sender="user",
        content=item.content
    )
    db.add(db_msg_user)
    db.commit()
    
    # 2. Get past conversation history to feed into Ollama
    history = db.query(models.Message).filter(
        models.Message.conversation_id == item.conversation_id
    ).order_by(models.Message.created_at.asc()).all()
    
    # 3. Retrieve settings into a dictionary
    db_settings = {s.key: s.value for s in db.query(models.Setting).all()}
    assistant_name = db_settings.get("assistantName", "Luna")
    language = db_settings.get("language", "en")
    response_style = db_settings.get("responseStyle", "professional")
    memory_enabled = db_settings.get("memoryEnabled", "true") == "true"

    # 4. Construct language and response length guidelines
    lang_guideline = {
        "en": "Respond in English.",
        "es": "Respond in Spanish (Español).",
        "fr": "Respond in French (Français)."
    }.get(language, "Respond in English.")
    
    style_guideline = {
        "professional": "Keep your responses concise, professional, and straight to the point.",
        "creative": "Keep your responses creative, engaging, verbose, and descriptive.",
        "code": "Focus on providing direct code examples and terminal shell commands with minimal description."
    }.get(response_style, "Keep responses clear and concise.")

    system_prompt = (
        f"You are {assistant_name}, a premium local AI desktop assistant.\n"
        f"Design Guidelines: Respond in clear, structured Markdown. {lang_guideline} {style_guideline} "
        f"Utilize rich formatting, tables, lists, and code blocks where applicable."
    )

    # 5. Inject local memories if enabled
    if memory_enabled:
        memories = db.query(models.Memory).all()
        if memories:
            memory_context = "\n".join([f"- {m.key}: {m.value}" for m in memories])
            system_prompt += f"\n\nYou have the following stored knowledge/context about the user:\n{memory_context}"

    ollama_messages = []
    ollama_messages.append({
        "role": "system",
        "content": system_prompt
    })
    
    for msg in history:
        ollama_messages.append({
            "role": "user" if msg.sender == "user" else "assistant",
            "content": msg.content
        })

    # Generator wrapper to capture and commit the assistant's reply once streaming is complete
    def event_generator():
        # Yield initial queued status message
        yield json.dumps({"type": "metadata", "status": "queued"}) + "\n"
        
        with llm_lock:
            # Yield processing status message once lock is acquired
            yield json.dumps({"type": "metadata", "status": "processing"}) + "\n"
            
            full_assistant_reply = ""
            running_mode = "normal"
            
            # Read the stream generator
            for chunk in OllamaService.stream_chat(ollama_messages):
                data = json.loads(chunk.strip())
                
                # Check metadata header to detect running mode
                if data.get("type") == "metadata":
                    if data.get("mode") == "demo":
                        running_mode = "demo"
                    yield chunk
                    continue
                    
                if data.get("type") == "content":
                    text = data.get("text", "")
                    full_assistant_reply += text
                    yield chunk
            
            # Save assistant message into SQLite once completion stream finishes
            if full_assistant_reply.strip():
                db_msg_assistant = models.Message(
                    conversation_id=item.conversation_id,
                    sender="luna",
                    content=full_assistant_reply,
                    running_mode=running_mode
                )
                db.add(db_msg_assistant)
                
                # Update conversation timestamp
                db_conv = db.query(models.Conversation).filter(models.Conversation.id == item.conversation_id).first()
                if db_conv:
                    db_conv.updated_at = func.now()
                    
                db.commit()

    return StreamingResponse(event_generator(), media_type="text/event-stream")
