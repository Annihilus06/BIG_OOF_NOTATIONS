"""
Pydantic Data Models for GridWise AI Platform
Clean Architecture Domain & Presentation Contracts.
Enforces strict mathematical typing, BDT currency, and canonical competition schemas.
"""
from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field, field_validator


DirectiveType = Literal[
    "solar_reduction",
    "minimum_battery_reserve",
    "no_charge_window",
    "no_discharge_window",
    "max_grid_window",
    "no_op"
]


# ====================================================================
# Canonical Competition Schemas (Official Hackathon Spec)
# =====================================================================

class BatterySpec(BaseModel):
    capacity_kwh: float = Field(default=40.0, ge=1.0, description="Total energy capacity in kWh")
    initial_energy_kwh: float = Field(default=20.0, ge=0.0, description="Initial battery energy in kWh")
    min_reserve_percent: float = Field(default=20.0, ge=0.0, le=100.0, description="Base reserve percentage (0-100)")
    max_charge_kw: float = Field(default=10.0, ge=0.1, description="Max charge power in kW")
    max_discharge_kw: float = Field(default=10.0, ge=0.1, description="Max discharge power in kW")
    charge_efficiency: float = Field(default=0.95, gt=0.0, le=1.0, description="Charging efficiency (0-1)")
    discharge_efficiency: float = Field(default=0.95, gt=0.0, le=1.0, description="Discharging efficiency (0-1)")


class HourlyInput(BaseModel):
    hour: int = Field(..., ge=0, le=23, description="Hour of the day 0-23")
    demand_kwh: float = Field(..., ge=0.0, description="Building load demand in kWh")
    solar_kwh: float = Field(..., ge=0.0, description="Available solar generation in kWh")
    tariff_bdt_per_kwh: float = Field(..., ge=0.0, description="Grid purchase price in BDT/kWh")
    feed_in_tariff_bdt_per_kwh: Optional[float] = Field(default=0.0, ge=0.0, description="Grid export price in BDT/kWh")


class CompetitionScenarioRequest(BaseModel):
    scenario_id: str = Field(default="scenario_default", description="Unique scenario identifier")
    operator_notes: List[str] = Field(default_factory=list, description="Natural language notes from operator")
    battery: BatterySpec = Field(default_factory=BatterySpec, description="Battery hardware specifications")
    hours: List[HourlyInput] = Field(..., description="24 hourly data entries")

    @field_validator("hours")
    def validate_24_hours(cls, v):
        if len(v) != 24:
            raise ValueError(f"Scenario must contain exactly 24 hourly values, got {len(v)}")
        return v


class DirectiveInterpretation(BaseModel):
    raw_note: str = Field(..., description="Original operator note string")
    applies: bool = Field(default=True, description="True if operational constraint applies")
    directive_type: DirectiveType = Field(..., description="Identified constraint type")
    hours: List[int] = Field(default_factory=list, description="Start-inclusive, end-exclusive 0-23 hour indices")
    factor: Optional[float] = Field(None, description="Solar factor or scaling fraction (0.0 - 1.0)")
    min_soc_pct: Optional[float] = Field(None, description="Minimum battery reserve fraction (0.0 - 1.0)")
    max_grid_kw: Optional[float] = Field(None, description="Maximum grid import kW")
    notes: Optional[str] = Field(None, description="Structured explanation of how directive was applied")


class HourlyPlanItem(BaseModel):
    hour: int
    solar_used_kwh: float
    battery_charge_kwh: float
    battery_discharge_kwh: float
    battery_energy_after_kwh: float
    battery_soc_percent: float
    grid_kwh: float
    tariff_bdt_per_kwh: float
    hourly_cost_bdt: float
    active_directives: List[str] = Field(default_factory=list)


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


# ====================================================================
# Internal Platform & UIpData Models
# ====================================================================

class Directive(BaseModel):
    directive_type: DirectiveType = Field(..., description="Type of energy operator directive")
    hours: List[int] = Field(default_factory=list, description="List of hour indices (0-23)")
    factor: Optional[float] = Field(None, description="Multiplication factor (0.0 - 1.0)")
    min_soc_pct: Optional[float] = Field(None, description="Minimum battery state of charge fraction (0.0 - 1.0)")
    max_grid_kw: Optional[float] = Field(None, description="Maximum allowed grid import (kW)")
    notes: Optional[str] = Field(None, description="Operator explanation or note")
    applied: bool = Field(default=True, description="Whether directive was mathematically enforced")
    status_message: Optional[str] = Field(default="ENFORCED", description="Enforcement status message")

    @field_validator("hours")
    def validate_hours(cls, v):
        for h in v:
            if not (0 <= h <= 23):
                raise ValueError(f"Hour {h} must be between 0 and 23")
        return sorted(list(set(v)))

    @field_validator("factor")
    def validate_factor(cls, v):
        if v is not None and not (0.0 <= v <= 1.0):
            raise ValueError(f"Factor {v} must be between 0.0 and 1.0")
        return v

    @field_validator("min_soc_pct")
    def validate_min_soc(cls, v):
        if v is not None and not (0.0 <= v <= 1.0):
            raise ValueError(f"min_soc_pct {v} must be between 0.0 and 1.0")
        return v


class DirectivesContainer(BaseModel):
    directives: List[Directive] = Field(default_factory=list)
    operator_summary: Optional[str] = Field(None, description="Summary of parsed operator intent")


class ScenarioData(BaseModel):
    name: str = Field(default="Standard 24h Microgrid", description="Scenario identifier")
    description: Optional[str] = Field(default="", description="Scenario description")
    battery_capacity_kwh: float = Field(default=40.0, ge=1.0, description="Total battery capacity in kWh")
    max_charge_kw: float = Field(default=10.0, ge=0.1, description="Maximum charging rate in kW")
    max_discharge_kw: float = Field(default=10.0, ge=0.1, description="Maximum discharging rate in kW")
    initial_soc_kwh: float = Field(default=20.0, ge=0.0, description="Initial battery energy level in kWh")
    final_soc_target_kwh: Optional[float] = Field(default=20.0, ge=0.0, description="Target final battery energy in kWh (must equal initial)")
    battery_efficiency: float = Field(default=0.95, gt=0.0, le=1.0, description="Battery one-way charging/discharging efficiency")
    min_soc_pct: float = Field(default=0.15, ge=0.0, le=0.5, description="Default minimum reserve fraction (0.0-1.0)")
    max_soc_pct: float = Field(default=0.95, ge=0.5, le=1.0, description="Maximum SOC ceiling fraction (0.0-1.0)")
    degradation_cost_bdt_per_kwh: float = Field(default=0.25, ge=0.0, description="Battery wear cost in BDT/kWh cycled")
    
    # 24-hour profiles
    load_profile: List[float] = Field(..., description="24-hour demand profile in kWh")
    solar_profile: List[float] = Field(..., description="24-hour solar generation in kWh")
    tariff_profile: List[float] = Field(..., description="24-hour grid purchase tariff (BDT/kWh)")
    feed_in_tariff: Optional[List[float]] = Field(default=None, description="24-hour grid export price (BDT/kWh)")

    @field_validator("load_profile", "solar_profile", "tariff_profile")
    def validate_24_hours(cls, v, info):
        if len(v) != 24:
            raise ValueError(f"{info.field_name} must contain exactly 24 hourly values, got {len(v)}")
        return v


class SolveRequest(BaseModel):
    scenario: ScenarioData
    directives: List[Directive] = Field(default_factory=list)
    raw_prompt: Optional[str] = Field(default=None)


class ParseNLRequest(BaseModel):
    prompt: str = Field(..., description="Natural language operator instructions")


class OptimizeNLRequest(BaseModel):
    prompt: Optional[str] = Field(default="", description="Operator instructions")
    scenario: Optional[ScenarioData] = Field(default=None, description="Optional custom scenario")


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
    is_valid: bool = Field(default=True, description="Hourly power balance and constraint validation status")
    validation_note: Optional[str] = Field(default="VALID", description="Hourly validation note")
    active_directives: List[str] = Field(default_factory=list)


class SolveResult(BaseModel):
    success: bool
    solver_status: str = Field(..., description="OPTIMAL, FEASBILE, or INVALID")
    scenario_name: str
    currency: str = Field(default="BDT", description="Currency unit")
    
    # Financial metrics in BDT
    total_cost_bdt: float
    baseline_cost_bdt: float
    savings_amount_bdt: float
    savings_pct: float
    
    # Energy metrics (kWh)
    total_solar_generated_kwh: float
    total_solar_used_kwh: float
    total_solar_curtailed_kwh: float
    solar_utilization_pct: float
    total_grid_imported_kwh: float
    total_grid_exported_kwh: float
    total_battery_charged_kwh: float
    total_battery_discharged_kwh: float
    peak_grid_demand_kw: float
    
    # Battery balance check
    initial_battery_kwh: float
    final_battery_kwh: float
    battery_energy_balanced: bool = Field(..., description="True if final energy == initial energy")
    
    # Directives & Schedule
    directives_applied: List[Directive]
    hourly_schedule: List[HourlyScheduleItem]
    
    # Validation
    validation_passed: bool
    validation_errors: List[str] = Field(default_factory=list)
    explanation: Optional[str] = None
    created_at: Optional[str] = None
