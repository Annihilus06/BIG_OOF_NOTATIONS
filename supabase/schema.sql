-- ========================================================================
-- GridWise AI: Supabase Database Schema
-- Tables: scenarios, directives, optimization_results
-- ========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Scenarios Table: stores 24-hour energy parameters
CREATE TABLE IF NOT EXISTS scenarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    battery_capacity_kwh NUMERIC(10, 2) NOT NULL DEFAULT 20.0,
    max_charge_kw NUMERIC(10, 2) NOT NULL DEFAULT 5.0,
    max_discharge_kw NUMERIC(10, 2) NOT NULL DEFAULT 5.0,
    initial_soc_kwh NUMERIC(10, 2) NOT NULL DEFAULT 10.0,
    battery_efficiency NUMERIC(5, 4) NOT NULL DEFAULT 0.95,
    min_soc_pct NUMERIC(5, 4) NOT NULL DEFAULT 0.10,
    max_soc_pct NUMERIC(5, 4) NOT NULL DEFAULT 0.95,
    load_profile JSONB NOT NULL,    -- array of 24 numbers (kWh)
    solar_profile JSONB NOT NULL,   -- array of 24 numbers (kWh)
    tariff_profile JSONB NOT NULL,  -- array of 24 numbers ($/kWh)
    feed_in_tariff JSONB,           -- array of 24 numbers ($/kWh, optional)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Directives Table: stores natural language operator prompts and structured directives
CREATE TABLE IF NOT EXISTS directives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE,
    raw_prompt TEXT NOT NULL,
    parsed_directives JSONB NOT NULL, -- structured JSON array
    model_version VARCHAR(100) DEFAULT 'gemini-1.5-flash',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Optimization Results Table: stores OR-Tools lowest-cost schedule and metrics
CREATE TABLE IF NOT EXISTS optimization_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scenario_id UUID REFERENCES scenarios(id) ON DELETE SET NULL,
    directive_id UUID REFERENCES directives(id) ON DELETE SET NULL,
    scenario_name VARCHAR(255),
    raw_prompt TEXT,
    total_cost NUMERIC(12, 4) NOT NULL,
    baseline_cost NUMERIC(12, 4) NOT NULL,
    savings_pct NUMERIC(6, 2) NOT NULL,
    total_solar_used_kwh NUMERIC(10, 2) NOT NULL,
    total_grid_imported_kwh NUMERIC(10, 2) NOT NULL,
    total_battery_charged_kwh NUMERIC(10, 2) NOT NULL,
    total_battery_discharged_kwh NUMERIC(10, 2) NOT NULL,
    solver_status VARCHAR(50) NOT NULL,
    hourly_schedule JSONB NOT NULL,   -- 24 hourly data rows
    directives_applied JSONB NOT NULL, -- list of applied directive objects
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scenarios_created_at ON scenarios(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_directives_scenario_id ON directives(scenario_id);
CREATE INDEX IF NOT EXISTS idx_optimization_results_created_at ON optimization_results(created_at DESC);

-- Enable Row Level Security (RLS) and allow public read/write for hackathon demo
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE directives ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimization_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on scenarios" ON scenarios FOR SELECT USING (true);
CREATE POLICY "Allow public insert on scenarios" ON scenarios FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read on directives" ON directives FOR SELECT USING (true);
CREATE POLICY "Allow public insert on directives" ON directives FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read on optimization_results" ON optimization_results FOR SELECT USING (true);
CREATE POLICY "Allow public insert on optimization_results" ON optimization_results FOR INSERT WITH CHECK (true);
