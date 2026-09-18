# GridWise AI – Energy Optimization Platform
### BUP CSE Fest Hackathon 2026

![Platform Status](https://img.shields.io/badge/Solver-Google%20OR--Tools%20GLOP-brightgreen)
![Backend](https://img.shields.io/badge/Backend-FastAPI%20Clean%20Architecture-blue)
![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite%20%2B%20Tailwind%20CSS-61dafb)
![Currency](https://img.shields.io/badge/Currency-BDT%20(%E0%A7%B3)-orange)
![License](https://img.shields.io/badge/License-MIT-purple)

---

## ⚡ Executive Summary

**GridWise AI** is a microgrid energy management and dispatch optimization system designed for commercial buildings, university campuses, and distributed energy microgrids. Powered by **Google OR-Tools Linear Programming (GLOP)**, it computes optimal hourly dispatch schedules across solar photovoltaic generation, battery storage, and dynamic grid tariffs in **Bangladeshi Taka (BDT)**.

GridWise AI enables operators to input real-time natural language operational directives (e.g. *cloud cover reductions, battery reserve overrides, and grid import caps*) which are interpreted via **Google Gemini Flash** and mapped to strict mathematical constraints.

---

## 🏛️ Architecture & Clean Design

The platform follows **Clean Architecture** principles separating domain mathematical invariants from external delivery mechanisms:

```
├── backend/
│   ├── main.py              # Presentation Layer: FastAPI Routes & REST Endpoints
│   ├── models.py            # Domain Layer: Pydantic Schemas & Invariant Contracts
│   ├── optimizer.py         # Application/Domain: Google OR-Tools Mathematical Solver
│   ├── gemini_parser.py     # Infrastructure: Gemini LLM & Deterministic Rule Engine
│   ├── database.py          # Infrastructure: Supabase / PostgreSQL Persistence
│   ├── sample_data.py       # Domain: 24h Telemetry Benchmark Scenarios
│   └── test_solver.py       # Verification & Mathematical Test Suite
├── frontend/
│   ├── src/
│   │   ├── components/      # Modular UI: OperatorConsole, Analytics, ScheduleTable
│   │   ├── lib/api.js       # Typed API Client & Fallbacks
│   │   ├── App.jsx          # Main Enterprise Layout & State Orchestration
│   │   └── index.css        # Minimalist SaaS Design System
│   ├── nginx.conf           # Production Reverse Proxy
│   └── Dockerfile           # Multi-stage Web Container
├── supabase/
│   └── schema.sql           # Complete Database Schema & RLS Policies
├── n8n/
│   └── gridwise_n8n_workflow.json # Microgrid Ingestion & Alert Workflow
├── docker-compose.yml       # Production Multi-Service Compose
└── README.md
```

---

## 🧮 Mathematical Optimization Formulation

The core dispatch optimization is modeled as a **Linear Program (LP)** solved with **Google OR-Tools GLOP**:

### 1. Objective Function
$$\min \sum_{t=0}^{23} \left( P_{\text{grid, import}}(t) \cdot \text{Tariff}_{\text{BDT}}(t) - P_{\text{grid, export}}(t) \cdot \text{FIT}_{\text{BDT}}(t) - \epsilon \cdot P_{\text{solar, used}}(t) \right)$$

### 2. Physical Power Balance Constraint (Every Hour $t \in [0, 23]$)
$$P_{\text{grid, import}}(t) + P_{\text{solar, used}}(t) + P_{\text{bat, disch}}(t) = P_{\text{demand}}(t) + P_{\text{bat, chg}}(t) + P_{\text{grid, export}}(t)$$

### 3. Solar Utilization Upper Bound
$$0 \le P_{\text{solar, used}}(t) \le \alpha_{\text{solar}}(t) \cdot P_{\text{solar, avail}}(t)$$

### 4. Battery Storage State Dynamics
$$E_{\text{bat}}(t) = E_{\text{bat}}(t-1) + \left(P_{\text{bat, chg}}(t) \cdot \eta_{\text{chg}}\right) - \left(\frac{P_{\text{bat, disch}}(t)}{\eta_{\text{disch}}}\right)$$
$$\text{Reserve}_{\text{min}}(t) \le E_{\text{bat}}(t) \le \text{Capacity}_{\text{bat}}$$

### 5. Strict End-of-Day Battery Conservation (Neutrality)
$$E_{\text{bat}}(23) = E_{\text{bat, initial}}$$
*Guarantees zero net depletion across multiple operational days.*

---

## 🎯 Supported Natural Language Directives

| Directive Type | Mathematical Adjustment | Example Operator Note |
|---|---|---|
| `solar_reduction` | $P_{\text{solar, eff}}(t) = \text{factor} \cdot P_{\text{solar}}(t)$ for $t \in [h_{\text{start}}, h_{\text{end}})$ | *"Dust storm from 12:00 to 15:00 reducing solar by 60%"* |
| `minimum_battery_reserve` | $E_{\text{bat}}(t) \ge \max(\text{BaseReserve}, \text{NewFloor})$ | *"Maintain 40% battery reserve from 18:00 to 22:00 for peak"* |
| `no_charge_window` | $P_{\text{bat, chg}}(t) = 0$ for $t \in [h_{\text{start}}, h_{\text{end}})$ | *"Do not charge battery from 17:00 to 22:00"* |
| `no_discharge_window` | $P_{\text{bat, disch}}(t) = 0$ for $t \in [h_{\text{start}}, h_{\text{end}})$ | *"Hold battery charge from 00:00 to 06:00"* |
| `max_grid_window` | $P_{\text{grid, import}}(t) \le P_{\text{max}}$ for $t \in [h_{\text{start}}, h_{\text{end}})$ | *"Cap grid demand at 20 kW from 17:00 to 21:00"* |
| `no_op` | No constraint modified | *"Informational: Generator inspection completed"* |

*Note: All hour intervals are start-inclusive and end-exclusive (e.g. `12 to 15` $\rightarrow$ `[12, 13, 14]`)*.

---

## 🚀 Canonical API Specifications

### 1. Health Check
```http
GET /health
```
**Response:**
```json
{
  "status": "ok"
}
```

### 2. Canonical Competition Dispatch Optimization
```http
POST /optimize-energy
```
**Sample Request:**
```json
{
  "scenario_id": "bup_fest_case_01",
  "operator_notes": [
    "Overcast clouds expected from 12:00 to 15:00 reducing solar by 80%",
    "Keep minimum 40% battery reserve from 18:00 to 22:00"
  ],
  "battery": {
    "capacity_kwh": 40.0,
    "initial_energy_kwh": 20.0,
    "min_reserve_percent": 20.0,
    "max_charge_kw": 10.0,
    "max_discharge_kw": 10.0,
    "charge_efficiency": 0.95,
    "discharge_efficiency": 0.95
  },
  "hours": [
    { "hour": 0, "demand_kwh": 12.0, "solar_kwh": 0.0, "tariff_bdt_per_kwh": 8.5 },
    { "hour": 1, "demand_kwh": 10.5, "solar_kwh": 0.0, "tariff_bdt_per_kwh": 8.5 },
    ... 24 entries ...
  ]
}
```

**Canonical Response:**
```json
{
  "scenario_id": "bup_fest_case_01",
  "directive_interpretation": [
    {
      "raw_note": "Overcast clouds expected from 12:00 to 15:00 reducing solar by 80%",
      "applies": true,
      "directive_type": "solar_reduction",
      "hours": [12, 13, 14],
      "factor": 0.2,
      "notes": "Solar output reduced to 20.0% of baseline during hours [12, 13, 14]."
    },
    {
      "raw_note": "Keep minimum 40% battery reserve from 18:00 to 22:00",
      "applies": true,
      "directive_type": "minimum_battery_reserve",
      "hours": [18, 19, 20, 21],
      "min_soc_pct": 0.4,
      "notes": "Dynamic minimum battery reserve floor elevated to 40.0% during hours [18, 19, 20, 21]."
    }
  ],
  "hourly_plan": [
    {
      "hour": 0,
      "solar_used_kwh": 0.0,
      "battery_charge_kwh": 0.0,
      "battery_discharge_kwh": 0.0,
      "battery_energy_after_kwh": 20.0,
      "battery_soc_percent": 50.0,
      "grid_kwh": 12.0,
      "tariff_bdt_per_kwh": 8.5,
      "hourly_cost_bdt": 102.0,
      "active_directives": []
    }
  ],
  "total_grid_kwh": 192.59,
  "total_cost_bdt": 3217.32,
  "peak_grid_kwh": 30.80,
  "plan_summary": "OR-Tools GLOP optimal dispatch completed. Total 24h Cost: BDT 3217.32. End-of-day battery neutrality strictly verified (20.0 kWh -> 20.0 kWh).",
  "solver_status": "OPTIMAL",
  "battery_end_of_day_neutral": true,
  "validation_passed": true
}
```

---

## 🛠️ Quickstart Guide

### Option 1: Docker Compose (Recommended)
```bash
# Clone the repository
git clone https://github.com/Annihilus06/BIG_OOF_NOTATIONS.git
cd BIG_OOF_NOTATIONS

# Launch backend and frontend containers
docker-compose up --build
```
- Frontend UI: `http://localhost:3000`
- Backend API Docs: `http://localhost:8000/docs`

### Option 2: Local Development Setup

#### Backend:
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

#### Frontend:
```bash
cd frontend
npm install
npm run dev
```

#### Run Automated Test Suite:
```bash
python backend/test_solver.py
```

---

## 👥 Team: BIG_OOF_NOTATIONS
- **Competition:** BUP CSE Fest Hackathon 2026
- **Project:** GridWise AI – Energy Optimization Platform
