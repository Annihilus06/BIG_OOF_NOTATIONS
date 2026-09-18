import React from 'react';
import { X, Layers, Cpu, Sparkles, Database, ShieldCheck, ArrowRight, Terminal } from 'lucide-react';

export default function ArchitectureModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const steps = [
    {
      num: "01",
      title: "React Operator Terminal",
      desc: "Industrial operator captures natural language operational constraints or uploads 24h JSON profiles.",
      tag: "UI / SCADA",
      color: "border-sky-500/40 text-sky-300"
    },
    {
      num: "02",
      title: "n8n Orchestration Layer",
      desc: "Coordinates webhooks, payload schemas, LLM generation, and solver routing.",
      tag: "ORCHESTRATION",
      color: "border-purple-500/40 text-purple-300"
    },
    {
      num: "03",
      title: "Gemini Flash AI Parser",
      desc: "Extracts machine directives without performing mathematical calculations.",
      tag: "INTENT NLP",
      color: "border-emerald-500/40 text-emerald-300"
    },
    {
      num: "04",
      title: "Safety & Directive Validator",
      desc: "Enforces hour intervals (0-23), factor bounds (0-1), and operational interlocks.",
      tag: "VALIDATION",
      color: "border-amber-500/40 text-amber-300"
    },
    {
      num: "05",
      title: "Google OR-Tools Engine (GLOP)",
      desc: "Mathematical linear programming solver calculating global minimum-cost 24h schedule.",
      tag: "LP SOLVER",
      color: "border-blue-500/40 text-blue-300"
    },
    {
      num: "06",
      title: "Supabase Database (PostgreSQL)",
      desc: "Stores scenarios, directives, and hourly energy dispatch matrices.",
      tag: "STORAGE",
      color: "border-emerald-500/40 text-emerald-300"
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="max-w-3xl w-full rounded-xl p-6 border border-[#263554] bg-[#0c101a] text-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-[#141c2e] text-slate-400 hover:text-white border border-[#212d48] transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-[#141d30] border border-[#233150] flex items-center justify-center text-sky-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white font-mono">GRIDWISE AI SYSTEM ARCHITECTURE</h2>
            <p className="text-xs text-slate-400">Deterministic Mathematical Optimization + LLM Language Understanding</p>
          </div>
        </div>

        {/* Core Architecture Rule Box */}
        <div className="p-3.5 rounded-lg bg-[#0e1626] border border-[#1f2f4e] text-xs mb-5 flex items-start space-x-2.5 font-sans">
          <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <div className="text-slate-300 leading-relaxed">
            <strong className="text-white">Strict Architectural Guarantee:</strong> Gemini Flash NEVER calculates schedules or numerical values. Gemini exclusively extracts structured machine directives (`solar_reduction`, `minimum_battery_reserve`, `no_charge_window`, etc.). All mathematical optimization and constraint satisfaction is solved globally by <strong>Google OR-Tools</strong>.
          </div>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
          {steps.map((s, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg border border-[#1b2336] bg-[#090c14] space-y-1 font-mono"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">{s.num}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${s.color}`}>
                  {s.tag}
                </span>
              </div>
              <h4 className="text-xs font-bold text-white font-sans">{s.title}</h4>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Supported Directive Types */}
        <div className="p-3.5 rounded-lg border border-[#1b2336] bg-[#090c14] space-y-2 font-mono">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            FORMAL DIRECTIVE SCHEMA SPECIFICATION:
          </span>
          <div className="flex flex-wrap gap-1.5 text-[10px]">
            <span className="px-2 py-0.5 rounded bg-[#18233c] text-amber-300 border border-[#25375c]">
              solar_reduction (hours, factor)
            </span>
            <span className="px-2 py-0.5 rounded bg-[#18233c] text-emerald-300 border border-[#25375c]">
              minimum_battery_reserve (hours, min_soc_pct)
            </span>
            <span className="px-2 py-0.5 rounded bg-[#18233c] text-rose-300 border border-[#25375c]">
              no_charge_window (hours)
            </span>
            <span className="px-2 py-0.5 rounded bg-[#18233c] text-sky-300 border border-[#25375c]">
              no_discharge_window (hours)
            </span>
            <span className="px-2 py-0.5 rounded bg-[#18233c] text-purple-300 border border-[#25375c]">
              max_grid_window (hours, max_grid_kw)
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
