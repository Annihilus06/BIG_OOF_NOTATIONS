"""
GridWise AI - FastAPI Backend Server
Official Competition & Platform Endpoints.
Orchestrates Gemini NLP Directives, Google OR-Tools LP, and Supabase Database.
"""
import os
import logging
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from models import (
    ScenarioData, Directive, SolveRequest, SolveResult,
    ParseNLRequest, OptimizeNLRequest, DirectivesContainer,
    CompetitionScenarioRequest, CompetitionScenarioResponse,
    DirectiveInterpretation, BatterySpec, HourlyInput
)
from optimizer import solve_energy_dispatch, solve_competition_scenario
from gemini_parser import interpret_operator_notes, parse_operator_instructions
from sample_data import SAMPLE_SCENARIOS, DEFAULT_SCENARIO
from database import db

logger = logging.getLogger("gridwise.server")

app = FastAPI(
    title="GridWise AI - Energy Optimization Engine",
    description="Canonical BUP CSE Fest Hackathon & Platform Energy Dispatch Optimization API.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================================================================
# CANONICAL COMPETITION JUDGING ENDPOINTS
# =====================================================================

@app.get("/health")
def health_check():
    """Must return {'status': 'ok'} per official hackathon spec."""
    return {"status": "ok"}


@app.post("/optimize-energy", response_model=CompetitionScenarioResponse)
def optimize_energy_canonical(req: CompetitionScenarioRequest):
    """
    Official Competition Judging Endpoint:
    1. Interprets and auto-normalizes operator_notes array.
    2. Enforces strict 24h power balance, battery limits, and End-of-Day Neutrality.
    3. Resolves overlapping multi-directive conflicts.
    4. Returns structured directives, 24h hourly dispatch plan, and BDT costs.
    """
    try:
        interpretations = interpret_operator_notes(req.operator_notes, req.battery)
        result = solve_competition_scenario(req, interpretations)
        return result
    except Exception as e:
        logger.error(f"Competition optimization error: {e}", exc_info=True)
        raise HTTPException(status_code=422, detail=f"Competition optimization error: {str(e)}")


# =====================================================================
# PLATFORM & ANALYTICS ENDPOINTS (Frontend, n8n, & Dashboard)
# =====================================================================

@app.post("/solve", response_model=SolveResult)
def solve_scenario(req: SolveRequest):
    """
    Internal solver endpoint optimized for frontend visualization and n8n direct payload execution.
    """
    try:
        result = solve_energy_dispatch(req.scenario, req.directives)
        if not result.success:
            raise HTTPException(status_code=422, detail=result.explanation)

        # Save to database
        db.save_optimization(req.scenario, req.directives, result, req.raw_prompt)
        return result
    except Exception as e:
        logger.error(f"Solver error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Optimization solver error: {str(e)}")


@app.post("/optimize", response_model=SolveResult)
def optimize_end_to_end(req: OptimizeNLRequest):
    """
    Combined End-to-End Endpoint:
    1. Translates prompt to directives.
    2. Solves Google OR-Tools LP model.
    3. Logs to Supabase and returns full analytics.
    """
    scenario = req.scenario or DEFAULT_SCENARIO
    battery = BatterySpec(
        capacity_kwh=scenario.battery_capacity_kwh,
        initial_energy_kwh=scenario.initial_soc_kwh,
        min_reserve_percent=scenario.min_soc_pct * 100.0,
        max_charge_kw=scenario.max_charge_kw,
        max_discharge_kw=scenario.max_discharge_kw
    )
    directives_container = parse_operator_instructions(req.prompt or "", battery)
    directives = directives_container.directives

    result = solve_energy_dispatch(scenario, directives)
    if not result.success:
        raise HTTPException(status_code=422, detail=result.explanation)

    db.save_optimization(scenario, directives, result, req.prompt)
    return result


@app.post("/process-nl", response_model=DirectivesContainer)
def process_natural_language(req: ParseNLRequest):
    """
    Translates operator natural language notes into structured directives JSON.
    """
    if not req.prompt.strip():
        raise HTTPException(status_code=400, detail="Operator prompt cannot be empty.")
    return parse_operator_instructions(req.prompt)


@app.get("/scenarios")
def get_sample_scenarios():
    """Returns available pre-configured scenarios for quick simulation."""
    return {key: scenario.model_dump() for key, scenario in SAMPLE_SCENARIOS.items()}


@app.get("/history")
def get_optimization_history(limit: int = 15):
    """Retrieves previous optimization runs and scenario records from database."""
    return db.get_history(limit=limit)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
