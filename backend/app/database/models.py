from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from app.database.db import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, default="User")
    created_at = Column(DateTime, server_default=func.now())

class Conversation(Base):
    __tablename__ = "conversations"
    id = Column(String, primary_key=True, index=True) # UUID string from React
    title = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(String, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    sender = Column(String, nullable=False) # 'user' or 'luna'
    content = Column(Text, nullable=False)
    running_mode = Column(String, default="normal") # 'normal' or 'demo'
    created_at = Column(DateTime, server_default=func.now())

class Memory(Base):
    __tablename__ = "memory"
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True)
    value = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class Setting(Base):
    __tablename__ = "settings"
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True)
    value = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class PermissionRule(Base):
    __tablename__ = "permissions"
    id = Column(Integer, primary_key=True, index=True)
    action = Column(String, unique=True, nullable=False) # e.g. 'open_vscode'
    status = Column(String, default="ask") # 'allow_always', 'deny_always', 'ask'
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    status = Column(String, default="todo") # 'todo', 'done'
    due_date = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

class Note(Base):
    __tablename__ = "notes"
    id = Column(String, primary_key=True, index=True) # UUID string
    title = Column(String, nullable=False)
    content = Column(Text, default="")
    folder = Column(String, default="General")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class SystemLog(Base):
    __tablename__ = "logs"
    id = Column(Integer, primary_key=True, index=True)
    level = Column(String, default="info") # 'info', 'warning', 'error'
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, server_default=func.now())
