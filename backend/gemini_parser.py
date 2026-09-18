"""
GridWise AI - Natural Language Directive Parser
Translates free-form operator notes into structured optimization constraints.
Uses rule-based deterministic parsing with optional Google Gemini Flash LLM fallback.
"""

import os
import re
import json
import logging
from typing import List, Optional
from models import DirectiveInterpretation, Directive, DirectivesContainer

logger = logging.getLogger("gridwise.parser")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")


def parse_hour_range(text: str) -> List[int]:
    """
    Parse textual hour ranges into start-inclusive, end-exclusive integer lists [start, ..., end-1].
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
            return list(range(start_h, end_h))
            
    from_match = re.search(r'from\s+(?:hour\s+)?(\d{1,2})\s+to\s+(?:hour\s+)?(\d{1,2})', text_lower)
    if from_match:
        start_h = int(from_match.group(1))
        end_h = int(from_match.group(2))
        if start_h < end_h:
            return list(range(start_h, end_h))
            
    single_match = re.findall(r'(?:hour|at)\s+(\d{1,2})', text_lower)
    if single_match:
        return [int(h) for h in single_match if 0 <= int(h) < 24]
        
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
    """Extract percentage or multiplier factor (e.g., '40%', '0.4', 'reduce by 60%')."""
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
        return float(float_match.group(1))
        
    return None


def interpret_single_note_rule_based(note: str) -> DirectiveInterpretation:
    """Deterministic rule-based parser adhering strictly to the competition specifications."""
    raw_note = note.strip()
    note_lower = raw_note.lower()
    
    if not note_lower or note_lower in ["none", "n/a", "no directives", "normal operation", "all systems normal"]:
        return DirectiveInterpretation(
            raw_note=raw_note,
            applies=False,
            directive_type="no_op",
            hours=[],
            notes="No active constraints specified in operator note."
        )

    hours = parse_hour_range(raw_note)

    # 1. SOLAR REDUCTION
    if any(k in note_lower for k in ["solar", "cloud", "pv", "dust", "shading", "overcast", "weather", "sun"]):
        if any(k in note_lower for k in ["reduc", "drop", "cut", "loss", "cloud", "shadow", "diminish", "down", "less", "lower", "cover", "cleaning", "maintenance"]):
            factor = parse_percentage_or_factor(raw_note)
            if factor is None:
                factor = 0.5
            target_hours = hours if hours else list(range(11, 16))
            return DirectiveInterpretation(
                raw_note=raw_note,
                applies=True,
                directive_type="solar_reduction",
                hours=target_hours,
                factor=factor,
                notes=f"Solar output reduced to {round(factor*100, 1)}% of baseline during hours {target_hours}."
            )

    # 2. NO CHARGE WINDOW
    if ("charge" in note_lower or "charging" in note_lower) and any(k in note_lower for k in ["no", "do not", "don't", "stop", "halt", "prevent", "block", "avoid", "disable", "prohibit"]):
        target_hours = hours if hours else list(range(17, 22))
        return DirectiveInterpretation(
            raw_note=raw_note,
            applies=True,
            directive_type="no_charge_window",
            hours=target_hours,
            notes=f"Battery charging strictly prohibited during hours {target_hours}."
        )

    # 3. NO DISCHARGE WINDOW
    if ("discharge" in note_lower or "discharging" in note_lower) and any(k in note_lower for k in ["no", "do not", "don't", "stop", "halt", "prevent", "block", "avoid", "disable", "prohibit"]):
        target_hours = hours if hours else list(range(0, 6))
        return DirectiveInterpretation(
            raw_note=raw_note,
            applies=True,
            directive_type="no_discharge_window",
            hours=target_hours,
            notes=f"Battery discharging strictly prohibited during hours {target_hours}."
        )

    # 4. MINIMUM BATTERY RESERVE
    if any(k in note_lower for k in ["reserve", "soc", "state of charge", "minimum energy", "hold battery", "keep battery", "emergency buffer"]):
        kwh_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:kwh|kw)', note_lower)
        pct_match = re.search(r'(\d+(?:\.\d+)?)\s*%', note_lower)
        
        min_soc = 0.30
        if pct_match:
            min_soc = float(pct_match.group(1)) / 100.0
        elif kwh_match:
            # Assume 40 kWh capacity default if not specified
            min_soc = float(kwh_match.group(1)) / 40.0
            
        min_soc = max(0.0, min(1.0, min_soc))
        target_hours = hours if hours else list(range(0, 24))
        return DirectiveInterpretation(
            raw_note=raw_note,
            applies=True,
            directive_type="minimum_battery_reserve",
            hours=target_hours,
            min_soc_pct=min_soc,
            notes=f"Dynamic minimum battery reserve floor elevated to {round(min_soc*100, 1)}% during hours {target_hours}."
        )

    # 5. MAX GRID WINDOW
    if any(k in note_lower for k in ["grid", "import", "peak cap", "demand limit", "max power", "transformer"]):
        if any(k in note_lower for k in ["max", "limit", "cap", "not exceed", "keep below", "restrict"]):
            cap_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:kwh|kw|units?)?', note_lower)
            max_grid = float(cap_match.group(1)) if cap_match else 20.0
            target_hours = hours if hours else list(range(17, 22))
            return DirectiveInterpretation(
                raw_note=raw_note,
                applies=True,
                directive_type="max_grid_window",
                hours=target_hours,
                max_grid_kw=max_grid,
                notes=f"Maximum grid import capped at {max_grid} kW during hours {target_hours}."
            )

    return DirectiveInterpretation(
        raw_note=raw_note,
        applies=False,
        directive_type="no_op",
        hours=[],
        notes="Operator note did not match any active dispatch constraints."
    )


def interpret_operator_notes_gemini_llm(operator_notes: List[str]) -> List[DirectiveInterpretation]:
    """Call Google Gemini Flash API for semantic reasoning over complex operator instructions."""
    if not GEMINI_API_KEY:
        return [interpret_single_note_rule_based(note) for note in operator_notes]

    try:
        from google import genai
        client = genai.Client(api_key=GEMINI_API_KEY)
        
        prompt = f"""
You are the AI Operator Assistant for GridWise AI Energy Optimization Platform.
Parse the following operator notes into a JSON array matching this schema:
[
  {{
    "raw_note": "string",
    "applies": boolean,
    "directive_type": "solar_reduction" | "minimum_battery_reserve" | "no_charge_window" | "no_discharge_window" | "max_grid_window" | "no_op",
    "hours": [list of integers between 0 and 23, start-inclusive end-exclusive],
    "factor": float or null (for solar_reduction, 0.0 to 1.0 remaining fraction),
    "min_soc_pct": float or null (for minimum_battery_reserve, 0.0 to 1.0 fraction),
    "max_grid_kw": float or null (for max_grid_window, max grid import kW),
    "notes": "string explanation"
  }}
]

Important rules:
1. Return strictly valid JSON array without markdown backticks.
2. The returned array MUST contain exactly one element per input note, in the exact same order.
3. If an instruction says "reduce solar by 40% from 12 to 15", factor is 0.6 and hours is [12, 13, 14].
4. If an instruction is purely informational or no active constraint, set applies: false, directive_type: "no_op".

Operator Notes:
{json.dumps(operator_notes, indent=2)}
"""
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        text = response.text.strip()
        if text.startswith("```"):
            text = re.sub(r'^```(?:json)?\n', '', text)
            text = re.sub(r'\n```$', '', text)
            
        parsed_json = json.loads(text)
        results = []
        for i, item in enumerate(parsed_json):
            results.append(DirectiveInterpretation(
                raw_note=item.get("raw_note", operator_notes[i] if i < len(operator_notes) else ""),
                applies=item.get("applies", False),
                directive_type=item.get("directive_type", "no_op"),
                hours=item.get("hours", []),
                factor=item.get("factor"),
                min_soc_pct=item.get("min_soc_pct"),
                max_grid_kw=item.get("max_grid_kw"),
                notes=item.get("notes", "Parsed via Gemini Flash AI.")
            ))
        return results
    except Exception as e:
        logger.warning(f"Gemini LLM interpretation failed, falling back to rule-based engine: {e}")
        return [interpret_single_note_rule_based(note) for note in operator_notes]


def interpret_operator_notes(operator_notes: List[str]) -> List[DirectiveInterpretation]:
    """Canonical competition operator note interpreter."""
    if not operator_notes:
        return []
        
    if GEMINI_API_KEY:
        return interpret_operator_notes_gemini_llm(operator_notes)
    else:
        return [interpret_single_note_rule_based(note) for note in operator_notes]


def parse_operator_instructions(prompt: str) -> DirectivesContainer:
    """Internal UI compatibility helper converting free-form text prompt to DirectivesContainer."""
    lines = [line.strip() for line in prompt.split("\n") if line.strip()]
    if not lines:
        lines = [prompt]
        
    interpretations = interpret_operator_notes(lines)
    directives = []
    
    for interp in interpretations:
        if not interp.applies or interp.directive_type == "no_op":
            continue
            
        d_type = interp.directive_type
        hours = interp.hours
        val = 0.0
        if d_type == "solar_reduction" and interp.factor is not None:
            val = interp.factor
        elif d_type == "minimum_battery_reserve" and interp.min_soc_pct is not None:
            val = interp.min_soc_pct
        elif d_type == "max_grid_window" and interp.max_grid_kw is not None:
            val = interp.max_grid_kw
            
        directives.append(Directive(
            id=f"dir-{len(directives)+1}",
            directive_type=d_type,
            hours=hours,
            value=val,
            factor=interp.factor,
            min_soc_pct=interp.min_soc_pct,
            max_grid_kw=interp.max_grid_kw,
            applied=True,
            notes=interp.notes or "",
            status_message="Active"
        ))
        
    summary = f"Identified {len(directives)} operational constraint(s) across {len(interpretations)} operator notes."
    return DirectivesContainer(directives=directives, operator_summary=summary)
