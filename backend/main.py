import os
import logging
import traceback
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel
from pdf_generator import generate_report_pdf
from models import UserProfile, WillSpendResponse
from calculator import run_simulation
from ai_advisor import generate_report
from ai_client import get_current_ai_provider
from cache_manager import get_cache_stats

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
    timestamp: str

# Model for PDF report generation
class PDFReportRequest(BaseModel):
    simulation: dict
    user_profile: dict
    ai_advice: str

app = FastAPI(title="WillSpend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/analyze", response_model=WillSpendResponse)
async def analyze(profile: UserProfile):
    request_id = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{hash(str(profile.dict())) % 10000}"
    logger.info(f"[{request_id}] Starting analysis for user age {profile.age}, country {profile.country}")
    
    try:
        # Run simulation
        logger.info(f"[{request_id}] Running financial simulation")
        simulation = run_simulation(profile)
        
        if not simulation.items:
            logger.warning(f"[{request_id}] No inaction items detected")
            raise HTTPException(status_code=400, detail="No inaction items detected. Please check your inputs.")
        
        logger.info(f"[{request_id}] Simulation complete: {simulation.total_inaction_cost} total loss, {len(simulation.items)} categories")
        
        # Generate AI report
        logger.info(f"[{request_id}] Generating AI report using provider: {get_current_ai_provider()}")
        try:
            ai_report = generate_report(simulation, profile)
            logger.info(f"[{request_id}] AI report generated successfully")
        except Exception as ai_error:
            logger.error(f"[{request_id}] AI report generation failed: {str(ai_error)}")
            # Use fallback response
            ai_report = "Our AI is temporarily unavailable. Here's a typical insight: delaying savings by one year can cost you 6% of your principal in lost compound interest."
        
        logger.info(f"[{request_id}] Analysis completed successfully")
        return WillSpendResponse(simulation=simulation, ai_report=ai_report)
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        error_msg = f"Unexpected error during analysis: {str(e)}"
        logger.error(f"[{request_id}] {error_msg}")
        logger.error(f"[{request_id}] Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Internal server error. Please try again later.")


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
        logger.error(f"Health check failed: {str(e)}")
        return {"status": "degraded", "error": "Health check partially failed"}


@app.post("/validate_recovery")
async def validate_recovery(action: RecoveryAction):
    """
    Validate recovery action for tracking purposes.
    This is a stub endpoint for future backend integration.
    """
    request_id = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{action.action_id}"
    logger.info(f"[{request_id}] Recovery validation request: {action.action_id}, recovery: {action.estimated_recovery}")
    
    try:
        # Basic validation
        if not action.action_id or action.estimated_recovery < 0:
            raise HTTPException(status_code=400, detail="Invalid action data")
        
        # Validate timestamp format (basic check)
        try:
            datetime.fromisoformat(action.timestamp.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid timestamp format")
        
        # In a real implementation, this would save to a database
        # For now, we just validate and return success
        logger.info(f"[{request_id}] Recovery action validated successfully")
        
        return {
            "valid": True,
            "message": "Action validated",
            "action_id": action.action_id,
            "estimated_recovery": action.estimated_recovery,
            "validated_at": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[{request_id}] Recovery validation failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Validation failed. Please try again later.")


@app.post("/generate_report")
async def generate_report_pdf_endpoint(request: PDFReportRequest):
    """
    Generate PDF report for the financial analysis.
    """
    request_id = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_pdf"
    logger.info(f"[{request_id}] PDF generation request received")
    
    try:
        # Generate PDF
        pdf_bytes = generate_report_pdf(
            simulation_data=request.simulation,
            user_profile=request.user_profile,
            ai_advice=request.ai_advice
        )
        
        logger.info(f"[{request_id}] PDF generated successfully, size: {len(pdf_bytes)} bytes")
        
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
        logger.error(f"[{request_id}] {error_msg}")
        logger.error(f"[{request_id}] Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Failed to generate PDF report. Please try again later.")


@app.get("/ping")
async def ping():
    """
    Warm-up endpoint to keep the instance alive.
    Returns immediately and triggers a lightweight AI call for warm-up.
    """
    request_id = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_ping"
    logger.info(f"[{request_id}] Ping received - warming up services")
    
    try:
        # Trigger a lightweight AI call to warm up the connection
        from ai_client import get_ai_response
        
        # This is a minimal warm-up call
        warmup_prompt = "Respond with just: OK"
        ai_response = get_ai_response(warmup_prompt, "warmup")
        
        logger.info(f"[{request_id}] Warm-up completed successfully")
        return {
            "status": "ok",
            "message": "Service warmed up",
            "ai_provider": get_current_ai_provider(),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.warning(f"[{request_id}] Warm-up AI call failed: {str(e)}")
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
async def root():
    index_path = os.path.join(FRONTEND_PATH, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "WillSpend API is running. Frontend not found."}
