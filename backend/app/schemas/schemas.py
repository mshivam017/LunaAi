from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# --- User Schemas ---
class UserBase(BaseModel):
    name: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# --- Chat/Message Schemas ---
class MessageCreate(BaseModel):
    content: str
    conversation_id: str

class MessageResponse(BaseModel):
    id: int
    conversation_id: str
    sender: str
    content: str
    running_mode: str
    created_at: datetime
    class Config:
        from_attributes = True

class ConversationCreate(BaseModel):
    id: str
    title: str

class ConversationResponse(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

# --- Memory Schemas ---
class MemoryCreate(BaseModel):
    key: str
    value: str

class MemoryResponse(BaseModel):
    id: int
    key: str
    value: str
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

# --- Setting Schemas ---
class SettingCreate(BaseModel):
    key: str
    value: str

class SettingResponse(BaseModel):
    id: int
    key: str
    value: str
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

# --- Permission Schemas ---
class PermissionUpdate(BaseModel):
    status: str # 'allow_always', 'deny_always', 'ask'

class PermissionResponse(BaseModel):
    id: int
    action: str
    status: str
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

# --- Task Schemas ---
class TaskCreate(BaseModel):
    title: str
    due_date: Optional[str] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[str] = None

class TaskResponse(BaseModel):
    id: int
    title: str
    status: str
    due_date: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True

# --- Note Schemas ---
class NoteCreate(BaseModel):
    id: str
    title: str
    content: Optional[str] = ""
    folder: Optional[str] = "General"

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    folder: Optional[str] = None

class NoteResponse(BaseModel):
    id: str
    title: str
    content: str
    folder: str
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

# --- Log Schemas ---
class SystemLogResponse(BaseModel):
    id: int
    level: str
    message: str
    timestamp: datetime
    class Config:
        from_attributes = True
