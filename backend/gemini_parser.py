"""
GridWise AI - Natural Language Directive Parser & Guardrail Layer
Translates free-form operator notes into structured, mathematically validated optimization constraints.
Includes robust auto-normalization pipeline and safe fallback protection.
"""

import os
import re
import json
import logging
from typing import List, Dict, Any, Optional
from models import DirectiveInterpretation, Directive, DirectivesContainer, BatterySpec

logger = logging.getLogger("gridwise.parser")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")


def parse_hour_range(text: str) -> List[int]:
    """
    Parse textual hour ranges into sorted, deduplicated, start-inclusive, end-exclusive integer lists [start, ..., end-1].
    Strictly clamps hours within [0, 23].
    Example: '12 to 15' -> [12, 13, 14].
    """
    text_lower = text.lower()
    
    range_match = re.search(r'(\d{1,2})(?::00)?\s*(?:to|-|until|through|–|—)\s*(\d{1,2})(?::00)?', text_lower)
    if range_match:
        start_h = int(range_match.group(1))
        end_h = int(range_match.group(2))
        
        if 'pm' in text_lower and start_h < 12 and 'am' not in text_lower:
            if start_h <= 12 and end_h <= 12:
                start_h = (start_h % 12) + 12
                end_h = (end_h % 12) + 12
                
        if start_h < end_h and 0 <= start_h <= 24 and 0 <= end_h <= 24:
            return sorted(list(set(h for h in range(start_h, min(24, end_h)) if 0 <= h < 24)))
            
    from_match = re.search(r'from\s+(?:hour\s+)?(\d{1,2})\s+to\s+(?:hour\s+)?(\d{1,2})', text_lower)
    if from_match:
        start_h = int(from_match.group(1))
        end_h = int(from_match.group(2))
        if start_h < end_h:
            return sorted(list(set(h for h in range(start_h, min(24, end_h)) if 0 <= h < 24)))
            
    single_match = re.findall(r'(?:hour|at)\s+(\d{1,2})', text_lower)
    if single_match:
        return sorted(list(set(int(h) for h in single_match if 0 <= int(h) < 24)))
        
    if "peak" in text_lower and "evening" in text_lower:
        return list(range(17, 22))
    elif "afternoon" in text_lower:
        return list(range(12, 17))
    elif "morning" in text_lower:
        return list(range(6, 12))
    elif "night" in text_lower:
        return list(range(22, 24)) + list(range(0, 6))

    return []


def parse_percentage_or_factor(text: str) -> Optional[float]:
    """Extract percentage or multiplier factor (e.g., '40%', '0.4', 'reduce by 80%')."""
    text_lower = text.lower()
    
    red_match = re.search(r'reduc(?:e|ed|ing|tion)\s+(?:by\s+)?(\d+(?:\.\d+)?)\s*%', text_lower)
    if red_match:
        pct = float(red_match.group(1))
        return max(0.0, min(1.0, round(1.0 - (pct / 100.0), 4)))
        
    drop_match = re.search(r'(?:drop|down|cut|loss)\s+(?:by\s+)?(\d+(?:\.\d+)?)\s*%', text_lower)
    if drop_match:
        pct = float(drop_match.group(1))
        return max(0.0, min(1.0, round(1.0 - (pct / 100.0), 4)))
        
    to_match = re.search(r'(?:to|at|retain|keep|capacity of)\s+(\d+(?:\.\d+)?)\s*%', text_lower)
    if to_match:
        pct = float(to_match.group(1))
        return max(0.0, min(1.0, round(pct / 100.0, 4)))
        
    pct_match = re.search(r'(\d+(?:\.\d+)?)\s*%', text_lower)
    if pct_match:
        pct = float(pct_match.group(1))
        if "reduc" in text_lower or "cloud" in text_lower or "drop" in text_lower or "loss" in text_lower:
            return max(0.0, min(1.0, round(1.0 - (pct / 100.0), 4)))
        return max(0.0, min(1.0, round(pct / 100.0, 4)))
        
    float_match = re.search(r'factor\s*(?:of|=|:)?\s*(\d+(?:\.\d+)?)', text_lower)
    if float_match:
        val = float(float_match.group(1))
        return val / 100.0 if val > 1.0 else val
        
    return None


def normalize_directive(
    interp: DirectiveInterpretation,
    battery: Optional[BatterySpec] = None
) -> DirectiveInterpretation:
    """
    Robust Deterministic Guardrail Layer:
    Post-LLM validation and auto-normalization pipeline:
    1. Sort & deduplicate hours within [0, 23].
    2. Convert solar factor percentages (> 1.0) and clamp [0.0, 1.0].
    3. Strictly enforce no_op rules (applies=False, structured_adjustment=None).
    4. Calculate absolute kWh for relative reserves.
    5. Safe fallback for broken or invalid schemas.
    """
    capacity = battery.capacity_kwh if battery else 40.0

    raw_hours = interp.target_hours if interp.target_hours else (interp.hours or [])
    clean_hours = sorted(list(set(int(h) for h in raw_hours if 0 <= int(h) <= 23)))

    d_type = interp.directive_type

    if d_type == "no_op" or (d_type in ["no_charge_window", "no_discharge_window"] and not clean_hours):
        return DirectiveInterpretation(
            raw_instruction=interp.raw_instruction or interp.raw_note or "",
            raw_note=interp.raw_instruction or interp.raw_note or "",
            applies=False,
            directive_type="no_op",
            target_hours=[],
            hours=[],
            structured_adjustment=None,
            factor=None,
            min_soc_pct=None,
            min_reserve_kwh=None,
            max_grid_kwh=None,
            max_grid_kw=None,
            confidence_score=interp.confidence_score,
            clarification_notes="Informational note: No active operational constraint applies.",
            notes="Informational note: No active operational constraint applies."
        )

    norm_factor = interp.factor
    if norm_factor is not None:
        if norm_factor > 1.0:
            norm_factor = norm_factor / 100.0
        norm_factor = max(0.0, min(1.0, round(norm_factor, 4)))

    norm_min_soc = interp.min_soc_pct
    norm_reserve_kwh = interp.min_reserve_kwh

    if norm_min_soc is not None:
        if norm_min_soc > 1.0:
            norm_min_soc = norm_min_soc / 100.0
        norm_min_soc = max(0.0, min(1.0, round(norm_min_soc, 4)))
        if norm_reserve_kwh is None:
            norm_reserve_kwh = round(norm_min_soc * capacity, 4)

    if norm_reserve_kwh is not None:
        norm_reserve_kwh = max(0.0, min(capacity, round(norm_reserve_kwh, 4)))
        if norm_min_soc is None:
            norm_min_soc = round(norm_reserve_kwh / capacity, 4)

    norm_max_grid = interp.max_grid_kwh if interp.max_grid_kwh is not None else interp.max_grid_kw
    if norm_max_grid is not None:
        norm_max_grid = max(0.0, round(norm_max_grid, 4))

    adj = {"type": d_type, "hours": clean_hours}
    if d_type == "solar_reduction":
        adj["factor"] = norm_factor if norm_factor is not None else 0.5
    elif d_type == "minimum_battery_reserve":
        adj["min_reserve_kwh"] = norm_reserve_kwh if norm_reserve_kwh is not None else (capacity * 0.4)
        adj["min_soc_pct"] = norm_min_soc if norm_min_soc is not None else 0.4
    elif d_type == "max_grid_window":
        adj["max_grid_kwh"] = norm_max_grid if norm_max_grid is not None else 20.0

    raw_text = interp.raw_instruction or interp.raw_note or ""
    explanation = interp.clarification_notes or interp.notes or f"Directive {d_type} applied on hours {clean_hours}."

    return DirectiveInterpretation(
        raw_instruction=raw_text,
        raw_note=raw_text,
        applies=True,
        directive_type=d_type,
        target_hours=clean_hours,
        hours=clean_hours,
        structured_adjustment=adj,
        factor=norm_factor,
        min_soc_pct=norm_min_soc,
        min_reserve_kwh=norm_reserve_kwh,
        max_grid_kwh=norm_max_grid,
        max_grid_kw=norm_max_grid,
        confidence_score=interp.confidence_score,
        clarification_notes=explanation,
        notes=explanation
    )


def interpret_single_note_rule_based(note: str, battery: Optional[BatterySpec] = None) -> DirectiveInterpretation:
    """Deterministic rule-based parser adhering strictly to the competition specifications."""
    raw_note = note.strip()
    note_lower = raw_note.lower()
    
    if not note_lower or note_lower in ["none", "n/a", "no directives", "normal operation", "all systems normal", "standard dispatch"]:
        return DirectiveInterpretation(
            raw_instruction=raw_note,
            raw_note=raw_note,
            applies=False,
            directive_type="no_op",
            target_hours=[],
            hours=[],
            structured_adjustment=None,
            confidence_score=1.0,
            clarification_notes="No active constraints specified in operator note."
        )

    hours = parse_hour_range(raw_note)

    # 1. SOLAR REDUCTION
    if any(k in note_lower for k in ["solar", "cloud", "pv", "dust", "shading", "overcast", "weather", "sun"]):
        if any(k in note_lower for k in ["reduc", "drop", "cut", "loss", "cloud", "shadow", "diminish", "down", "less", "lower", "cover", "cleaning", "maintenance"]):
            factor = parse_percentage_or_factor(raw_note)
            if factor is None:
                factor = 0.5
            target_hours = hours if hours else list(range(11, 16))
            interp = DirectiveInterpretation(
                raw_instruction=raw_note,
                raw_note=raw_note,
                applies=True,
                directive_type="solar_reduction",
                target_hours=target_hours,
                hours=target_hours,
                factor=factor,
                confidence_score=0.95,
                clarification_notes=f"Solar generation reduced to {round(factor*100, 1)}% of baseline during hours {target_hours}."
            )
            return normalize_directive(interp, battery)

    # 2. NO CHARGE WINDOW
    if ("charge" in note_lower or "charging" in note_lower) and any(k in note_lower for k in ["no", "do not", "don't", "stop", "halt", "prevent", "block", "avoid", "disable", "prohibit"]):
        target_hours = hours if hours else list(range(17, 22))
        interp = DirectiveInterpretation(
            raw_instruction=raw_note,
            raw_note=raw_note,
            applies=True,
            directive_type="no_charge_window",
            target_hours=target_hours,
            hours=target_hours,
            confidence_score=0.95,
            clarification_notes=f"Battery charging prohibited during hours {target_hours}."
        )
        return normalize_directive(interp, battery)

    # 3. NO DISCHARGE WINDOW
    if ("discharge" in note_lower or "discharging" in note_lower) and any(k in note_lower for k in ["no", "do not", "don't", "stop", "halt", "prevent", "block", "avoid", "disable", "prohibit"]):
        target_hours = hours if hours else list(range(0, 6))
        interp = DirectiveInterpretation(
            raw_instruction=raw_note,
            raw_note=raw_note,
            applies=True,
            directive_type="no_discharge_window",
            target_hours=target_hours,
            hours=target_hours,
            confidence_score=0.95,
            clarification_notes=f"Battery discharging prohibited during hours {target_hours}."
        )
        return normalize_directive(interp, battery)

    # 4. MINIMUM BATTERY RESERVE
    if any(k in note_lower for k in ["reserve", "soc", "state of charge", "minimum energy", "hold battery", "keep battery", "emergency buffer"]):
        kwh_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:kwh|kw)', note_lower)
        pct_match = re.search(r'(\d+(?:\.\d+)?)\s*%', note_lower)
        
        capacity = battery.capacity_kwh if battery else 40.0
        min_soc = 0.40
        min_kwh = None

        if pct_match:
            min_soc = float(pct_match.group(1)) / 100.0
            min_kwh = min_soc * capacity
        elif kwh_match:
            min_kwh = float(kwh_match.group(1))
            min_soc = min_kwh / capacity
            
        target_hours = hours if hours else list(range(0, 24))
        interp = DirectiveInterpretation(
            raw_instruction=raw_note,
            raw_note=raw_note,
            applies=True,
            directive_type="minimum_battery_reserve",
            target_hours=target_hours,
            hours=target_hours,
            min_soc_pct=min_soc,
            min_reserve_kwh=min_kwh,
            confidence_score=0.92,
            clarification_notes=f"Minimum battery reserve floor set to {round(min_soc*100, 1)}% ({min_kwh:.1f} kWh) during hours {target_hours}."
        )
        return normalize_directive(interp, battery)

    # 5. MAX GRID WINDOW
    if any(k in note_lower for k in ["grid", "import", "peak cap", "demand limit", "max power", "transformer"]):
        if any(k in note_lower for k in ["max", "limit", "cap", "not exceed", "keep below", "restrict"]):
            cap_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:kwh|kw|units?)?', note_lower)
            max_grid = float(cap_match.group(1)) if cap_match else 20.0
            target_hours = hours if hours else list(range(17, 22))
            interp = DirectiveInterpretation(
                raw_instruction=raw_note,
                raw_note=raw_note,
                applies=True,
                directive_type="max_grid_window",
                target_hours=target_hours,
                hours=target_hours,
                max_grid_kwh=max_grid,
                max_grid_kw=max_grid,
                confidence_score=0.90,
                clarification_notes=f"Grid import capped at {max_grid} kW during hours {target_hours}."
            )
            return normalize_directive(interp, battery)

    return DirectiveInterpretation(
        raw_instruction=raw_note,
        raw_note=raw_note,
        applies=False,
        directive_type="no_op",
        target_hours=[],
        hours=[],
        structured_adjustment=None,
        confidence_score=0.85,
        clarification_notes="Operator note did not contain actionable constraints."
    )


def interpret_operator_notes(
    operator_notes: List[str],
    battery: Optional[BatterySpec] = None
) -> List[DirectiveInterpretation]:
    """
    Canonical competition operator note interpreter with deterministic guardrails.
    Evaluates each note, applies LLM/rule engine, and strictly normalizes before returning.
    """
    if not operator_notes:
        return []

    results = []
    for note in operator_notes:
        try:
            interp = interpret_single_note_rule_based(note, battery)
            normalized = normalize_directive(interp, battery)
            results.append(normalized)
        except Exception as e:
            logger.warning(f"Failed parsing note '{note}', falling back to no_op: {e}")
            results.append(DirectiveInterpretation(
                raw_instruction=note,
                raw_note=note,
                applies=False,
                directive_type="no_op",
                target_hours=[],
                hours=[],
                structured_adjustment=None,
                confidence_score=0.5,
                clarification_notes="Parsing fallback: safe no_op applied."
            ))
    return results


def parse_operator_instructions(prompt: str, battery: Optional[BatterySpec] = None) -> DirectivesContainer:
    """Internal UI compatibility helper converting free-form text prompt to DirectivesContainer."""
    lines = [line.strip() for line in prompt.split("\n") if line.strip()]
    if not lines:
        lines = [prompt]
        
    interpretations = interpret_operator_notes(lines, battery)
    directives = []
    
    for interp in interpretations:
        if not interp.applies or interp.directive_type == "no_op":
            continue
            
        d_type = interp.directive_type
        hours = interp.target_hours
        val = 0.0
        if d_type == "solar_reduction" and interp.factor is not None:
            val = interp.factor
        elif d_type == "minimum_battery_reserve" and interp.min_soc_pct is not None:
            val = interp.min_soc_pct
        elif d_type == "max_grid_window" and interp.max_grid_kwh is not None:
            val = interp.max_grid_kwh
            
        directives.append(Directive(
            id=f"dir-{len(directives)+1}",
            directive_type=d_type,
            hours=hours,
            value=val,
            factor=interp.factor,
            min_soc_pct=interp.min_soc_pct,
            max_grid_kw=interp.max_grid_kwh,
            applied=True,
            notes=interp.clarification_notes or "",
            status_message="Active"
        ))
        
    summary = f"Identified {len(directives)} operational constraint(s) across {len(interpretations)} operator notes."
    return DirectivesContainer(directives=directives, operator_summary=summary)
