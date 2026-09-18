import React from 'react';
import { Zap, ShieldCheck, Cpu, ArrowRight, Sparkles, TrendingUp, Sun, BatteryCharging } from 'lucide-react';

export default function HeroSection({ onQuickRun, onOpenArchModal }) {
  return (
    <div className="relative overflow-hidden pt-6 pb-8 border-b border-slate-800/60">
      {/* Background radial gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-700/40 text-cyan-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Next-Gen Microgrid Energy Orchestration</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Optimize 24h Energy Dispatch with{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
                Gemini NLP & OR-Tools
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Accepts operator instructions in natural language (e.g. <em>"Solar drops to 20% from 1 PM to 3 PM"</em>), converts them into structured mathematical directives via Gemini Flash, and solves the lowest-cost 24-hour battery and grid dispatch using Google OR-Tools.
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => onQuickRun('Solar production will drop to 20% between 1 PM and 3 PM.')}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 transition transform hover:-translate-y-0.5"
              >
                <Zap className="w-4 h-4" />
                <span>Simulate Solar Drop (1-3 PM)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenArchModal}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-slate-600 transition"
              >
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>View Architecture Pipeline</span>
              </button>
            </div>
          </div>

          {/* Right Highlights Cards */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl glass-panel border border-slate-800/80 bg-slate-900/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/50">LP Engine</span>
              </div>
              <h3 className="text-sm font-bold text-white">Google OR-Tools</h3>
              <p className="text-xs text-slate-400 leading-snug">
                Strict mathematical linear programming solver enforcing SOC bounds & energy balance.
              </p>
            </div>

            <div className="p-4 rounded-2xl glass-panel border border-slate-800/80 bg-slate-900/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/50">Gemini Flash</span>
              </div>
              <h3 className="text-sm font-bold text-white">Strict Directive NLP</h3>
              <p className="text-xs text-slate-400 leading-snug">
                Extracts machine directives without calculating schedules, ensuring deterministic solver accuracy.
              </p>
            </div>

            <div className="p-4 rounded-2xl glass-panel border border-slate-800/80 bg-slate-900/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800/50">20-35%</span>
              </div>
              <h3 className="text-sm font-bold text-white">Cost Reduction</h3>
              <p className="text-xs text-slate-400 leading-snug">
                Arbitrage peak Time-of-Use tariffs by intelligently charging during off-peak and solar peaks.
              </p>
            </div>

            <div className="p-4 rounded-2xl glass-panel border border-slate-800/80 bg-slate-900/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-purple-400 bg-purple-950 px-2 py-0.5 rounded border border-purple-800/50">n8n Ready</span>
              </div>
              <h3 className="text-sm font-bold text-white">Workflow Pipeline</h3>
              <p className="text-xs text-slate-400 leading-snug">
                Full exportable n8n workflow JSON with Webhook, Gemini, Validator, and Supabase database.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
