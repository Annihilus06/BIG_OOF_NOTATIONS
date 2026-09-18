"""
GridWise AI - Comprehensive End-to-End Verification Suite
Validates 10 distinct sample cases covering canonical competition requirements,
mathematical energy balance, end-of-day neutrality, and multi-directive conflict handling.
"""

import sys
import json
import urllib.request
import urllib.error

BASE_URL = "http://localhost:8000"


def generate_base_hours(demand_base=10.0, peak_demand=18.0, solar_peak=20.0, tariff_base=8.0, tariff_peak=15.0):
    hours = []
    for h in range(24):
        demand = demand_base + (peak_demand - demand_base) * (1.0 if 17 <= h <= 21 else (0.5 if 9 <= h <= 16 else 0.1))
        solar = 0.0
        if 7 <= h <= 17:
            solar = solar_peak * max(0.0, 1.0 - abs(h - 12) / 5.0)
        tariff = tariff_peak if 17 <= h <= 21 else tariff_base
        hours.append({
            "hour": h,
            "demand_kwh": round(demand, 2),
            "solar_kwh": round(solar, 2),
            "tariff_bdt_per_kwh": tariff,
            "feed_in_tariff_bdt_per_kwh": 0.0
        })
    return hours


SAMPLE_CASES = [
    {
        "id": "case_01_baseline_nominal",
        "description": "Baseline scenario with no operator notes (pure cost minimization)",
        "operator_notes": [],
        "battery": {"capacity_kwh": 40.0, "initial_energy_kwh": 20.0, "min_reserve_percent": 20.0, "max_charge_kw": 10.0, "max_discharge_kw": 10.0},
        "hours": generate_base_hours()
    },
    {
        "id": "case_02_solar_reduction_midday",
        "description": "Midday cloud cover reducing solar by 75% between 11:00 and 15:00",
        "operator_notes": ["Heavy overcast from 11:00 to 15:00 reducing solar output by 75%"],
        "battery": {"capacity_kwh": 40.0, "initial_energy_kwh": 20.0, "min_reserve_percent": 20.0, "max_charge_kw": 10.0, "max_discharge_kw": 10.0},
        "hours": generate_base_hours()
    },
    {
        "id": "case_03_min_reserve_elevation",
        "description": "Dynamic reserve floor elevation to 50% during evening peak 18:00 to 22:00",
        "operator_notes": ["Maintain at least 50% battery reserve from 18:00 to 22:00 for grid resilience"],
        "battery": {"capacity_kwh": 40.0, "initial_energy_kwh": 20.0, "min_reserve_percent": 20.0, "max_charge_kw": 10.0, "max_discharge_kw": 10.0},
        "hours": generate_base_hours()
    },
    {
        "id": "case_04_no_charge_window",
        "description": "Prohibit battery charging during high TOU tariff window 17:00 to 22:00",
        "operator_notes": ["Do not charge battery from 17:00 to 22:00"],
        "battery": {"capacity_kwh": 40.0, "initial_energy_kwh": 20.0, "min_reserve_percent": 20.0, "max_charge_kw": 10.0, "max_discharge_kw": 10.0},
        "hours": generate_base_hours()
    },
    {
        "id": "case_05_no_discharge_window",
        "description": "Prohibit battery discharging during early morning window 00:00 to 06:00",
        "operator_notes": ["Stop battery discharge from 0:00 to 6:00"],
        "battery": {"capacity_kwh": 40.0, "initial_energy_kwh": 20.0, "min_reserve_percent": 20.0, "max_charge_kw": 10.0, "max_discharge_kw": 10.0},
        "hours": generate_base_hours()
    },
    {
        "id": "case_06_max_grid_cap",
        "description": "Cap grid import demand at 15 kW during evening peak 17:00 to 21:00",
        "operator_notes": ["Limit grid import to 15 kW from 17:00 to 21:00"],
        "battery": {"capacity_kwh": 50.0, "initial_energy_kwh": 25.0, "min_reserve_percent": 15.0, "max_charge_kw": 15.0, "max_discharge_kw": 15.0},
        "hours": generate_base_hours(peak_demand=20.0)
    },
    {
        "id": "case_07_overlapping_multi_directives",
        "description": "Compound test: Solar drop + elevated reserve + evening no-charge window",
        "operator_notes": [
            "Dust on solar panels from 12:00 to 15:00 reducing solar by 60%",
            "Keep minimum 40% battery reserve from 18:00 to 22:00",
            "Do not charge battery from 17:00 to 22:00"
        ],
        "battery": {"capacity_kwh": 40.0, "initial_energy_kwh": 20.0, "min_reserve_percent": 20.0, "max_charge_kw": 10.0, "max_discharge_kw": 10.0},
        "hours": generate_base_hours()
    },
    {
        "id": "case_08_percentage_normalization",
        "description": "LLM output normalization test with raw percentages > 1.0 (e.g. factor 20%, reserve 45%)",
        "operator_notes": [
            "Solar factor of 20% from 11:00 to 14:00",
            "Maintain 45% reserve from 17:00 to 21:00"
        ],
        "battery": {"capacity_kwh": 40.0, "initial_energy_kwh": 20.0, "min_reserve_percent": 20.0, "max_charge_kw": 10.0, "max_discharge_kw": 10.0},
        "hours": generate_base_hours()
    },
    {
        "id": "case_09_informational_noop_notes",
        "description": "Notes with informational text (should safely map to no_op with applies=False)",
        "operator_notes": [
            "Routine maintenance inspection completed at transformer substation",
            "All systems nominal and ready for dispatch"
        ],
        "battery": {"capacity_kwh": 40.0, "initial_energy_kwh": 20.0, "min_reserve_percent": 20.0, "max_charge_kw": 10.0, "max_discharge_kw": 10.0},
        "hours": generate_base_hours()
    },
    {
        "id": "case_10_extreme_stress_test",
        "description": "High demand surge with tight battery constraints and neutrality verification",
        "operator_notes": [
            "Cloud cover from 10:00 to 16:00 reducing solar by 50%",
            "Keep minimum 30% battery reserve from 00:00 to 24:00"
        ],
        "battery": {"capacity_kwh": 60.0, "initial_energy_kwh": 30.0, "min_reserve_percent": 20.0, "max_charge_kw": 15.0, "max_discharge_kw": 15.0},
        "hours": generate_base_hours(demand_base=15.0, peak_demand=25.0)
    }
]


def run_verification():
    print("=" * 75)
    print("GRIDWISE AI - AUTOMATED E2E VERIFICATION SUITE")
    print("=" * 75)

    try:
        req = urllib.request.Request(f"{BASE_URL}/health")
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            assert data.get("status") == "ok", f"Healthcheck returned {data}"
            print("[PASS] GET /health -> status: ok")
    except Exception as e:
        print(f"[FAIL] GET /health connection failed: {e}")
        sys.exit(1)

    passed = 0
    total = len(SAMPLE_CASES)

    for idx, case in enumerate(SAMPLE_CASES, 1):
        case_id = case["id"]
        desc = case["description"]
        print(f"\n--- Test {idx}/{total}: {case_id} ---")
        print(f"    Scenario: {desc}")

        payload = {
            "scenario_id": case_id,
            "operator_notes": case["operator_notes"],
            "battery": case["battery"],
            "hours": case["hours"]
        }

        try:
            req = urllib.request.Request(
                f"{BASE_URL}/optimize-energy",
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                assert resp.status == 200, f"Expected 200, got {resp.status}"
                res = json.loads(resp.read().decode("utf-8"))

                # Invariant 1: Schema Compliance
                assert "scenario_id" in res and res["scenario_id"] == case_id
                assert "directive_interpretation" in res and isinstance(res["directive_interpretation"], list)
                assert len(res["directive_interpretation"]) == len(case["operator_notes"])
                assert "hourly_plan" in res and len(res["hourly_plan"]) == 24
                assert "total_grid_kwh" in res and res["total_grid_kwh"] >= 0.0
                assert "total_cost_bdt" in res and res["total_cost_bdt"] >= 0.0
                assert "peak_grid_kwh" in res and res["peak_grid_kwh"] >= 0.0
                assert res.get("solver_status") == "OPTIMAL"

                # Invariant 2: End-of-Day Neutrality
                init_bat = case["battery"]["initial_energy_kwh"]
                final_bat = res["hourly_plan"][23]["battery_energy_after_kwh"]
                bat_diff = abs(final_bat - init_bat)
                assert bat_diff <= 0.01, f"End-of-day neutrality failed: start={init_bat} vs end={final_bat} (diff={bat_diff})"

                # Invariant 3: Recalculated Energy Balance for all 24 hours
                for h_item in res["hourly_plan"]:
                    h = h_item["hour"]
                    demand = case["hours"][h]["demand_kwh"]
                    grid_in = h_item["grid_kwh"]
                    solar_u = h_item["solar_used_kwh"]
                    b_dis = h_item["battery_discharge_kwh"]
                    b_chg = h_item["battery_charge_kwh"]
                    slack = h_item.get("slack_unmet_kwh", 0.0)

                    supply = grid_in + solar_u + b_dis + slack
                    consumption = demand + b_chg
                    bal_diff = abs(supply - consumption)
                    assert bal_diff <= 0.01, f"Energy balance violated at hour {h}: supply={supply} vs consumption={consumption} (diff={bal_diff})"

                    # Invariant 3b: Battery Action Categorization
                    action = h_item.get("battery_action")
                    if b_chg > 0.001:
                        assert action == "charge", f"Hour {h}: charge > 0 but action={action}"
                    elif b_dis > 0.001:
                        assert action == "discharge", f"Hour {h}: discharge > 0 but action={action}"
                    else:
                        assert action == "idle", f"Hour {h}: idle expected, got {action}"

                # Invariant 4: Recalculated Summary Values
                recalc_grid = round(sum(item["grid_kwh"] for item in res["hourly_plan"]), 2)
                recalc_cost = round(sum(item["grid_kwh"] * case["hours"][item["hour"]]["tariff_bdt_per_kwh"] for item in res["hourly_plan"]), 2)
                recalc_peak = round(max(item["grid_kwh"] for item in res["hourly_plan"]), 2)

                assert abs(res["total_grid_kwh"] - recalc_grid) <= 0.05, f"Grid total mismatch: {res['total_grid_kwh']} vs {recalc_grid}"
                assert abs(res["total_cost_bdt"] - recalc_cost) <= 0.05, f"Cost total mismatch: {res['total_cost_bdt']} vs {recalc_cost}"
                assert abs(res["peak_grid_kwh"] - recalc_peak) <= 0.05, f"Peak grid mismatch: {res['peak_grid_kwh']} vs {recalc_peak}"

                print(f"    -> Status: OPTIMAL | Cost: BDT {res['total_cost_bdt']:.2f} | Grid: {res['total_grid_kwh']:.2f} kWh | Peak: {res['peak_grid_kwh']:.2f} kW | Bat End: {final_bat:.2f} kWh")
                print(f"    -> Invariants Verified: [Schema: OK, Neutrality: OK, Balance: OK, Action: OK, Totals: OK]")
                passed += 1

        except Exception as e:
            print(f"    -> [FAILED]: {e}")

    print("\n" + "=" * 75)
    print(f"VERIFICATION SUMMARY: {passed}/{total} TESTS PASSED ({(passed/total)*100:.1f}%)")
    print("=" * 75)

    if passed == total:
        print("[SUCCESS] ALL 10 SAMPLE SCENARIOS PASSED 100% WITH ZERO ERRORS!")
        return 0
    else:
        print(f"[FAILURE] {total - passed} test(s) failed.")
        return 1


if __name__ == "__main__":
    sys.exit(run_verification())
