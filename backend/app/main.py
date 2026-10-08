"""
Main FastAPI Server Entrypoint
Configures CORS, registers REST API routes, WebSocket endpoint, and starts server lifecycle.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(BASE_DIR))

from backend.app.api.routes import router as api_router
from backend.app.websocket.handler import ws_router
from backend.app.services.simulation_service import sim_service

app = FastAPI(
    title="AI-Based Traffic Management & Adaptive Signal Control",
    description="Trustworthy, Explainable, Safety-Shielded Adaptive Signal Control System for Indian Mixed Traffic",
    version="1.0.0"
)

# Enable CORS for React Frontend (typically running on localhost:5173 or localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
app.include_router(ws_router)

@app.on_event("startup")
def startup_event():
    print("[FastAPI Server] Initializing AI Traffic Controller System...")
    sim_service.start_simulation(scenario_name="normal")

@app.get("/")
def read_root():
    return {
        "system": "AI-Based Traffic Management and Adaptive Signal Control",
        "status": "ONLINE",
        "docs": "/docs",
        "websocket": "/ws"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
