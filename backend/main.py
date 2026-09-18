"""
GridWise AI - FastAPI Backend Server
Orchestrates Gemini AI Natural Language Directives, OR-Tools Optimization Engine, and Database.
"""
import os
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from models import (
    ScenarioData, Directive, SolveRequest, SolveResult,
    ParseNLRequest, OptimizeNLRequest, DirectivesContainer
)
from optimizer import solve_energy_dispatch
from gemini_parser import parse_operator_instructions
from sample_data import SAMPLE_SCENARIOS, DEFAULT_SCENARIO
from database import db

app = FastAPI(
    title="GridWise AI – Energy Optimization Engine",
    description="Mathematical 24-hour Energy Dispatch Optimization API with Gemini Directives and Google OR-Tools.",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    """Service health and capability check."""
    return {
        "status": "healthy",
        "service": "GridWise AI Engine",
        "optimizer": "Google OR-Tools (GLOP LP)",
        "gemini_nlp": "Active" if os.getenv("GEMINI_API_KEY") else "Heuristic/Rule-based Fallback Active",
        "supabase": "Configured" if os.getenv("SUPABASE_URL") else "In-Memory Store Active"
    }


@app.get("/scenarios")
def get_sample_scenarios():
    """Returns available pre-configured scenarios for quick simulation."""
    return {key: scenario.model_dump() for key, scenario in SAMPLE_SCENARIOS.items()}


@app.post("/process-nl", response_model=DirectivesContainer)
def process_natural_language(req: ParseNLRequest):
    """
    Translates operator natural language notes into structured directives JSON using Gemini Flash.
    Strict Rule: Gemini never solves the optimization; it only extracts directives.
    """
    if not req.prompt.strip():
        raise HTTPException(status_code=400, detail="Operator prompt cannot be empty.")
    
    parsed = parse_operator_instructions(req.prompt)
    return parsed


@app.post("/solve", response_model=SolveResult)
def solve_scenario(req: SolveRequest):
    """
    Core mathematical optimization endpoint using Google OR-Tools.
    Enforces all battery dynamics, power balance, tariff prices, and operator directives.
    """
    try:
        result = solve_energy_dispatch(req.scenario, req.directives)
        if not result.success:
            raise HTTPException(status_code=422, detail=result.explanation)

        # Save run record
        db.save_optimization(req.scenario, req.directives, result, req.raw_prompt)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization solver error: {str(e)}")


@app.post("/optimize", response_model=SolveResult)
def optimize_end_to_end(req: OptimizeNLRequest):
    """
    Combined End-to-End Endpoint:
    1. Extracts structured directives from prompt via Gemini.
    2. Validates directives.
    3. Runs Google OR-Tools mathematical optimization.
    4. Persists to database.
    5. Returns lowest-cost 24h schedule and analytics.
    """
    scenario = req.scenario or DEFAULT_SCENARIO
    directives_container = parse_operator_instructions(req.prompt or "")
    directives = directives_container.directives

    result = solve_energy_dispatch(scenario, directives)
    if not result.success:
        raise HTTPException(status_code=422, detail=result.explanation)

    db.save_optimization(scenario, directives, result, req.prompt)
    return result


@app.get("/history")
def get_optimization_history(limit: int = 15):
    """Retrieves previous optimization runs and scenario records."""
    return db.get_history(limit=limit)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
