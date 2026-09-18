"""
Google OR-Tools Energy Dispatch Optimizer for GridWise AI Platform
Solves the optimal 24-hour battery and grid dispatch with strict energy balance,
exact end-of-day battery neutrality, and post-solve constraint validation.
"""
from typing import List, Dict, Any, Tuple
from ortools.linear_solver import pywraplp
from models import ScenarioData, Directive, SolveResult, HourlyScheduleItem


def solve_energy_dispatch(scenario: ScenarioData, directives: List[Directive]) -> SolveResult:
    """
    Formulates and solves a 24-hour Linear Program (LP) using Google OR-Tools (GLOP solver)
    with strict initial == final battery energy conservation and directive validation.
    """
    solver = pywraplp.Solver.CreateSolver("GLOP")
    if not solver:
        solver = pywraplp.Solver.CreateSolver("CBC") or pywraplp.Solver.CreateSolver("SCIP")
    
    if not solver:
        raise RuntimeError("No suitable OR-Tools linear solver found (GLOP/CBC/SCIP).")

    T = 24
    hours = list(range(T))

    # 1. Pre-process Directives by Hour
    solar_factors = [1.0] * T
    min_soc_limits = [scenario.battery_capacity_kwh * scenario.min_soc_pct] * T
    max_grid_limits = [float('inf')] * T
    no_charge_hours = set()
    no_discharge_hours = set()
    active_directive_labels: Dict[int, List[str]] = {h: [] for h in hours}

    # Track directive application status
    processed_directives: List[Directive] = []

    for d in directives:
        d_copy = d.model_copy()
        try:
            if d.directive_type == "solar_reduction":
                factor = d.factor if d.factor is not None else 1.0
                for h in d.hours:
                    solar_factors[h] = min(solar_factors[h], factor)
                    active_directive_labels[h].append(f"Solar reduced to {int(factor * 100)}%")
                d_copy.applied = True
                d_copy.status_message = f"Enforced {int(factor * 100)}% solar factor across hours {d.hours}"

            elif d.directive_type == "minimum_battery_reserve":
                pct = d.min_soc_pct if d.min_soc_pct is not None else scenario.min_soc_pct
                for h in d.hours:
                    req_kwh = scenario.battery_capacity_kwh * pct
                    min_soc_limits[h] = max(min_soc_limits[h], req_kwh)
                    active_directive_labels[h].append(f"Min reserve {int(pct * 100)}%")
                d_copy.applied = True
                d_copy.status_message = f"Enforced minimum reserve >= {int(pct * 100)}% for hours {d.hours}"

            elif d.directive_type == "no_charge_window":
                for h in d.hours:
                    no_charge_hours.add(h)
                    active_directive_labels[h].append("No Battery Charge")
                d_copy.applied = True
                d_copy.status_message = f"Charging locked out during hours {d.hours}"

            elif d.directive_type == "no_discharge_window":
                for h in d.hours:
                    no_discharge_hours.add(h)
                    active_directive_labels[h].append("No Battery Discharge")
                d_copy.applied = True
                d_copy.status_message = f"Discharging locked out during hours {d.hours}"

            elif d.directive_type == "max_grid_window":
                mg = d.max_grid_kw if d.max_grid_kw is not None else float('inf')
                for h in d.hours:
                    max_grid_limits[h] = min(max_grid_limits[h], mg)
                    active_directive_labels[h].append(f"Max Grid Cap {mg} kW")
                d_copy.applied = True
                d_copy.status_message = f"Grid import capped at {mg} kW for hours {d.hours}"

            elif d.directive_type == "no_op":
                d_copy.applied = True
                d_copy.status_message = "No operational restriction"

        except Exception as ex:
            d_copy.applied = False
            d_copy.status_message = f"Failed to enforce: {str(ex)}"

        processed_directives.append(d_copy)

    # Effective Solar Generation Profile
    solar_effective = [scenario.solar_profile[h] * solar_factors[h] for h in hours]
    feed_in = scenario.feed_in_tariff if scenario.feed_in_tariff else [0.0] * T

    # Decision Variables
    infinity = solver.infinity()
    grid_import = [solver.NumVar(0.0, max_grid_limits[h] if max_grid_limits[h] != float('inf') else infinity, f"grid_in_{h}") for h in hours]
    grid_export = [solver.NumVar(0.0, infinity, f"grid_out_{h}") for h in hours]
    
    # Battery Charge / Discharge Variables (kW)
    charge = []
    discharge = []
    for h in hours:
        max_chg = 0.0 if h in no_charge_hours else scenario.max_charge_kw
        max_dis = 0.0 if h in no_discharge_hours else scenario.max_discharge_kw
        charge.append(solver.NumVar(0.0, max_chg, f"charge_{h}"))
        discharge.append(solver.NumVar(0.0, max_dis, f"discharge_{h}"))

    # Solar Used / Curtailed
    solar_used = [solver.NumVar(0.0, solar_effective[h], f"solar_used_{h}") for h in hours]
    solar_curtailed = [solver.NumVar(0.0, solar_effective[h], f"solar_curt_{h}") for h in hours]

    # Battery State of Charge (SOC in kWh)
    max_soc_cap = scenario.battery_capacity_kwh * scenario.max_soc_pct
    soc = [solver.NumVar(min_soc_limits[h], max_soc_cap, f"soc_{h}") for h in hours]

    eta = scenario.battery_efficiency  # charging / discharging efficiency (e.g. 0.95)

    # Constraints
    for h in hours:
        # Constraint 1: Solar conservation (Solar_effective = Solar_used + Solar_curtailed)
        solver.Add(solar_used[h] + solar_curtailed[h] == solar_effective[h])

        # Constraint 2: Power Demand Balance
        # Solar Used + Battery Discharge + Grid Import = Demand + Battery Charge + Grid Export
        solver.Add(
            solar_used[h] + discharge[h] + grid_import[h] ==
            scenario.load_profile[h] + charge[h] + grid_export[h]
        )

        # Constraint 3: Battery Energy Dynamics
        if h == 0:
            solver.Add(
                soc[0] == scenario.initial_soc_kwh + (charge[0] * eta) - (discharge[0] / eta)
            )
        else:
            solver.Add(
                soc[h] == soc[h - 1] + (charge[h] * eta) - (discharge[h] / eta)
            )

    # Constraint 4: STRICT END-OF-DAY BATTERY BALANCE
    # Final battery energy (at hour 23) must exactly equal initial battery energy!
    solver.Add(soc[T - 1] == scenario.initial_soc_kwh)

    # Objective Function: Minimize Total Electricity Purchase in BDT + Degradation
    objective = solver.Objective()
    for h in hours:
        tariff = scenario.tariff_profile[h]
        fit = feed_in[h]
        deg_cost = scenario.degradation_cost_bdt_per_kwh

        objective.SetCoefficient(grid_import[h], tariff)
        objective.SetCoefficient(grid_export[h], -fit)
        objective.SetCoefficient(charge[h], deg_cost)
        objective.SetCoefficient(discharge[h], deg_cost)

    objective.SetMinimization()

    # Solve the Model
    status = solver.Solve()
    solved_successfully = (status == pywraplp.Solver.OPTIMAL or status == pywraplp.Solver.FEASIBLE)

    if not solved_successfully:
        return SolveResult(
            success=False,
            solver_status="INVALID",
            scenario_name=scenario.name,
            currency="BDT (৳)",
            total_cost_bdt=0.0,
            baseline_cost_bdt=0.0,
            savings_amount_bdt=0.0,
            savings_pct=0.0,
            total_solar_generated_kwh=sum(solar_effective),
            total_solar_used_kwh=0.0,
            total_solar_curtailed_kwh=0.0,
            solar_utilization_pct=0.0,
            total_grid_imported_kwh=0.0,
            total_grid_exported_kwh=0.0,
            total_battery_charged_kwh=0.0,
            total_battery_discharged_kwh=0.0,
            peak_grid_demand_kw=0.0,
            initial_battery_kwh=scenario.initial_soc_kwh,
            final_battery_kwh=0.0,
            battery_energy_balanced=False,
            directives_applied=processed_directives,
            hourly_schedule=[],
            validation_passed=False,
            validation_errors=["Linear solver could not find a feasible solution with the given constraint set."],
            explanation="INVALID: Linear programming constraints are infeasible or conflicting."
        )

    # Build Solution Details
    schedule: List[HourlyScheduleItem] = []
    total_cost_bdt = 0.0
    baseline_cost_bdt = 0.0
    total_solar_gen = sum(solar_effective)
    total_solar_used = 0.0
    total_solar_curt = 0.0
    total_grid_in = 0.0
    total_grid_out = 0.0
    total_bat_chg = 0.0
    total_bat_dis = 0.0
    peak_grid = 0.0
    validation_errors: List[str] = []

    for h in hours:
        g_in = round(grid_import[h].solution_value(), 3)
        g_out = round(grid_export[h].solution_value(), 3)
        b_chg = round(charge[h].solution_value(), 3)
        b_dis = round(discharge[h].solution_value(), 3)
        s_used = round(solar_used[h].solution_value(), 3)
        s_curt = round(solar_curtailed[h].solution_value(), 3)
        b_soc = round(soc[h].solution_value(), 3)
        b_soc_pct = round((b_soc / scenario.battery_capacity_kwh) * 100.0, 1)

        t_price = scenario.tariff_profile[h]
        fit_price = feed_in[h]
        h_cost = round((g_in * t_price) - (g_out * fit_price), 4)

        # Baseline Calculation (unmanaged solar directly to load, rest from grid at tariff)
        base_solar_direct = min(scenario.load_profile[h], solar_effective[h])
        base_net_load = scenario.load_profile[h] - base_solar_direct
        base_surplus = solar_effective[h] - base_solar_direct
        base_cost = (base_net_load * t_price) - (base_surplus * fit_price)
        baseline_cost_bdt += base_cost

        # Hourly Power Balance Check: Solar Used + Battery Discharge + Grid Import == Demand + Battery Charge + Grid Export
        power_lhs = round(s_used + b_dis + g_in, 2)
        power_rhs = round(scenario.load_profile[h] + b_chg + g_out, 2)
        is_hour_valid = abs(power_lhs - power_rhs) <= 0.05
        val_note = "VALID" if is_hour_valid else f"ERROR: Balance mismatch ({power_lhs} != {power_rhs})"

        if not is_hour_valid:
            validation_errors.append(f"Hour {h:02d}:00 power balance failed ({power_lhs} != {power_rhs})")

        # Reserve limit check
        if b_soc < round(min_soc_limits[h] - 0.01, 2):
            validation_errors.append(f"Hour {h:02d}:00 battery SOC ({b_soc} kWh) fell below minimum reserve ({min_soc_limits[h]} kWh)")

        total_cost_bdt += h_cost
        total_solar_used += s_used
        total_solar_curt += s_curt
        total_grid_in += g_in
        total_grid_out += g_out
        total_bat_chg += b_chg
        total_bat_dis += b_dis
        peak_grid = max(peak_grid, g_in)

        time_str = f"{h:02d}:00"
        schedule.append(HourlyScheduleItem(
            hour=h,
            time_label=time_str,
            load_kwh=round(scenario.load_profile[h], 2),
            solar_available_kwh=round(scenario.solar_profile[h], 2),
            solar_effective_kwh=round(solar_effective[h], 2),
            solar_used_kwh=s_used,
            solar_curtailed_kwh=s_curt,
            battery_charge_kwh=b_chg,
            battery_discharge_kwh=b_dis,
            battery_soc_kwh=b_soc,
            battery_soc_pct=b_soc_pct,
            grid_import_kwh=g_in,
            grid_export_kwh=g_out,
            tariff_bdt_per_kwh=t_price,
            feed_in_tariff_bdt_per_kwh=fit_price,
            hourly_cost_bdt=h_cost,
            is_valid=is_hour_valid,
            validation_note=val_note,
            active_directives=active_directive_labels[h]
        ))

    # Check Final Battery Energy == Initial Battery Energy
    final_soc_val = round(soc[T - 1].solution_value(), 2)
    battery_balanced = abs(final_soc_val - scenario.initial_soc_kwh) <= 0.05

    if not battery_balanced:
        validation_errors.append(
            f"End-of-day battery energy mismatch: Initial was {scenario.initial_soc_kwh} kWh, but final ended at {final_soc_val} kWh."
        )

    all_valid = (len(validation_errors) == 0)
    final_status = "OPTIMAL" if all_valid else "INVALID"

    total_cost_bdt = round(total_cost_bdt, 2)
    baseline_cost_bdt = round(baseline_cost_bdt, 2)
    savings_amount_bdt = round(max(0.0, baseline_cost_bdt - total_cost_bdt), 2)
    savings_pct = round((savings_amount_bdt / baseline_cost_bdt * 100.0), 1) if baseline_cost_bdt > 0 else 0.0
    solar_util_pct = round((total_solar_used / total_solar_gen * 100.0), 1) if total_solar_gen > 0 else 100.0

    return SolveResult(
        success=all_valid,
        solver_status=final_status,
        scenario_name=scenario.name,
        currency="BDT (৳)",
        total_cost_bdt=total_cost_bdt,
        baseline_cost_bdt=baseline_cost_bdt,
        savings_amount_bdt=savings_amount_bdt,
        savings_pct=savings_pct,
        total_solar_generated_kwh=round(total_solar_gen, 2),
        total_solar_used_kwh=round(total_solar_used, 2),
        total_solar_curtailed_kwh=round(total_solar_curt, 2),
        solar_utilization_pct=solar_util_pct,
        total_grid_imported_kwh=round(total_grid_in, 2),
        total_grid_exported_kwh=round(total_grid_out, 2),
        total_battery_charged_kwh=round(total_bat_chg, 2),
        total_battery_discharged_kwh=round(total_bat_dis, 2),
        peak_grid_demand_kw=round(peak_grid, 2),
        initial_battery_kwh=scenario.initial_soc_kwh,
        final_battery_kwh=final_soc_val,
        battery_energy_balanced=battery_balanced,
        directives_applied=processed_directives,
        hourly_schedule=schedule,
        validation_passed=all_valid,
        validation_errors=validation_errors,
        explanation=f"OR-Tools GLOP optimal dispatch verified. Reduced 24h electricity bill from ৳{baseline_cost_bdt:.2f} to ৳{total_cost_bdt:.2f} (Saved ৳{savings_amount_bdt:.2f}, {savings_pct:.1f}%). End-of-day battery energy strictly conserved at {scenario.initial_soc_kwh} kWh."
    )