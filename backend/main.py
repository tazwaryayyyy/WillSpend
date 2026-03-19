import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from models import UserProfile, WillSpendResponse
from calculator import run_simulation
from ai_advisor import generate_report

app = FastAPI(title="WillSpend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/analyze", response_model=WillSpendResponse)
async def analyze(profile: UserProfile):
    try:
        simulation = run_simulation(profile)
        if not simulation.items:
            raise HTTPException(status_code=400, detail="No inaction items detected. Please check your inputs.")
        ai_report = generate_report(simulation, profile)
        return WillSpendResponse(simulation=simulation, ai_report=ai_report)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health():
    return {"status": "ok"}


# Serve frontend static files
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_PATH = os.path.join(BASE_DIR, "..", "frontend")

if os.path.exists(FRONTEND_PATH):
    app.mount("/static", StaticFiles(directory=FRONTEND_PATH), name="static")


@app.get("/")
async def root():
    index_path = os.path.join(FRONTEND_PATH, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "WillSpend API is running. Frontend not found."}
