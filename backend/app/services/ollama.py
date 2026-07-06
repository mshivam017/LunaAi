import requests
import json
import time
import random
import sys
import ctypes
from typing import Generator, List, Dict
from app.core.config import settings

def set_ollama_priority_below_normal():
    if sys.platform != "win32":
        return
    try:
        PROCESS_QUERY_INFORMATION = 0x0400
        PROCESS_SET_INFORMATION = 0x0200
        TH32CS_SNAPPROCESS = 0x00000002
        BELOW_NORMAL_PRIORITY_CLASS = 0x00004000

        class PROCESSENTRY32(ctypes.Structure):
            _fields_ = [
                ("dwSize", ctypes.c_ulong),
                ("cntUsage", ctypes.c_ulong),
                ("th32ProcessID", ctypes.c_ulong),
                ("th32DefaultHeapID", ctypes.c_void_p),
                ("th32ModuleID", ctypes.c_ulong),
                ("cntThreads", ctypes.c_ulong),
                ("th32ParentProcessID", ctypes.c_ulong),
                ("pcPriClassBase", ctypes.c_long),
                ("dwFlags", ctypes.c_ulong),
                ("szExeFile", ctypes.c_char * 260)
            ]

        kernel32 = ctypes.windll.kernel32
        hSnapshot = kernel32.CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0)
        if hSnapshot == -1:
            return

        pe = PROCESSENTRY32()
        pe.dwSize = ctypes.sizeof(PROCESSENTRY32)

        if kernel32.Process32First(hSnapshot, ctypes.byref(pe)):
            while True:
                exe_name = pe.szExeFile.decode('utf-8', errors='ignore').lower()
                if "ollama" in exe_name:
                    pid = pe.th32ProcessID
                    hProcess = kernel32.OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_SET_INFORMATION, False, pid)
                    if hProcess:
                        kernel32.SetPriorityClass(hProcess, BELOW_NORMAL_PRIORITY_CLASS)
                        kernel32.CloseHandle(hProcess)
                if not kernel32.Process32Next(hSnapshot, ctypes.byref(pe)):
                    break
        kernel32.CloseHandle(hSnapshot)
        print("Successfully set active Ollama runner processes to BELOW NORMAL CPU priority")
    except Exception as e:
        print(f"Failed to optimize Ollama processes priority: {e}")

class OllamaService:
    @staticmethod
    def is_ollama_running() -> bool:
        try:
            response = requests.get(f"{settings.OLLAMA_BASE_URL}/api/tags", timeout=1.5)
            return response.status_code == 200
        except Exception:
            return False

    @staticmethod
    def get_available_models() -> List[str]:
        try:
            response = requests.get(f"{settings.OLLAMA_BASE_URL}/api/tags", timeout=1.5)
            if response.status_code == 200:
                data = response.json()
                return [m["name"] for m in data.get("models", [])]
            return []
        except Exception:
            return []

    @classmethod
    def stream_chat(cls, messages: List[Dict[str, str]], model: str = None) -> Generator[str, None, None]:
        if model is None:
            model = settings.DEFAULT_MODEL
            
        # Check if requested model exists locally
        available_models = cls.get_available_models()
        if not available_models or model not in available_models:
            # Check fallback model
            if settings.FALLBACK_MODEL in available_models:
                model = settings.FALLBACK_MODEL

        # Determine running mode
        ollama_active = cls.is_ollama_running() and len(available_models) > 0
        
        if ollama_active:
            # Yield metadata header showing normal local connection
            yield json.dumps({"type": "metadata", "mode": "local", "model": model}) + "\n"
            
            try:
                url = f"{settings.OLLAMA_BASE_URL}/api/chat"
                payload = {
                    "model": model,
                    "messages": messages,
                    "stream": True,
                    "options": {
                        "temperature": 0.7
                    }
                }
                
                # Optimize Ollama CPU priority on Windows to prevent OS lag or crashes under heavy CPU load
                set_ollama_priority_below_normal()
                response = requests.post(url, json=payload, stream=True, timeout=60)
                for line in response.iter_lines():
                    if line:
                        chunk = json.loads(line.decode('utf-8'))
                        content = chunk.get("message", {}).get("content", "")
                        if content:
                            yield json.dumps({"type": "content", "text": content}) + "\n"
                            
            except Exception as e:
                # If local stream fails mid-way, fall back to mock stream gracefully
                yield json.dumps({"type": "content", "text": f"\n\n[System Connection Interrupted. Switched to Fallback Mode. Error: {str(e)}]\n\n"}) + "\n"
                for chunk in cls._get_mock_stream(messages):
                    yield chunk
        else:
            # Yield metadata header showing Demo Mode
            yield json.dumps({"type": "metadata", "mode": "demo", "model": "Luna Demo Engine"}) + "\n"
            for chunk in cls._get_mock_stream(messages):
                yield chunk

    @classmethod
    def _get_mock_stream(cls, messages: List[Dict[str, str]]) -> Generator[str, None, None]:
        user_message = messages[-1]["content"].lower() if messages else ""
        
        # 1. Direct Intent Recognition Fallbacks (Matches system commands)
        if any(w in user_message for w in ["open vscode", "open vs code", "vscode"]):
            response_text = (
                "### 🖥️ Launcher Triggered\n"
                "I detected you want to open **Visual Studio Code**.\n\n"
                "To execute this command, I need your permission. A dialog should appear asking for authorization. "
                "Once approved, I'll launch the application via Windows shell scripts. Let me know if you would like me to assist you with anything else inside your workspace!"
            )
        elif any(w in user_message for w in ["open chrome", "chrome", "google chrome"]):
            response_text = (
                "### 🌐 Browser Launcher Triggered\n"
                "I detected you want to open **Google Chrome**.\n\n"
                "I will trigger the permission request dialog. After your approval, I'll use the Windows shell launcher to open your default browser. Let me know if you have a specific URL you want me to navigate to!"
            )
        elif any(w in user_message for w in ["open notepad", "notepad"]):
            response_text = (
                "### 📝 Editor Launcher Triggered\n"
                "I detected you want to open **Notepad**.\n\n"
                "I'm spawning the system permission check. Once approved, I'll launch `notepad.exe` immediately for your quick notes."
            )
        elif any(w in user_message for w in ["open spotify", "spotify"]):
            response_text = (
                "### 🎵 Music Launcher Triggered\n"
                "I detected you want to open **Spotify**.\n\n"
                "I will launch the Spotify client on your Windows system once permission is granted. Rock on!"
            )
        elif any(w in user_message for w in ["organize downloads", "downloads folder", "organize"]):
            response_text = (
                "### 📁 Smart Folder Organizer\n"
                "I detected you want to organize your **Downloads folder**.\n\n"
                "This action involves sorting files by their extensions (e.g., placing PDFs in a 'Documents' folder, EXEs in 'Installers', and PNGs/JPGs in 'Images').\n\n"
                "Please approve the automation prompt, and I'll clean up your downloads folder right away!"
            )
        # 2. General conversation mock responses
        elif any(w in user_message for w in ["hello", "hi", "hey", "who are you", "what is luna"]):
            response_text = (
                "# Hello! I'm Luna 🌙\n"
                "Your personal local AI desktop assistant, engineered to run entirely on your machine. I'm optimized for low-end hardware, operating smoothly on CPU and standard memory setups.\n\n"
                "### What can I do for you today?\n"
                "- **💬 Chat & Brainstorm**: We can talk code, write documents, or solve problems.\n"
                "- **📁 Local Memory**: I remember your name, coding preferences, and style settings.\n"
                "- **🖥️ Desktop Automation**: I can open programs, locate files, and organize directories (e.g., 'Open Chrome', 'Organize Downloads').\n"
                "- **📝 Built-in Notes**: Keep notes in clean Markdown with auto-saving.\n\n"
                "How can I help you today?"
            )
        elif any(w in user_message for w in ["code", "programming", "python", "javascript", "react"]):
            response_text = (
                "Here is an example of a React component with TailwindCSS styling:\n\n"
                "```tsx\n"
                "import React, { useState } from 'react';\n"
                "\n"
                "interface CardProps {\n"
                "  title: string;\n"
                "  description: string;\n"
                "}\n"
                "\n"
                "export const PremiumCard: React.FC<CardProps> = ({ title, description }) => {\n"
                "  const [hovered, setHovered] = useState(false);\n"
                "\n"
                "  return (\n"
                "    <div \n"
                "      className=\"glass-card p-6 rounded-xl border border-white/5 bg-white/5 transition-all duration-300 transform hover:-translate-y-1 hover:border-purple-500/30\"\n"
                "      onMouseEnter={() => setHovered(true)}\n"
                "      onMouseLeave={() => setHovered(false)}\n"
                "    >\n"
                "      <h3 className=\"text-xl font-bold text-white mb-2\">{title}</h3>\n"
                "      <p className=\"text-gray-400 text-sm\">{description}</p>\n"
                "      {hovered && (\n"
                "        <span className=\"text-xs text-purple-400 mt-4 block animate-pulse\">\n"
                "          Interactive Glow Active ✨\n"
                "        </span>\n"
                "      )}\n"
                "    </div>\n"
                "  );\n"
                "}\n"
                "```\n\n"
                "Let me know what coding project or structure you would like to brainstorm next!"
            )
        else:
            response_text = (
                "### Understood! 🌙\n"
                "I am running in **Demo Mode** since I couldn't find a running instance of **Ollama** (`localhost:11434`) on your device.\n\n"
                "Even in Demo Mode, I am simulating full conversation and markdown formatting. Here is your query breakdown:\n\n"
                f"> **Query Recieved**: \"{messages[-1]['content']}\"\n\n"
                "Once Ollama is installed and running, I will automatically connect to your local `Qwen2.5:3B` model for custom responses. "
                "You can configure settings, write notes, use local memory, and test desktop automations (e.g., try writing *'Open Notepad'*) right now!"
            )

        # Stream the mock response text character-by-character to simulate real LLM speed
        words = response_text.split(" ")
        for i, word in enumerate(words):
            time.sleep(random.uniform(0.01, 0.03))
            suffix = " " if i < len(words) - 1 else ""
            yield json.dumps({"type": "content", "text": word + suffix}) + "\n"
