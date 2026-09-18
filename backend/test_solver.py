"""
Unit test for Google OR-Tools Optimizer & Gemini Parser
"""
import sys
from models import Directive
from sample_data import DEFAULT_SCENARIO
from optimizer import solve_energy_dispatch
from gemini_parser import fallback_rule_based_parser

def run_tests():
    print("Testing 1: Baseline Solver (No Directives)...")
    res1 = solve_energy_dispatch(DEFAULT_SCENARIO, [])
    assert res1.success, "Baseline solve failed!"
    print(f"  -> Baseline Cost: ${res1.baseline_cost:.2f}, Optimized Cost: ${res1.total_cost:.2f}, Savings: {res1.savings_pct:.1f}%")

    print("Testing 2: Solar Reduction Directive (Drop to 20% at hours 13-14)...")
    d1 = Directive(directive_type="solar_reduction", hours=[13, 14], factor=0.2)
    res2 = solve_energy_dispatch(DEFAULT_SCENARIO, [d1])
    assert res2.success, "Solar reduction solve failed!"
    print(f"  -> Optimized Cost: ${res2.total_cost:.2f}, Solar Curtailment: {res2.total_solar_curtailed_kwh:.2f} kWh")

    print("Testing 3: NLP Parser on Operator Prompt...")
    prompt = "Solar production will drop to 20% between 1 PM and 3 PM, and keep at least 40% battery reserve from 6 PM to 10 PM"
    parsed = fallback_rule_based_parser(prompt)
    print(f"  -> Parsed {len(parsed.directives)} directives:")
    for d in parsed.directives:
        print(f"     * Type: {d.directive_type}, Hours: {d.hours}, Factor: {d.factor}, Min SOC: {d.min_soc_pct}")
    
    assert len(parsed.directives) >= 2, "Expected at least 2 directives parsed"

    print("Testing 4: Optimization with Parsed Directives...")
    res3 = solve_energy_dispatch(DEFAULT_SCENARIO, parsed.directives)
    assert res3.success, "Combined solve failed!"
    print(f"  -> Solved Successfully! Status: {res3.solver_status}, Cost: ${res3.total_cost:.2f}, Savings: {res3.savings_pct:.1f}%")
    print("\nALL BACKEND OPTIMIZER TESTS PASSED!")

if __name__ == "__main__":
    run_tests()
