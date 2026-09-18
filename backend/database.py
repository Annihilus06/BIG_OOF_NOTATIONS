"""
Supabase Database Client & Local Fallback Store for GridWise AI
"""
import os
import datetime
from typing import List, Dict, Any, Optional
from models import SolveResult, ScenarioData, Directive


class DatabaseManager:
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_KEY")
        self.client = None
        self._local_history: List[Dict[str, Any]] = []

        if self.supabase_url and self.supabase_key and "your-supabase" not in self.supabase_url:
            try:
                from supabase import create_client
                self.client = create_client(self.supabase_url, self.supabase_key)
                print("[DB] Connected to Supabase PostgreSQL.")
            except Exception as e:
                print(f"[DB] Supabase connection error: {e}. Falling back to in-memory store.")
        else:
            print("[DB] Supabase credentials not set. Operating in high-speed local store mode.")

    def save_optimization(self, scenario: ScenarioData, directives: List[Directive], result: SolveResult, raw_prompt: Optional[str] = None) -> str:
        """Saves scenario, directives, and optimization results."""
        record_id = f"opt-{int(datetime.datetime.utcnow().timestamp())}"
        timestamp = datetime.datetime.utcnow().isoformat() + "Z"
        result.created_at = timestamp

        record = {
            "id": record_id,
            "scenario_name": scenario.name,
            "raw_prompt": raw_prompt or "",
            "total_cost": result.total_cost,
            "baseline_cost": result.baseline_cost,
            "savings_pct": result.savings_pct,
            "savings_amount": result.savings_amount,
            "total_solar_used_kwh": result.total_solar_used_kwh,
            "total_grid_imported_kwh": result.total_grid_imported_kwh,
            "total_battery_charged_kwh": result.total_battery_charged_kwh,
            "total_battery_discharged_kwh": result.total_battery_discharged_kwh,
            "solver_status": result.solver_status,
            "directives_count": len(directives),
            "hourly_schedule": [item.model_dump() for item in result.hourly_schedule],
            "directives_applied": [d.model_dump() for d in directives],
            "created_at": timestamp
        }

        # Save to local history
        self._local_history.insert(0, record)

        # Attempt to save to Supabase if client is active
        if self.client:
            try:
                self.client.table("optimization_results").insert({
                    "scenario_name": scenario.name,
                    "raw_prompt": raw_prompt or "",
                    "total_cost": float(result.total_cost),
                    "baseline_cost": float(result.baseline_cost),
                    "savings_pct": float(result.savings_pct),
                    "total_solar_used_kwh": float(result.total_solar_used_kwh),
                    "total_grid_imported_kwh": float(result.total_grid_imported_kwh),
                    "total_battery_charged_kwh": float(result.total_battery_charged_kwh),
                    "total_battery_discharged_kwh": float(result.total_battery_discharged_kwh),
                    "solver_status": result.solver_status,
                    "hourly_schedule": [item.model_dump() for item in result.hourly_schedule],
                    "directives_applied": [d.model_dump() for d in directives]
                }).execute()
            except Exception as e:
                print(f"[DB] Supabase insert warning: {e}")

        return record_id

    def get_history(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Retrieves past optimization runs."""
        if self.client:
            try:
                res = self.client.table("optimization_results").select("*").order("created_at", desc=True).limit(limit).execute()
                if res.data:
                    return res.data
            except Exception as e:
                print(f"[DB] Supabase query warning: {e}")
        return self._local_history[:limit]


db = DatabaseManager()
