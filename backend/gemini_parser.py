"""
Gemini Flash Natural Language Directive Parser for GridWise AI
Converts operator instructions into strict structured directives JSON.
IMPORTANT RULE: Gemini only extracts directives; it NEVER computes energy schedules.
"""
import os
import re
import json
from typing import List, Optional, Tuple
from models import Directive, DirectivesContainer

SYSTEM_PROMPT = """You are the AI Operator Assistant for GridWise AI, an industrial energy optimization platform.
Your ONLY responsibility is to read the operator notes or natural language instructions and convert them into structured JSON directives.
DO NOT calculate schedules or energy totals. Only output the structured directives JSON.

Allowed Directive Types:
1. `solar_reduction`: Solar generation drops or is curtailed (requires `hours`: list of ints 0-23, `factor`: float 0.0-1.0, e.g., 20% remaining is factor=0.2).
2. `minimum_battery_reserve`: Battery must stay at or above a minimum State of Charge (requires `hours`: list of ints 0-23, `min_soc_pct`: float 0.0-1.0, e.g., 40% reserve is min_soc_pct=0.4).
3. `no_charge_window`: Forbid charging the battery during specific hours (requires `hours`: list of ints 0-23).
4. `no_discharge_window`: Forbid discharging the battery during specific hours (requires `hours`: list of ints 0-23).
5. `max_grid_window`: Limit grid import to a maximum kW limit (requires `hours`: list of ints 0-23, `max_grid_kw`: float).
6. `no_op`: No actionable directive or instruction is purely informative.

Time Conversion Guide:
- 1 AM to 12 PM = 1 to 12
- 1 PM to 11 PM = 13 to 23
- 12 AM (Midnight) = 0
- "between 1 PM and 3 PM" or "1 PM to 3 PM" = [13, 14, 15] or [13, 14]
- "after 6 PM" = [18, 19, 20, 21, 22, 23]
- "morning" = [6, 7, 8, 9, 10, 11]
- "evening" = [17, 18, 19, 20, 21]

You MUST return ONLY a JSON object in this exact schema:
{
  "directives": [
    {
      "directive_type": "solar_reduction",
      "hours": [13, 14, 15],
      "factor": 0.2,
      "notes": "Solar drop to 20% due to cloud cover"
    }
  ],
  "operator_summary": "Parsed 1 directive: 80% solar reduction between 1 PM and 3 PM."
}
"""


def _parse_time_range(text: str) -> List[int]:
    """Helper heuristic to parse time ranges like '1 PM and 3 PM', '13:00 to 15:00', 'from 6pm to 10pm'."""
    text_lower = text.lower()
    
    # Check 12-hour am/pm format e.g., "1 pm to 3 pm", "1pm and 3pm", "1:00 pm to 3:00 pm"
    pattern_ampm = r'(\d{1,2})(?::\d{2})?\s*(am|pm)?\s*(?:to|and|-|until)\s*(\d{1,2})(?::\d{2})?\s*(am|pm)'
    match = re.search(pattern_ampm, text_lower)
    if match:
        h1, m1, h2, m2 = match.groups()
        val1 = int(h1)
        val2 = int(h2)
        if m1 is None:
            m1 = m2  # inherit pm if omitted in first number e.g. "between 1 and 3 pm"
        
        if m1 == 'pm' and val1 < 12: val1 += 12
        elif m1 == 'am' and val1 == 12: val1 = 0
        if m2 == 'pm' and val2 < 12: val2 += 12
        elif m2 == 'am' and val2 == 12: val2 = 0
        
        start = min(val1, val2)
        end = max(val1, val2)
        return list(range(start, min(24, end + 1)))

    # Check 24-hour format e.g., "13 to 15", "13:00 to 17:00"
    pattern_24h = r'(\d{1,2})(?::00)?\s*(?:to|and|-|until)\s*(\d{1,2})(?::00)?'
    match_24 = re.search(pattern_24h, text_lower)
    if match_24:
        val1 = int(match_24.group(1))
        val2 = int(match_24.group(2))
        if 0 <= val1 <= 23 and 0 <= val2 <= 23:
            start = min(val1, val2)
            end = max(val1, val2)
            return list(range(start, min(24, end + 1)))

    # Keywords
    if "evening" in text_lower or "peak hours" in text_lower:
        return [17, 18, 19, 20, 21]
    if "morning" in text_lower:
        return [7, 8, 9, 10, 11]
    if "afternoon" in text_lower:
        return [12, 13, 14, 15, 16]
    if "night" in text_lower or "overnight" in text_lower:
        return [22, 23, 0, 1, 2, 3, 4, 5]

    return [12, 13, 14]  # default fallback window


def fallback_rule_based_parser(prompt: str) -> DirectivesContainer:
    """
    Deterministic rule-based parser that runs reliably without an external API key.
    Enforces the exact same directive schema.
    """
    directives: List[Directive] = []
    p_lower = prompt.lower().strip()
    
    if not p_lower or p_lower in ["none", "default", "run", "optimize", "solve"]:
        return DirectivesContainer(directives=[], operator_summary="Standard scenario baseline with no additional operator constraints.")

    # Split by sentences or conjunctions
    clauses = re.split(r'[;\n]|\band\s+(?=[a-z])', p_lower)

    for clause in clauses:
        clause = clause.strip()
        if not clause:
            continue
            
        hours = _parse_time_range(clause)

        # 1. Solar reduction: "solar drop to 20%", "solar down by 50%", "curtail solar"
        if "solar" in clause or "pv" in clause or "cloud" in clause:
            factor = 0.5
            pct_match = re.search(r'(\d{1,3})\s*%', clause)
            if pct_match:
                pct_val = float(pct_match.group(1))
                if "drop to" in clause or "reduced to" in clause or "at" in clause:
                    factor = pct_val / 100.0
                elif "drop by" in clause or "decrease by" in clause or "cut by" in clause:
                    factor = max(0.0, 1.0 - (pct_val / 100.0))
                else:
                    factor = pct_val / 100.0
            elif "cut in half" in clause or "half" in clause:
                factor = 0.5
            elif "zero" in clause or "shut down" in clause or "outage" in clause:
                factor = 0.0

            factor = max(0.0, min(1.0, factor))
            directives.append(Directive(
                directive_type="solar_reduction",
                hours=hours,
                factor=factor,
                notes=f"Solar output adjusted to {int(factor * 100)}% for hours {hours}"
            ))

        # 2. Minimum battery reserve: "keep battery at 40%", "minimum 50% reserve"
        elif "reserve" in clause or "battery at least" in clause or "min soc" in clause or "keep battery" in clause or ("battery" in clause and "%" in clause and "charge" not in clause):
            min_soc = 0.3
            pct_match = re.search(r'(\d{1,3})\s*%', clause)
            if pct_match:
                min_soc = float(pct_match.group(1)) / 100.0
            min_soc = max(0.0, min(1.0, min_soc))
            directives.append(Directive(
                directive_type="minimum_battery_reserve",
                hours=hours,
                min_soc_pct=min_soc,
                notes=f"Keep battery reserve >= {int(min_soc * 100)}% for hours {hours}"
            ))

        # 3. No charge window: "no charge", "do not charge", "disable charging"
        elif "no charge" in clause or "don't charge" in clause or "do not charge" in clause or "stop charging" in clause:
            directives.append(Directive(
                directive_type="no_charge_window",
                hours=hours,
                notes=f"Battery charging blocked for hours {hours}"
            ))

        # 4. No discharge window: "no discharge", "don't discharge", "do not discharge", "stop discharging"
        elif "no discharge" in clause or "don't discharge" in clause or "do not discharge" in clause or "save battery" in clause:
            directives.append(Directive(
                directive_type="no_discharge_window",
                hours=hours,
                notes=f"Battery discharging blocked for hours {hours}"
            ))

        # 5. Max grid window: "limit grid to 5 kw", "max grid 3kw"
        elif "grid" in clause and ("limit" in clause or "max" in clause or "cap" in clause):
            kw_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:kw|kwh)?', clause)
            max_kw = float(kw_match.group(1)) if kw_match else 5.0
            directives.append(Directive(
                directive_type="max_grid_window",
                hours=hours,
                max_grid_kw=max_kw,
                notes=f"Grid import capped at {max_kw} kW for hours {hours}"
            ))

    if not directives:
        directives.append(Directive(
            directive_type="no_op",
            hours=[],
            notes="No specific operational constraints found in text."
        ))

    summary = f"Identified {len([d for d in directives if d.directive_type != 'no_op'])} operational directive(s) from operator prompt."
    return DirectivesContainer(directives=directives, operator_summary=summary)


def parse_operator_instructions(prompt: str) -> DirectivesContainer:
    """
    Parses natural language operator prompt using Gemini Flash if GEMINI_API_KEY is available,
    otherwise uses the robust deterministic fallback parser.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return fallback_rule_based_parser(prompt)

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        response = model.generate_content(
            f"{SYSTEM_PROMPT}\n\nOperator Instructions:\n\"{prompt}\"\n\nJSON Output:",
            generation_config={"response_mime_type": "application/json"}
        )
        
        raw_text = response.text.strip()
        data = json.loads(raw_text)
        return DirectivesContainer(**data)
    except Exception as e:
        print(f"Gemini API parse failed or returned unexpected format ({e}). Using robust fallback parser.")
        return fallback_rule_based_parser(prompt)
