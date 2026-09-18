import React from 'react';
import { X, Cpu, Sparkles, Database, Layers, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export default function ArchitectureModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const steps = [
    {
      num: "01",
      title: "Frontend (React + Tailwind)",
      desc: "Operator enters natural language notes, uploads 24h JSON scenario, or selects presets.",
      tag: "UI Layer",
      color: "border-cyan-500/50 text-cyan-300"
    },
    {
      num: "02",
      title: "n8n Workflow / Webhook",
      desc: "Orchestrates API calls, webhook payloads, and error routing between services.",
      tag: "Orchestration",
      color: "border-purple-500/50 text-purple-300"
    },
    {
      num: "03",
      title: "Gemini Flash AI",
      desc: "Parses human instructions into strict structured directive JSON. NEVER solves schedule.",
      tag: "LLM Parser",
      color: "border-emerald-500/50 text-emerald-300"
    },
    {
      num: "04",
      title: "Directive Validation",
      desc: "Verifies hour bounds (0-23), factor thresholds (0-1), and directive type schema.",
      tag: "Validation",
      color: "border-amber-500/50 text-amber-300"
    },
    {
      num: "05",
      title: "FastAPI + Google OR-Tools",
      desc: "Builds mathematical 24h LP model, enforces constraints, and calculates global optimal dispatch.",
      tag: "Solver Engine",
      color: "border-blue-500/50 text-blue-300"
    },
    {
      num: "06",
      title: "Supabase Database",
      desc: "Persists scenarios, parsed directives, and full 24h schedule results to PostgreSQL.",
      tag: "Storage Layer",
      color: "border-emerald-500/50 text-emerald-300"
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel-glow max-w-3xl w-full rounded-2xl p-6 border border-slate-700 bg-slate-900 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">GridWise AI Platform Architecture</h2>
            <p className="text-xs text-slate-400">Strict separation between AI Language Understanding and Mathematical Optimization</p>
          </div>
        </div>

        {/* Important Rule Alert */}
        <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs mb-6 flex items-start space-x-2.5">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong>Core Architecture Rule:</strong> Gemini Flash understands operator instructions and converts them into structured mathematical directives only. <strong>Google OR-Tools</strong> performs all constraint solving and guarantees optimal 24-hour lowest cost.
          </div>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-6">
          {steps.map((s, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-500">{s.num}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.color}`}>
                  {s.tag}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">{s.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Supported Directive Types */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-2">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Supported Structured Directives:
          </h4>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-amber-950/40 text-amber-300 border border-amber-800/40 font-mono">
              solar_reduction (hours, factor)
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 font-mono">
              minimum_battery_reserve (hours, min_soc_pct)
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-rose-950/40 text-rose-300 border border-rose-800/40 font-mono">
              no_charge_window (hours)
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-blue-950/40 text-blue-300 border border-blue-800/40 font-mono">
              no_discharge_window (hours)
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-purple-950/40 text-purple-300 border border-purple-800/40 font-mono">
              max_grid_window (hours, max_grid_kw)
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
