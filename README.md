# ⚡ GridWise AI – Energy Optimization Platform

An enterprise-grade microgrid and industrial energy optimization web platform that accepts energy scenarios and operator instructions in natural language, parses them into structured mathematical directives using **Gemini Flash**, computes the global lowest-cost 24-hour energy dispatch schedule using **Google OR-Tools**, and displays interactive real-time analytics in a modern **React + Tailwind CSS** dashboard.

---

## 🚀 Core Architecture Flow

```text
User / Operator (Natural Language or JSON Scenario)
   │
   ▼
Frontend (React + Vite + Tailwind CSS + Recharts)
   │
   ▼ [Webhook / REST API]
n8n Workflow / FastAPI Backend
   │
   ▼ [Operator Prompt]
Gemini Flash LLM (Strict Structured Directives JSON)
   │
   ▼ [Validation: Hour Bounds 0-23, Factor 0-1, Min SOC]
Directive Validator Engine
   │
   ▼ [Directives + 24-Hour Scenario]
Google OR-Tools Linear Optimizer (GLOP Solver)
   │
   ├──► Lowest-cost 24h schedule & battery SOC
   ├──► Baseline vs. Optimized Cost Savings (%)
   │
   ▼
Supabase Database (PostgreSQL persistence)
   │
   ▼
Interactive Analytics Dashboard & Dispatch CSV Export
```

> ⚠️ **CRITICAL ARCHITECTURAL GUARANTEE:**  
> **Gemini Flash NEVER calculates energy schedules directly.** Gemini's sole responsibility is natural language intent understanding and structured directive extraction. **Google OR-Tools** performs all mathematical linear programming (LP) constraint solving, guaranteeing valid power balances and minimum electricity costs.

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Recharts, Lucide Icons, Glassmorphism UI
- **Optimization Engine:** Python 3.12, FastAPI, Google OR-Tools (`ortools.linear_solver.pywraplp`)
- **AI / LLM:** Google Gemini Flash (`google-generativeai`)
- **Workflow Orchestration:** n8n Workflow (`n8n/gridwise_ai_workflow.json`)
- **Database:** Supabase PostgreSQL (`supabase/schema.sql`)

---

## 🎯 Supported Directive Types

| Directive Type | Description | Schema / Parameters |
| :--- | :--- | :--- |
| `solar_reduction` | Curtails or reduces solar forecast (e.g. cloud cover) | `hours: int[]`, `factor: float (0.0-1.0)` |
| `minimum_battery_reserve` | Keeps battery SOC at or above safety threshold | `hours: int[]`, `min_soc_pct: float (0.0-1.0)` |
| `no_charge_window` | Forbids battery charging during specified hours | `hours: int[]` |
| `no_discharge_window` | Forbids battery discharge during specified hours | `hours: int[]` |
| `max_grid_window` | Enforces a peak grid power import ceiling (kW) | `hours: int[]`, `max_grid_kw: float` |
| `no_op` | Baseline optimal dispatch without extra constraints | `hours: []` |

---

## ⚡ Quick Start & Installation

### 1. Prerequisites
- Python 3.10+ (with `py` launcher or `python`)
- Node.js 18+ and npm

### 2. Backend Setup (FastAPI + Google OR-Tools)
```bash
# Navigate to backend
cd backend

# Install Python dependencies
py -m pip install -r requirements.txt

# (Optional) Configure .env file for Gemini & Supabase:
# GEMINI_API_KEY=your_gemini_key_here
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_KEY=your_supabase_anon_key

# Run unit tests to verify Google OR-Tools
py test_solver.py

# Start FastAPI server
py -m uvicorn main:app --reload --port 8000
```
Backend will run at: `http://localhost:8000` (API Docs at `http://localhost:8000/docs`).

### 3. Frontend Setup (React + Tailwind CSS)
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
Frontend will be accessible at: `http://localhost:5173`.

---

## 🗄️ Supabase Database Setup

1. Open [Supabase Dashboard](https://supabase.com).
2. Create a new project or select an existing one.
3. Open the **SQL Editor** in Supabase and paste the contents of `supabase/schema.sql`.
4. Click **Run** to generate the tables (`scenarios`, `directives`, `optimization_results`).
5. Copy your Project URL & Anon Key into `backend/.env`.

---

## 🔄 n8n Workflow Automation

1. Open your **n8n** dashboard.
2. Click **Import from File** and select `n8n/gridwise_ai_workflow.json`.
3. In the Gemini HTTP Request node, configure your `GEMINI_API_KEY`.
4. The workflow exposes a webhook endpoint `POST /webhook/gridwise-optimize` that accepts operator requests and coordinates with FastAPI and Supabase.

---

## 📊 Dashboard Visualizations & Capabilities

1. **AI Operator Instruction Chat:** Converts natural language operator prompts into structured directives.
2. **Scenario Preset & JSON Uploader:** Test with Benchmark Commercial, Summer Heatwave, High Solar Farm, or custom JSON.
3. **24-Hour Generation vs. Demand Area Chart:** Stacked power flows showing Solar Used, Battery Discharge, Grid Import, and Net Demand.
4. **Battery State of Charge (SOC %) Timeline:** Visualizes battery reserve buffers and charge/discharge cycles.
5. **Cost vs. Time-of-Use Tariff Chart:** Clear demonstration of cost arbitrage.
6. **Detailed 24-Hour Dispatch Table:** Filterable by hour and directive, with full CSV export.
7. **Optimization History:** Saved records with single-click reload into dashboard.

---

## 🏆 Hackathon Submission Pitch

> *"GridWise AI bridges the gap between high-level human operators and deterministic mathematical optimization. While LLMs excel at understanding messy human instructions, they fail at exact numeric optimization. GridWise AI uses Gemini Flash exclusively as a directive translator, delegating all mathematical constraint satisfaction to Google OR-Tools. This results in guaranteed valid, lowest-cost schedules with 15-35% bill reductions."*
