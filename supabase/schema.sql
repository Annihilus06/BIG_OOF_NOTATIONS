-- ==============================================================================
-- GridWise AI – Database Schema (PostgreSQL / Supabase)
-- BUP CSE Fest Hackathon Platform Architecture
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Scenarios Table
CREATE TABLE IF NOT EXISTS scenarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    battery_capacity_kwh NUMERIC(8, 2) NOT NULL DEFAULT 40.0,
    initial_soc_kwh NUMERIC(8, 2) NOT NULL DEFAULT 20.0,
    min_soc_pct NUMERIC(4, 3) NOT NULL DEFAULT 0.20,
    max_charge_kw NUMERIC(8, 2) NOT NULL DEFAULT 10.0,
    max_discharge_kw NUMERIC(8, 2) NOT NULL DEFAULT 10.0,
    battery_efficiency NUMERIC(4, 3) NOT NULL DEFAULT 0.95,
    load_profile JSONB NOT NULL,
    solar_profile JSONB NOT NULL,
    tariff_profile JSONB NOT NULL,
    feed_in_tariff JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Directives Table
CREATE TABLE IF NOT EXISTS directives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE,
    directive_type VARCHAR(50) NOT NULL CHECK (directive_type IN (
        'solar_reduction',
        'minimum_battery_reserve',
        'no_charge_window',
        'no_discharge_window',
        'max_grid_window',
        'no_op'
    )),
    hours JSONB NOT NULL, -- Array of integer hours [12, 13, 14]
    value NUMERIC(8, 4) DEFAULT 0.0,
    factor NUMERIC(4, 3),
    min_soc_pct NUMERIC(4, 3),
    max_grid_kw NUMERIC(8, 2),
    notes TEXT,
    applied BOOLEAN NOT NULL DEFAULT TRUE,
    confidence_score NUMERIC(4, 3) DEFAULT 1.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Optimization Results Table
CREATE TABLE IF NOT EXISTS optimization_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scenario_name VARCHAR(255) NOT NULL,
    solver_status VARCHAR(50) NOT NULL DEFAULT 'OPTIMAL',
    currency VARCHAR(10) NOT NULL DEFAULT 'BDT',
    total_cost_bdt NUMERIC(12, 2) NOT NULL,
    baseline_cost_bdt NUMERIC(12, 2) NOT NULL,
    savings_amount_bdt NUMERIC(12, 2) NOT NULL,
    savings_pct NUMERIC(5, 2) NOT NULL,
    total_solar_generated_kwh NUMERIC(10, 2) NOT NULL,
    total_solar_used_kwh NUMERIC(10, 2) NOT NULL,
    total_solar_curtailed_kwh NUMERIC(10, 2) NOT NULL,
    solar_utilization_pct NUMERIC(5, 2) NOT NULL,
    total_grid_imported_kwh NUMERIC(10, 2) NOT NULL,
    total_grid_exported_kwh NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    total_battery_charged_kwh NUMERIC(10, 2) NOT NULL,
    total_battery_discharged_kwh NUMERIC(10, 2) NOT NULL,
    peak_grid_demand_kw NUMERIC(8, 2) NOT NULL,
    initial_battery_kwh NUMERIC(8, 2) NOT NULL,
    final_battery_kwh NUMERIC(8, 2) NOT NULL,
    battery_energy_balanced BOOLEAN NOT NULL DEFAULT TRUE,
    hourly_schedule JSONB NOT NULL,
    directives_applied JSONB,
    explanation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Audit & Operator Prompt Logs
CREATE TABLE IF NOT EXISTS operator_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt TEXT NOT NULL,
    parsed_directives JSONB NOT NULL,
    execution_time_ms NUMERIC(8, 2),
    client_ip VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for high performance querying
CREATE INDEX IF NOT EXISTS idx_scenarios_name ON scenarios(name);
CREATE INDEX IF NOT EXISTS idx_optimization_results_created ON optimization_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_directives_scenario_id ON directives(scenario_id);

-- Enable Row Level Security (RLS)
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE directives ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimization_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read/write access for hackathon sandbox
CREATE POLICY "Public Read Access Scenarios" ON scenarios FOR SELECT USING (true);
CREATE POLICY "Public Insert Access Scenarios" ON scenarios FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read Access Results" ON optimization_results FOR SELECT USING (true);
CREATE POLICY "Public Insert Access Results" ON optimization_results FOR INSERT WITH CHECK (true);
