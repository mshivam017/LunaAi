import uvicorn
import sys
from app.main import app

if __name__ == "__main__":
    port = 8000
    
    # Simple argument parsing for port specification
    for i, arg in enumerate(sys.argv):
        if arg == "--port" and i + 1 < len(sys.argv):
            try:
                port = int(sys.argv[i + 1])
            except ValueError:
                pass
        elif arg.startswith("--port="):
            try:
                port = int(arg.split("=")[1])
            except ValueError:
                pass
                
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="info")
