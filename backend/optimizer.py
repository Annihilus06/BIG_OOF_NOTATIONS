"""
Google OR-Tools Energy Dispatch Optimizer for GridWise AI Platform
Solves the optimal 24-hour battery and grid dispatch problem with operator directives.
"""
from typing import List, Dict, Any, Tuple
from ortools.linear_solver import pywraplp
from models import ScenarioData, Directive, SolveResult, HourlyScheduleItem


def solve_energy_dispatch(scenario: ScenarioData, directives: List[Directive]) -> SolveResult:
    """
    Formulates and solves a 24-hour Linear Program (LP) using Google OR-Tools (GLOP solver).
    """
    solver = pywraplp.Solver.CreateSolver("GLOP")
    if not solver:
        # Fallback to SCIP or CBC if GLOP is unavailable
        solver = pywraplp.Solver.CreateSolver("CBC") or pywraplp.Solver.CreateSolver("SCIP")
    
    if not solver:
        raise RuntimeError("No suitable OR-Tools linear solver found (GLOP/CBC/SCIP).")

    T = 24
    hours = list(range(T))

    # Pre-process Directives by Hour
    solar_factors = [1.0] * T
    min_soc_limits = [scenario.battery_capacity_kwh * scenario.min_soc_pct] * T
    max_grid_limits = [float('inf')] * T
    no_charge_hours = set()
    no_discharge_hours = set()
    active_directive_labels: Dict[int, List[str]] = {h: [] for h in hours}

    for d in directives:
        if d.directive_type == "solar_reduction":
            factor = d.factor if d.factor is not None else 1.0
            for h in d.hours:
                solar_factors[h] = min(solar_factors[h], factor)
                active_directive_labels[h].append(f"Solar reduced to {int(factor * 100)}%")
        elif d.directive_type == "minimum_battery_reserve":
            pct = d.min_soc_pct if d.min_soc_pct is not None else scenario.min_soc_pct
            for h in d.hours:
                req_kwh = scenario.battery_capacity_kwh * pct
                min_soc_limits[h] = max(min_soc_limits[h], req_kwh)
                active_directive_labels[h].append(f"Min SOC reserve {int(pct * 100)}%")
        elif d.directive_type == "no_charge_window":
            for h in d.hours:
                no_charge_hours.add(h)
                active_directive_labels[h].append("No Battery Charge")
        elif d.directive_type == "no_discharge_window":
            for h in d.hours:
                no_discharge_hours.add(h)
                active_directive_labels[h].append("No Battery Discharge")
        elif d.directive_type == "max_grid_window":
            mg = d.max_grid_kw if d.max_grid_kw is not None else float('inf')
            for h in d.hours:
                max_grid_limits[h] = min(max_grid_limits[h], mg)
                active_directive_labels[h].append(f"Max Grid Cap {mg} kW")
        elif d.directive_type == "no_op":
            pass

    # Effective Solar Generation
    solar_effective = [scenario.solar_profile[h] * solar_factors[h] for h in hours]
    feed_in = scenario.feed_in_tariff if scenario.feed_in_tariff else [0.05] * T

    # Decision Variables
    infinity = solver.infinity()
    grid_import = [solver.NumVar(0.0, max_grid_limits[h] if max_grid_limits[h] != float('inf') else infinity, f"grid_in_{h}") for h in hours]
    grid_export = [solver.NumVar(0.0, infinity, f"grid_out_{h}") for h in hours]
    
    # Battery Charge / Discharge Variables
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

    # Battery State of Charge (SOC)
    max_soc_cap = scenario.battery_capacity_kwh * scenario.max_soc_pct
    soc = [solver.NumVar(min_soc_limits[h], max_soc_cap, f"soc_{h}") for h in hours]

    eta = scenario.battery_efficiency  # charging and discharging efficiency

    # Constraints
    for h in hours:
        # 1. Solar balance: solar_effective = solar_used + solar_curtailed
        solver.Add(solar_used[h] + solar_curtailed[h] == solar_effective[h])

        # 2. Power balance at bus: Solar_used + Grid_import + Discharge = Load + Charge + Grid_export
        solver.Add(
            solar_used[h] + grid_import[h] + discharge[h] ==
            scenario.load_profile[h] + charge[h] + grid_export[h]
        )

        # 3. Battery SOC Dynamics
        if h == 0:
            solver.Add(
                soc[0] == scenario.initial_soc_kwh + (charge[0] * eta) - (discharge[0] / eta)
            )
        else:
            solver.Add(
                soc[h] == soc[h - 1] + (charge[h] * eta) - (discharge[h] / eta)
            )

    # 4. Final Target SOC Constraint (soft/hard condition to prevent battery emptying unfairly)
    if scenario.final_soc_target_kwh is not None:
        solver.Add(soc[T - 1] >= min(scenario.final_soc_target_kwh, max_soc_cap))

    # Objective Function: Minimize Electricity Cost + Battery Wear
    objective = solver.Objective()
    for h in hours:
        tariff = scenario.tariff_profile[h]
        fit = feed_in[h]
        deg_cost = scenario.degradation_cost_per_kwh

        objective.SetCoefficient(grid_import[h], tariff)
        objective.SetCoefficient(grid_export[h], -fit)
        objective.SetCoefficient(charge[h], deg_cost)
        objective.SetCoefficient(discharge[h], deg_cost)

    objective.SetMinimization()

    status = solver.Solve()
    success = (status == pywraplp.Solver.OPTIMAL or status == pywraplp.Solver.FEASIBLE)
    solver_status_str = "OPTIMAL" if status == pywraplp.Solver.OPTIMAL else ("FEASIBLE" if status == pywraplp.Solver.FEASIBLE else "INFEASIBLE")

    if not success:
        # Return fallback infeasible response
        return SolveResult(
            success=False,
            solver_status=solver_status_str,
            scenario_name=scenario.name,
            total_cost=0.0,
            baseline_cost=0.0,
            savings_amount=0.0,
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
            directives_applied=directives,
            hourly_schedule=[],
            explanation="Solver could not find a feasible solution with the given constraint set."
        )

    # Build Solution Details
    schedule: List[HourlyScheduleItem] = []
    total_cost = 0.0
    baseline_cost = 0.0
    total_solar_gen = sum(solar_effective)
    total_solar_used = 0.0
    total_solar_curt = 0.0
    total_grid_in = 0.0
    total_grid_out = 0.0
    total_bat_chg = 0.0
    total_bat_dis = 0.0
    peak_grid = 0.0

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

        # Baseline calculation (unmanaged: solar used directly, rest imported at tariff, excess exported at FIT)
        base_solar_direct = min(scenario.load_profile[h], solar_effective[h])
        base_net_load = scenario.load_profile[h] - base_solar_direct
        base_surplus = solar_effective[h] - base_solar_direct
        base_cost = (base_net_load * t_price) - (base_surplus * fit_price)
        baseline_cost += base_cost

        total_cost += h_cost
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
            tariff_per_kwh=t_price,
            feed_in_tariff_per_kwh=fit_price,
            hourly_cost=h_cost,
            active_directives=active_directive_labels[h]
        ))

    total_cost = round(total_cost, 2)
    baseline_cost = round(baseline_cost, 2)
    savings_amount = round(max(0.0, baseline_cost - total_cost), 2)
    savings_pct = round((savings_amount / baseline_cost * 100.0), 1) if baseline_cost > 0 else 0.0
    solar_util_pct = round((total_solar_used / total_solar_gen * 100.0), 1) if total_solar_gen > 0 else 100.0

    return SolveResult(
        success=True,
        solver_status=solver_status_str,
        scenario_name=scenario.name,
        total_cost=total_cost,
        baseline_cost=baseline_cost,
        savings_amount=savings_amount,
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
        directives_applied=directives,
        hourly_schedule=schedule,
        explanation=f"OR-Tools GLOP optimal dispatch found. Reduced 24-hour electricity bill from ${baseline_cost:.2f} (baseline) to ${total_cost:.2f}, generating ${savings_amount:.2f} ({savings_pct:.1f}%) in cost savings while enforcing all {len(directives)} directives."
    )
