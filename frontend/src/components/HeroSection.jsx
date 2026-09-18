import React from 'react';
import { Play } from 'lucide-react';
import { Button } from './ui/Button';

export default function HeroSection({ scenario, onQuickRun }) {
  return (
    <div className="bg-[#111827] border border-[#374151] rounded-[10px] p-6 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        
        {/* Left: Operational Context */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
            <h1 className="text-[24px] sm:text-[32px] font-bold text-[#F9FAFB] tracking-tight leading-tight">
              24-Hour Energy Dispatch Optimization
            </h1>
          </div>
          <p className="text-[14px] text-[#CBD5E1] max-w-3xl leading-relaxed">
            Converts natural language operator instructions into structured mathematical directives using Gemini Flash and solves the lowest-cost 24-hour battery and grid dispatch using Google OR-Tools.
          </p>
        </div>

        {/* Right: Site Telemetry Summary & Quick Run */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center space-x-4 px-4 py-2.5 rounded-[10px] bg-[#0B1220] border border-[#374151] text-[12px] font-mono">
            <div>
              <span className="text-[#94A3B8] text-[11px] block uppercase">Battery Capacity</span>
              <span className="font-bold text-[#F9FAFB]">{scenario.battery_capacity_kwh} kWh</span>
            </div>
            <div className="h-6 w-px bg-[#374151]" />
            <div>
              <span className="text-[#94A3B8] text-[11px] block uppercase">Max Power</span>
              <span className="font-bold text-[#F9FAFB]">{scenario.max_charge_kw} kW</span>
            </div>
            <div className="h-6 w-px bg-[#374151]" />
            <div>
              <span className="text-[#94A3B8] text-[11px] block uppercase">Efficiency</span>
              <span className="font-bold text-[#F9FAFB]">{(scenario.battery_efficiency * 100).toFixed(0)}%</span>
            </div>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => onQuickRun('Solar production will drop to 20% between 1 PM and 3 PM.')}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Simulate Solar Drop (1-3 PM)</span>
          </Button>
        </div>

      </div>
    </div>
  );
}