import sys
import ctypes
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database.db import init_db
from app.api.endpoints import router as api_router

def set_below_normal_priority():
    if sys.platform == "win32":
        try:
            kernel32 = ctypes.windll.kernel32
            handle = kernel32.GetCurrentProcess()
            # 0x00004000 = BELOW_NORMAL_PRIORITY_CLASS
            kernel32.SetPriorityClass(handle, 0x00004000)
            print("Successfully set backend process priority to BELOW NORMAL")
        except Exception as e:
            print(f"Failed to set backend process priority: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Optimize CPU priority under Windows to prevent OS lag or crashes
    set_below_normal_priority()
    # Initialize database tables on startup
    init_db()
    yield

app = FastAPI(
    title="Luna AI Backend",
    description="Python API engine for Luna desktop assistant",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend developer server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the endpoints router
app.include_router(api_router, prefix="/api")

@app.get("/health")
def health():
    return {"status": "ok", "app": "luna-backend"}
