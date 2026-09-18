"""
Supabase Database Integration for GridWise AI Platform
Uses direct REST PostgREST API with fallback in-memory store for high reliability.
"""
import os
import datetime
import requests
from typing import List, Dict, Any, Optional
from models import SolveResult, ScenarioData, Directive


class DatabaseManager:
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
        self.supabase_key = os.getenv("SUPABASE_KEY", "")
        self._local_history: List[Dict[str, Any]] = []

        if self.supabase_url and self.supabase_key and "your-project" not in self.supabase_url:
            print(f"[DB] Supabase configured: {self.supabase_url}")
        else:
            print("[DB] Operating in local memory fallback mode.")

    def _get_headers(self) -> Dict[str, str]:
        return {
            "apikey": self.supabase_key,
            "Authorization": f"Bearer {self.supabase_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

    def save_optimization(self, scenario: ScenarioData, directives: List[Directive], result: SolveResult, raw_prompt: Optional[str] = None) -> str:
        """Saves scenario, directives, and optimization results to Supabase and local cache."""
        record_id = f"opt-{int(datetime.datetime.utcnow().timestamp())}"
        timestamp = datetime.datetime.utcnow().isoformat() + "Z"
        result.created_at = timestamp

        record = {
            "id": record_id,
            "scenario_name": scenario.name,
            "raw_prompt": raw_prompt or "",
            "total_cost": float(result.total_cost),
            "baseline_cost": float(result.baseline_cost),
            "savings_pct": float(result.savings_pct),
            "savings_amount": float(result.savings_amount),
            "total_solar_used_kwh": float(result.total_solar_used_kwh),
            "total_grid_imported_kwh": float(result.total_grid_imported_kwh),
            "total_battery_charged_kwh": float(result.total_battery_charged_kwh),
            "total_battery_discharged_kwh": float(result.total_battery_discharged_kwh),
            "solver_status": result.solver_status,
            "directives_count": len(directives),
            "hourly_schedule": [item.model_dump() for item in result.hourly_schedule],
            "directives_applied": [d.model_dump() for d in directives],
            "created_at": timestamp
        }

        # Save to local history
        self._local_history.insert(0, record)

        # Insert directly to Supabase REST endpoint
        if self.supabase_url and self.supabase_key:
            try:
                endpoint = f"{self.supabase_url}/rest/v1/optimization_results"
                payload = {
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
                }
                resp = requests.post(endpoint, json=payload, headers=self._get_headers(), timeout=5)
                if resp.status_code in [200, 201]:
                    print("[DB] Successfully inserted record into Supabase optimization_results table!")
                else:
                    print(f"[DB] Supabase insert response ({resp.status_code}): {resp.text}")
            except Exception as e:
                print(f"[DB] Supabase insert warning: {e}")

        return record_id

    def get_history(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Retrieves past optimization runs from Supabase or local cache."""
        if self.supabase_url and self.supabase_key:
            try:
                endpoint = f"{self.supabase_url}/rest/v1/optimization_results?select=*&order=created_at.desc&limit={limit}"
                resp = requests.get(endpoint, headers=self._get_headers(), timeout=5)
                if resp.status_code == 200:
                    data = resp.json()
                    if data and isinstance(data, list) and len(data) > 0:
                        return data
            except Exception as e:
                print(f"[DB] Supabase query warning: {e}")

        return self._local_history[:limit]


db = DatabaseManager()
