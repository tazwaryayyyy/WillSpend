import os
import logging
import traceback
from datetime import datetime
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, Response, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from pdf_generator import generate_report_pdf
from ai_advisor import generate_report
from models import UserProfile, WillSpendResponse, AdvisorRequest
from ai_client import get_current_ai_provider
from cache_manager import get_cache_stats
from calculator import run_simulation

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()  # Log to stderr
    ]
)
logger = logging.getLogger(__name__)

# Model for recovery validation


class RecoveryAction(BaseModel):
    action_id: str
    estimated_recovery: float
    timestamp: datetime

# Model for PDF report generation


class PDFReportRequest(BaseModel):
    simulation: dict
    user_profile: dict
    ai_advice: str


app = FastAPI(title="WillSpend API")

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://willspend.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def structured_error(request_id: str, code: str, message: str, details: str | None = None):
    payload = {
        "error": {
            "code": code,
            "message": message,
            "request_id": request_id,
            "timestamp": datetime.now().isoformat(),
        }
    }
    if details:
        payload["error"]["details"] = details
    return payload


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException):
    request_id = datetime.now().strftime('%Y%m%d_%H%M%S')
    detail = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content=structured_error(
            request_id, f"HTTP_{exc.status_code}", detail),
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, exc: Exception):
    request_id = datetime.now().strftime('%Y%m%d_%H%M%S')
    logger.error("[%s] Unhandled exception: %s", request_id, exc)
    logger.error("[%s] Traceback: %s", request_id, traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content=structured_error(
            request_id, "UNEXPECTED_ERROR", "Internal server error. Please try again later."),
    )


@app.post("/analyze", response_model=WillSpendResponse)
@app.post("/api/analyze", response_model=WillSpendResponse)
async def analyze(profile: UserProfile):
    request_id = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{hash(str(profile.dict())) % 10000}"
    logger.info(
        "[%s] Starting analysis for user age %s, country %s",
        request_id,
        profile.age,
        profile.country,
    )

    try:
        # Run simulation
        logger.info("[%s] Running financial simulation", request_id)
        simulation = run_simulation(profile)

        if not simulation.items:
            logger.warning("[%s] No inaction items detected", request_id)
            raise HTTPException(
                status_code=400, detail="No inaction items detected. Please check your inputs.")

        logger.info(
            "[%s] Simulation complete: %s total loss, %s categories",
            request_id,
            simulation.total_inaction_cost,
            len(simulation.items),
        )

        # Generate AI report
        logger.info(
            "[%s] Generating AI report using provider: %s",
            request_id,
            get_current_ai_provider(),
        )
        try:
            ai_report = generate_report(simulation, profile)
            logger.info("[%s] AI report generated successfully", request_id)
        except Exception as ai_error:
            logger.error(
                "[%s] AI report generation failed: %s", request_id, ai_error)
            raise HTTPException(
                status_code=502, detail="AI provider is temporarily unavailable. Please try again.") from ai_error

        logger.info("[%s] Analysis completed successfully", request_id)
        return WillSpendResponse(simulation=simulation, ai_report=ai_report)

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        error_msg = f"Unexpected error during analysis: {str(e)}"
        logger.error("[%s] %s", request_id, error_msg)
        logger.error("[%s] Traceback: %s", request_id, traceback.format_exc())
        raise HTTPException(
            status_code=500, detail="Internal server error. Please try again later.") from e


@app.post("/advisor")
@app.post("/api/advisor")
async def advisor_endpoint(request: AdvisorRequest):
    """
    Dedicated endpoint for the AI Advisor using anchored category losses.
    """
    request_id = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_advisor"
    logger.info(
        "[%s] AI Advisor request received for %s",
        request_id,
        request.profile.country,
    )

    try:
        report = generate_report(
            simulation=request.simulation,
            profile=request.profile,
            category_losses=request.category_losses
        )
        return {"report": report}
    except Exception as e:
        logger.error("[%s] AI Advisor failed: %s", request_id, e)
        raise HTTPException(
            status_code=502, detail="AI advisor failed to generate advice.") from e


@app.get("/health")
def health():
    try:
        cache_stats = get_cache_stats()
        return {
            "status": "ok",
            "ai_provider": get_current_ai_provider(),
            "cache_stats": cache_stats,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error("Health check failed: %s", e)
        raise HTTPException(
            status_code=503, detail="Health check failed") from e


@app.post("/validate_recovery")
@app.post("/api/validate_recovery")
async def validate_recovery(action: RecoveryAction):
    """
    Validate recovery action for tracking purposes.
    This is a stub endpoint for future backend integration.
    """
    request_id = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{action.action_id}"
    logger.info(
        "[%s] Recovery validation request: %s, recovery: %s",
        request_id,
        action.action_id,
        action.estimated_recovery,
    )

    try:
        # Basic validation
        if not action.action_id or action.estimated_recovery < 0:
            raise HTTPException(status_code=400, detail="Invalid action data")

        # Validate timestamp (now handled by Pydantic, but we can do extra checks if needed)
        # action.timestamp is already a datetime object

        # In a real implementation, this would save to a database
        # For now, we just validate and return success
        logger.info("[%s] Recovery action validated successfully", request_id)

        return {
            "valid": True,
            "message": "Action validated",
            "action_id": action.action_id,
            "estimated_recovery": round(action.estimated_recovery, 2),
            "validated_at": datetime.now().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("[%s] Recovery validation failed: %s", request_id, e)
        raise HTTPException(
            status_code=500, detail="Validation failed. Please try again later.") from e


@app.post("/generate_report")
@app.post("/api/generate_report")
async def generate_report_pdf_endpoint(request: PDFReportRequest):
    """
    Generate PDF report for the financial analysis.
    """
    request_id = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_pdf"
    logger.info("[%s] PDF generation request received", request_id)

    try:
        # Generate PDF
        pdf_bytes = generate_report_pdf(
            simulation_data=request.simulation,
            user_profile=request.user_profile,
            ai_advice=request.ai_advice
        )

        logger.info(
            "[%s] PDF generated successfully, size: %s bytes",
            request_id,
            len(pdf_bytes),
        )

        # Return PDF as response
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=WillSpend_Report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            }
        )

    except Exception as e:
        error_msg = f"PDF generation failed: {str(e)}"
        logger.error("[%s] %s", request_id, error_msg)
        logger.error("[%s] Traceback: %s", request_id, traceback.format_exc())
        raise HTTPException(
            status_code=500, detail="Failed to generate PDF report. Please try again later.") from e


@app.get("/ping")
async def ping():
    """
    Warm-up endpoint to keep the instance alive.
    Returns immediately and triggers a lightweight AI call for warm-up.
    """
    request_id = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_ping"
    logger.info("[%s] Ping received - warming up services", request_id)

    try:
        # Trigger a lightweight AI call to warm up the connection
        from ai_client import get_ai_response

        # This is a minimal warm-up call
        warmup_prompt = "Respond with just: OK"
        _ = get_ai_response(warmup_prompt, "warmup")

        logger.info("[%s] Warm-up completed successfully", request_id)
        return {
            "status": "ok",
            "message": "Service warmed up",
            "ai_provider": get_current_ai_provider(),
            "timestamp": datetime.now().isoformat()
        }

    except RuntimeError as e:
        logger.warning("[%s] Warm-up AI call failed: %s", request_id, e)
        # Still return ok since the main purpose is to keep the instance alive
        return {
            "status": "ok",
            "message": "Service warmed up (AI warm-up failed but service is ready)",
            "ai_provider": get_current_ai_provider(),
            "timestamp": datetime.now().isoformat()
        }


# Serve frontend static files
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_PATH = os.path.join(BASE_DIR, "..", "frontend")

if os.path.exists(FRONTEND_PATH):
    app.mount("/static", StaticFiles(directory=FRONTEND_PATH), name="static")


@app.get("/")
def root_status():
    return {"status": "ok"}


# Optional: Keep the static serving if needed for local testing
@app.get("/index")
async def index():
    index_path = os.path.join(FRONTEND_PATH, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Frontend index.html not found."}
