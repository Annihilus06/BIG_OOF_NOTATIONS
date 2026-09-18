"""
Unit test for Google OR-Tools Optimizer & Gemini Parser with BDT Currency
and Strict Initial == Final Battery Energy Balance Validation.
"""
import sys
sys.stdout.reconfigure(encoding='utf-8')

from models import Directive
from sample_data import DEFAULT_SCENARIO
from optimizer import solve_energy_dispatch
from gemini_parser import fallback_rule_based_parser

def run_tests():
    print("Testing 1: Baseline Solver (No Directives)...")
    res1 = solve_energy_dispatch(DEFAULT_SCENARIO, [])
    assert res1.success, f"Baseline solve failed! Status: {res1.solver_status}, Errors: {res1.validation_errors}"
    assert res1.battery_energy_balanced, "Battery start and end energy mismatch!"
    assert abs(res1.initial_battery_kwh - res1.final_battery_kwh) <= 0.05, f"Initial {res1.initial_battery_kwh} != Final {res1.final_battery_kwh}"
    print(f"  -> Baseline Cost: BDT {res1.baseline_cost_bdt:.2f}, Optimized Cost: BDT {res1.total_cost_bdt:.2f}, Savings: {res1.savings_pct:.1f}%")
    print(f"  -> Initial Battery: {res1.initial_battery_kwh} kWh == Final Battery: {res1.final_battery_kwh} kWh [CONSERVED]")

    print("\nTesting 2: Solar Reduction Directive (Drop to 20% at hours 13-14)...")
    d1 = Directive(directive_type="solar_reduction", hours=[13, 14], factor=0.2)
    res2 = solve_energy_dispatch(DEFAULT_SCENARIO, [d1])
    assert res2.success, f"Solar reduction solve failed! Errors: {res2.validation_errors}"
    assert res2.battery_energy_balanced, "Battery start and end energy mismatch!"
    print(f"  -> Optimized Cost: BDT {res2.total_cost_bdt:.2f}, Solar Curtailed: {res2.total_solar_curtailed_kwh:.2f} kWh")

    print("\nTesting 3: NLP Parser on Operator Prompt...")
    prompt = "Solar production will drop to 20% between 1 PM and 3 PM, and keep at least 40% battery reserve from 6 PM to 10 PM"
    parsed = fallback_rule_based_parser(prompt)
    print(f"  -> Parsed {len(parsed.directives)} directives:")
    for d in parsed.directives:
        print(f"     * Type: {d.directive_type}, Hours: {d.hours}, Factor: {d.factor}, Min SOC: {d.min_soc_pct}")
    
    assert len(parsed.directives) >= 2, "Expected at least 2 directives parsed"

    print("\nTesting 4: Optimization with Directives & Full Energy Balance Checks...")
    res3 = solve_energy_dispatch(DEFAULT_SCENARIO, parsed.directives)
    assert res3.success, f"Combined solve failed! Errors: {res3.validation_errors}"
    assert res3.validation_passed, "Validation failed!"
    print(f"  -> Solver Status: {res3.solver_status}")
    print(f"  -> Cost: BDT {res3.total_cost_bdt:.2f}, Savings: {res3.savings_pct:.1f}%")
    print(f"  -> All 24 Hourly Power Balances Valid: {all(h.is_valid for h in res3.hourly_schedule)}")
    print(f"  -> Battery Initial ({res3.initial_battery_kwh} kWh) == Final ({res3.final_battery_kwh} kWh)")

    print("\nALL STRICT CONSTRAINT & VALIDATION TESTS PASSED 100%!")

if __name__ == "__main__":
    run_tests()