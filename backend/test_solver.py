"""
Unit & Integration Tests for GridWise AI Optimization Engine
Tests Canonical Competition Spec, End-of-Day Neutrality, and Gemini Directives.
"""
import json
from models import (
    CompetitionScenarioRequest, BatterySpec, HourlyInput,
    ScenarioData, Directive
)
from optimizer import solve_competition_scenario, solve_energy_dispatch
from gemini_parser import interpret_operator_notes
from sample_data import DEFAULT_SCENARIO


def test_canonical_competition_spec():
    print("=== TEST 1: Canonical Competition Spec & End-of-Day Neutrality ===")
    
    req = CompetitionScenarioRequest(
        scenario_id="bup_fest_benchmark",
        operator_notes=[
            "Reduce solar generation to 20% from 12:00 to 15:00 due to afternoon desert storm",
            "Keep battery reserve at least 40% during peak tariff hours 18:00 to 22:00"
        ],
        battery=BatterySpec(
            capacity_kwh=40.0,
            initial_energy_kwh=20.0,
            min_reserve_percent=20.0,
            max_charge_kw=12.0,
            max_discharge_kw=12.0,
            charge_efficiency=0.95,
            discharge_efficiency=0.95
        ),
        hours=[
            HourlyInput(
                hour=h,
                demand_kwh=DEFAULT_SCENARIO.load_profile[h],
                solar_kwh=DEFAULT_SCENARIO.solar_profile[h],
                tariff_bdt_per_kwh=DEFAULT_SCENARIO.tariff_profile[h],
                feed_in_tariff_bdt_per_kwh=5.00
            )
            for h in range(24)
        ]
    )

    interps = interpret_operator_notes(req.operator_notes)
    print(f"  -> Interpreted {len(interps)} directives from operator notes")
    for interp in interps:
        print(f"     * Type: {interp.directive_type}, Hours: {interp.hours}, Factor: {interp.factor}, Min SOC: {interp.min_soc_pct}")

    res = solve_competition_scenario(req, interps)

    print(f"  -> Solver Status: {res.solver_status}")
    print(f"  -> Total Cost: BDT {res.total_cost_bdt}")
    print(f"  -> Total Grid: {res.total_grid_kwh} kWh")
    print(f"  -> Peak Grid: {res.peak_grid_kwh} kW")
    print(f"  -> Battery Start: {req.battery.initial_energy_kwh} kWh == End: {res.hourly_plan[-1].battery_energy_after_kwh} kWh")
    print(f"  -> End-of-Day Neutrality Passed: {res.battery_end_of_day_neutral}")

    assert res.solver_status == "OPTIMAL"
    assert res.battery_end_of_day_neutral == True
    assert abs(res.hourly_plan[-1].battery_energy_after_kwh - req.battery.initial_energy_kwh) <= 0.05
    print("  > CANONICAL SUEQUEST TEST PASSED 100%!\n")


def test_platform_solver():
    print("=== TEST 2: Platform Internal Solver & Savings Calculation ===")
    res = solve_energy_dispatch(DEFAULT_SCENARIO)
    print(f"  -> Baseline Cost: BDT {res.baseline_cost_bdt}, Optimized: BDT {res.total_cost_bdt}, Savings: {res.savings_pct}%")
    assert res.battery_energy_balanced == True
    print("  > PLATFORM SOLVERTEST PASSED 100%/\n")


if __name__ == "__main__":
    test_canonical_competition_spec()
    test_platform_solver()
    print(" [SUCCESS] ALL OPTIMIZATION & CANONICAL TESTS PASSED! 100%")
