import React from 'react';
import { X, Layers, ShieldCheck } from 'lucide-react';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

export default function ArchitectureModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const steps = [
    {
      num: "01",
      title: "React Operator Console",
      desc: "Operator captures natural language instructions or uploads 24-hour JSON scenario profiles.",
      tag: "UI Layer",
      badgeVariant: "primary"
    },
    {
      num: "02",
      title: "n8n Orchestrator",
      desc: "Coordinates webhook ingestion, payload routing, Gemini LLM calls, and solver execution.",
      tag: "Workflow",
      badgeVariant: "neutral"
    },
    {
      num: "03",
      title: "Gemini Flash AI Parser",
      desc: "Translates human text into structured mathematical machine directives only. Never solves math.",
      tag: "Intent NLP",
      badgeVariant: "success"
    },
    {
      num: "04",
      title: "Directive Safety Validator",
      desc: "Validates hour intervals (0-23), factor bounds (0.0-1.0), and operational bounds.",
      tag: "Validation",
      badgeVariant: "warning"
    },
    {
      num: "05",
      title: "Google OR-Tools Engine (GLOP)",
      desc: "Mathematical linear programming solver calculating global lowest-cost 24h schedule.",
      tag: "LP Engine",
      badgeVariant: "primary"
    },
    {
      num: "06",
      title: "Supabase Database (PostgreSQL)",
      desc: "Stores scenarios, directives, and hourly energy dispatch matrices for audit and history.",
      tag: "Persistence",
      badgeVariant: "success"
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="max-w-3xl w-full rounded-[10px] p-6 border border-[#374151] bg-[#111827] text-[#F9FAFB] shadow-xl relative max-h-[90vh] overflow-y-auto space-y-5">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-[6px] bg-[#1F2937] text-[#94A3B8] hover:text-[#F9FAFB] border border-[#374151] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-[8px] bg-[#2563EB]/15 border border-[#2563EB]/30 flex items-center justify-center text-[#60A5FA]">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-[18px] font-bold text-[#F9FAFB]">GridWise AI System Architecture</h2>
            <p className="text-[12px] text-[#94A3B8]">Deterministic Linear Optimization + LLM Language Understanding</p>
          </div>
        </div>

        {/* Core Architecture Rule Box */}
        <div className="p-3.5 rounded-[8px] bg-[#0B1220] border border-[#374151] text-[13px] flex items-start space-x-2.5">
          <ShieldCheck className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
          <div className="text-[#CBD5E1] leading-relaxed">
            <strong className="text-[#F9FAFB]">Strict Architectural Guarantee:</strong> Gemini Flash NEVER calculates schedules or numerical values. Gemini exclusively extracts structured machine directives (`solar_reduction`, `minimum_battery_reserve`, `no_charge_window`, etc.). All mathematical optimization is solved by <strong>Google OR-Tools</strong>.
          </div>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {steps.map((s, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-[8px] border border-[#374151] bg-[#0B1220] space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-mono font-bold text-[#94A3B8]">{s.num}</span>
                <Badge variant={s.badgeVariant}>
                  {s.tag}
                </Badge>
              </div>
              <h4 className="text-[13px] font-semibold text-[#F9FAFB]">{s.title}</h4>
              <p className="text-[12px] text-[#94A3B8] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Supported Directives Schema */}
        <div className="p-3.5 rounded-[8px] border border-[#374151] bg-[#0B1220] space-y-2">
          <span className="text-[11px] uppercase font-bold text-[#94A3B8] tracking-wider block font-mono">
            Structured Directive Schema Types:
          </span>
          <div className="flex flex-wrap gap-1.5 text-[11px] font-mono">
            <Badge variant="warning">solar_reduction (hours, factor)</Badge>
            <Badge variant="success">minimum_battery_reserve (hours, min_soc_pct)</Badge>
            <Badge variant="danger">no_charge_window (hours)</Badge>
            <Badge variant="primary">no_discharge_window (hours)</Badge>
            <Badge variant="primary">max_grid_window (hours, max_grid_kw)</Badge>
          </div>
        </div>

      </div>
    </div>
  );
}