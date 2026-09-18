"""
Pydantic Data Models for GridWise AI Platform
Clean Architecture Domain & Presentation Contracts.
Enforces strict mathematical typing, BDT currency, and canonical competition schemas.
"""
from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field, field_validator, model_validator


DirectiveType = Literal[
    "solar_reduction",
    "minimum_battery_reserve",
    "no_charge_window",
    "no_discharge_window",
    "max_grid_window",
    "no_op"
]


# =====================================================================
# Canonical Competition Schemas (Official Hackathon Spec)
# =====================================================================

class BatterySpec(BaseModel):
    capacity_kwh: float = Field(default=40.0, ge=0.1, description="Total energy capacity in kWh")
    initial_energy_kwh: float = Field(default=20.0, ge=0.0, description="Initial battery energy in kWh")
    min_reserve_percent: float = Field(default=20.0, ge=0.0, le=100.0, description="Base reserve percentage (0-100)")
    minimum_energy_kwh: Optional[float] = Field(default=None, description="Direct baseline reserve floor in kWh")
    max_charge_kw: float = Field(default=10.0, ge=0.0, description="Max charge power in kW")
    max_discharge_kw: float = Field(default=10.0, ge=0.0, description="Max discharge power in kW")
    charge_efficiency: float = Field(default=1.0, gt=0.0, le=1.0, description="Charging efficiency (0-1)")
    discharge_efficiency: float = Field(default=1.0, gt=0.0, le=1.0, description="Discharging efficiency (0-1)")

    @property
    def base_reserve_kwh(self) -> float:
        if self.minimum_energy_kwh is not None:
            return max(0.0, min(self.capacity_kwh, self.minimum_energy_kwh))
        return max(0.0, min(self.capacity_kwh, self.capacity_kwh * (self.min_reserve_percent / 100.0)))


class HourlyInput(BaseModel):
    hour: int = Field(..., ge=0, le=23, description="Hour of the day 0-23")
    demand_kwh: float = Field(..., ge=0.0, description="Building load demand in kWh")
    solar_kwh: float = Field(..., ge=0.0, description="Available solar generation in kWh")
    tariff_bdt_per_kwh: float = Field(..., ge=0.0, description="Grid purchase price in BDT/kWh")
    feed_in_tariff_bdt_per_kwh: Optional[float] = Field(default=0.0, ge=0.0, description="Grid export price in BDT/kWh")


class DirectiveInterpretation(BaseModel):
    raw_instruction: Optional[str] = Field(default="", description="Original operator note string")
    raw_note: Optional[str] = Field(default=None, description="Alias for compatibility")
    applies: bool = Field(default=True, description="True if operational constraint applies")
    directive_type: DirectiveType = Field(..., description="Identified constraint type")
    target_hours: List[int] = Field(default_factory=list, description="0-23 hour indices (start-inclusive, end-exclusive)")
    hours: Optional[List[int]] = Field(default=None, description="Alias for compatibility")
    structured_adjustment: Optional[Dict[str, Any]] = Field(default=None, description="Normalized adjustment details")
    factor: Optional[float] = Field(None, description="Solar factor (0.0 - 1.0)")
    min_soc_pct: Optional[float] = Field(None, description="Minimum reserve fraction (0.0 - 1.0)")
    min_reserve_kwh: Optional[float] = Field(None, description="Minimum reserve absolute kWh")
    max_grid_kwh: Optional[float] = Field(None, description="Maximum grid import kWh")
    max_grid_kw: Optional[float] = Field(None, description="Alias for max grid")
    confidence_score: float = Field(default=1.0, ge=0.0, le=1.0, description="Confidence score")
    clarification_notes: Optional[str] = Field(default="", description="Explanation of parsed directive")
    notes: Optional[str] = Field(default=None, description="Alias for explanation")

    @model_validator(mode="before")
    @classmethod
    def sync_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "raw_note" in data and not data.get("raw_instruction"):
                data["raw_instruction"] = data["raw_note"]
            elif "raw_instruction" in data and not data.get("raw_note"):
                data["raw_note"] = data["raw_instruction"]

            if "hours" in data and not data.get("target_hours"):
                data["target_hours"] = data["hours"]
            elif "target_hours" in data and not data.get("hours"):
                data["hours"] = data["target_hours"]

            if "notes" in data and not data.get("clarification_notes"):
                data["clarification_notes"] = data["notes"]
            elif "clarification_notes" in data and not data.get("notes"):
                data["notes"] = data["clarification_notes"]

            if "max_grid_kw" in data and not data.get("max_grid_kwh"):
                data["max_grid_kwh"] = data["max_grid_kw"]
            elif "max_grid_kwh" in data and not data.get("max_grid_kw"):
                data["max_grid_kw"] = data["max_grid_kwh"]

        return data


class HourlyPlanItem(BaseModel):
    hour: int = Field(..., ge=0, le=23)
    solar_used_kwh: float = Field(..., description="Solar used in kWh")
    battery_charge_kwh: float = Field(..., description="Battery charge in kWh")
    battery_discharge_kwh: float = Field(..., description="Battery discharge in kWh")
    battery_energy_after_kwh: float = Field(..., description="Battery energy after hour in kWh")
    battery_soc_percent: float = Field(..., description="Battery SOC percent 0-100")
    grid_kwh: float = Field(..., description="Grid import in kWh")
    tariff_bdt_per_kwh: float = Field(..., description="Tariff rate in BDT/kWh")
    hourly_cost_bdt: float = Field(..., description="Net cost for this hour in BDT")
    active_directives: List[str] = Field(default_factory=list, description="Directives active during this hour")
    battery_action: Optional[str] = Field(default="idle", description="'charge', 'discharge', or 'idle'")
    slack_unmet_kwh: Optional[float] = Field(default=0.0, description="Unmet load slack if grid capacity was exceeded")


class CompetitionScenarioRequest(BaseModel):
    scenario_id: str = Field(default="scenario_default", description="Unique scenario identifier")
    operator_notes: List[str] = Field(default_factory=list, description="Natural language notes from operator")
    battery: BatterySpec = Field(default_factory=BatterySpec, description="Battery hardware specifications")
    hours: List[HourlyInput] = Field(..., description="24 hourly data entries")

    @field_validator("hours")
    def validate_24_hours(cls, v):
        if len(v) != 24:
            raise ValueError(f"Scenario must provide exactly 24 hourly inputs, received {len(v)}")
        return v


class CompetitionScenarioResponse(BaseModel):
    scenario_id: str
    directive_interpretation: List[DirectiveInterpretation]
    hourly_plan: List[HourlyPlanItem]
    total_grid_kwh: float
    total_cost_bdt: float
    peak_grid_kwh: float
    plan_summary: str
    solver_status: str = "OPTIMAL"
    battery_end_of_day_neutral: bool = True
    validation_passed: bool = True


# =====================================================================
# Internal Platform & UI Compatibility Models
# =====================================================================

class Directive(BaseModel):
    id: str = Field(..., description="Unique directive ID")
    directive_type: DirectiveType = Field(..., description="Directive type")
    hours: List[int] = Field(default_factory=list, description="Hours list")
    value: float = Field(default=0.0, description="Directive magnitude")
    factor: Optional[float] = None
    min_soc_pct: Optional[float] = None
    max_grid_kw: Optional[float] = None
    applied: bool = True
    confidence: float = 1.0
    notes: Optional[str] = None
    status_message: Optional[str] = None
    description: Optional[str] = None


class DirectivesContainer(BaseModel):
    directives: List[Directive] = Field(default_factory=list)
    operator_summary: Optional[str] = Field(None, description="Summary of parsed operator intent")


class ScenarioData(BaseModel):
    name: str = Field(default="Standard Scenario")
    description: Optional[str] = ""
    battery_capacity_kwh: float = 40.0
    max_charge_kw: float = 10.0
    max_discharge_kw: float = 10.0
    initial_soc_kwh: float = 20.0
    final_soc_target_kwh: Optional[float] = 20.0
    battery_efficiency: float = 0.95
    min_soc_pct: float = 0.20
    max_soc_pct: float = 1.0
    degradation_cost_per_kwh: float = 0.0
    load_profile: List[float] = Field(..., min_length=24, max_length=24)
    solar_profile: List[float] = Field(..., min_length=24, max_length=24)
    tariff_profile: List[float] = Field(..., min_length=24, max_length=24)
    feed_in_tariff: Optional[List[float]] = None


class HourlyScheduleItem(BaseModel):
    hour: int
    time_label: str
    load_kwh: float
    solar_available_kwh: float
    solar_effective_kwh: float
    solar_used_kwh: float
    solar_curtailed_kwh: float
    battery_charge_kwh: float
    battery_discharge_kwh: float
    battery_soc_kwh: float
    battery_soc_pct: float
    grid_import_kwh: float
    grid_export_kwh: float
    tariff_bdt_per_kwh: float
    feed_in_tariff_bdt_per_kwh: float
    hourly_cost_bdt: float
    is_valid: bool = True
    validation_note: str = "VALID"
    active_directives: List[str] = []


class SolveResult(BaseModel):
    success: bool
    solver_status: str
    scenario_name: str
    currency: str = "BDT"
    total_cost_bdt: float
    baseline_cost_bdt: float
    savings_amount_bdt: float
    savings_pct: float
    total_solar_generated_kwh: float
    total_solar_used_kwh: float
    total_solar_curtailed_kwh: float
    solar_utilization_pct: float
    total_grid_imported_kwh: float
    total_grid_exported_kwh: float
    total_battery_charged_kwh: float
    total_battery_discharged_kwh: float
    peak_grid_demand_kw: float
    initial_battery_kwh: float
    final_battery_kwh: float
    battery_energy_balanced: bool
    directives_applied: List[Directive]
    hourly_schedule: List[HourlyScheduleItem]
    validation_passed: bool
    validation_errors: List[str]
    explanation: str
    created_at: Optional[str] = None


class SolveRequest(BaseModel):
    scenario: ScenarioData
    directives: List[Directive] = Field(default_factory=list)
    raw_prompt: Optional[str] = None


class ParseNLRequest(BaseModel):
    prompt: str


class OptimizeNLRequest(BaseModel):
    prompt: Optional[str] = None
    scenario: Optional[ScenarioData] = None
