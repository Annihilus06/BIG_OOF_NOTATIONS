import React from 'react';
import { Play, Sparkles, Battery, Sun, Zap, Shield, ArrowUpRight, Cpu } from 'lucide-react';

export default function HeroSection({ scenario, onQuickRun, onOpenArchModal }) {
  return (
    <div className="bg-[#0f1422] border border-[#1e273c] rounded-xl p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left: Operational Context */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <h1 className="text-lg font-bold text-white tracking-tight font-sans">
              24-Hour Energy Dispatch Optimization
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#172138] text-sky-300 border border-[#233355]">
              OR-Tools LP / MIP
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Directly translates operator constraints into mathematical directives via Gemini Flash and optimizes battery charge/discharge to achieve lowest net electricity cost against dynamic Time-of-Use tariffs.
          </p>
        </div>

        {/* Right: Site Telemetry Summary & Quick Run */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-[#0a0d16] border border-[#1b2336] text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Battery ESS</span>
              <span className="font-bold text-emerald-400">{scenario.battery_capacity_kwh} kWh</span>
            </div>
            <div className="h-6 w-px bg-slate-800"></div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Inverter Limit</span>
              <span className="font-bold text-sky-400">{scenario.max_charge_kw} kW</span>
            </div>
            <div className="h-6 w-px bg-slate-800"></div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Efficiency</span>
              <span className="font-bold text-slate-200">{(scenario.battery_efficiency * 100).toFixed(0)}%</span>
            </div>
          </div>

          <button
            onClick={() => onQuickRun('Solar production will drop to 20% between 1 PM and 3 PM.')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Simulate Cloud Cover (1-3 PM)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
