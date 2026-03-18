from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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
