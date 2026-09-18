"""
Pydantic Models for GridWise AI Platform
"""
from typing import List, Optional, Literal, Union, Dict, Any
from pydantic import BaseModel, Field, field_validator


DirectiveType = Literal[
    "solar_reduction",
    "minimum_battery_reserve",
    "no_charge_window",
    "no_discharge_window",
    "max_grid_window",
    "no_op"
]


class Directive(BaseModel):
    directive_type: DirectiveType = Field(..., description="Type of energy operator directive")
    hours: List[int] = Field(default_factory=list, description="List of hour indices (0-23) this directive applies to")
    factor: Optional[float] = Field(None, description="Multiplication factor (e.g., 0.2 for 20% solar reduction)")
    min_soc_pct: Optional[float] = Field(None, description="Minimum battery state of charge fraction (0.0 - 1.0)")
    max_grid_kw: Optional[float] = Field(None, description="Maximum allowed grid import (kW)")
    notes: Optional[str] = Field(None, description="Explanation or reasoning")

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
    name: str = Field(default="Default 24h Scenario", description="Scenario identifier")
    description: Optional[str] = Field(default="", description="Scenario description")
    battery_capacity_kwh: float = Field(default=20.0, ge=1.0, description="Total battery capacity in kWh")
    max_charge_kw: float = Field(default=5.0, ge=0.1, description="Maximum battery charging rate in kW")
    max_discharge_kw: float = Field(default=5.0, ge=0.1, description="Maximum battery discharging rate in kW")
    initial_soc_kwh: float = Field(default=10.0, ge=0.0, description="Initial battery energy level in kWh")
    final_soc_target_kwh: Optional[float] = Field(default=10.0, ge=0.0, description="Target ending battery energy level in kWh")
    battery_efficiency: float = Field(default=0.95, gt=0.0, le=1.0, description="One-way battery efficiency")
    min_soc_pct: float = Field(default=0.10, ge=0.0, le=0.5, description="Default minimum battery SOC floor (0.0-1.0)")
    max_soc_pct: float = Field(default=0.95, ge=0.5, le=1.0, description="Default maximum battery SOC ceiling (0.0-1.0)")
    degradation_cost_per_kwh: float = Field(default=0.005, ge=0.0, description="Battery wear cost ($/kWh cycled)")
    
    # 24-hour profiles
    load_profile: List[float] = Field(..., description="24-hour electrical demand profile (kWh per hour)")
    solar_profile: List[float] = Field(..., description="24-hour solar generation profile (kWh per hour)")
    tariff_profile: List[float] = Field(..., description="24-hour grid purchase tariff ($/kWh)")
    feed_in_tariff: Optional[List[float]] = Field(default=None, description="24-hour grid export sell price ($/kWh)")

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
    scenario: Optional[ScenarioData] = Field(default=None, description="Optional custom scenario. If omitted, default baseline is used.")


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
    tariff_per_kwh: float
    feed_in_tariff_per_kwh: float
    hourly_cost: float
    active_directives: List[str] = Field(default_factory=list)


class SolveResult(BaseModel):
    success: bool
    solver_status: str
    scenario_name: str
    total_cost: float
    baseline_cost: float
    savings_amount: float
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
    directives_applied: List[Directive]
    hourly_schedule: List[HourlyScheduleItem]
    explanation: Optional[str] = None
    created_at: Optional[str] = None
