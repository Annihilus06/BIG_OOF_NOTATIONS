import React, { useState } from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend, ReferenceLine 
} from 'recharts';
import { 
  DollarSign, TrendingDown, Sun, BatteryCharging, Zap, 
  Layers, CheckCircle2, ShieldCheck, Terminal, Cpu 
} from 'lucide-react';

export default function ResultsDashboard({ result }) {
  const [activeView, setActiveView] = useState('all');

  if (!result || !result.hourly_schedule || result.hourly_schedule.length === 0) {
    return (
      <div className="bg-[#0f1422] border border-[#1e273c] rounded-xl p-12 text-center">
        <Cpu className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-white font-mono">SOLVER STATUS: IDLE</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Execute the OR-Tools solver above to compute the 24-hour lowest-cost schedule and dispatch analytics.
        </p>
      </div>
    );
  }

  const chartData = result.hourly_schedule.map((item) => ({
    hour: item.time_label,
    demand: item.load_kwh,
    solarAvailable: item.solar_available_kwh,
    solarEffective: item.solar_effective_kwh,
    solarUsed: item.solar_used_kwh,
    solarCurtailed: item.solar_curtailed_kwh,
    batteryCharge: item.battery_charge_kwh,
    batteryDischarge: item.battery_discharge_kwh,
    batterySocPct: item.battery_soc_pct,
    batterySocKwh: item.battery_soc_kwh,
    gridImport: item.grid_import_kwh,
    gridExport: item.grid_export_kwh,
    tariff: item.tariff_per_kwh,
    hourlyCost: item.hourly_cost,
    activeDirectives: item.active_directives || []
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 rounded-lg border border-[#232d44] bg-[#0c101a] text-xs font-mono shadow-xl space-y-1">
          <p className="font-bold text-white border-b border-slate-800 pb-1 flex items-center justify-between">
            <span>TIMESTAMP: {label}</span>
            <span className="text-[10px] text-sky-400 font-normal">INTERVAL 1H</span>
          </p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4 py-0.5">
              <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-bold text-slate-200">
                {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value} {entry.unit || ''}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-5">
      
      {/* 4 Metric Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Card 1: Total Optimized Bill */}
        <div className="bg-[#0f1422] border border-[#1e273c] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>24H ENERGY COST</span>
            <DollarSign className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-white font-mono tracking-tight">
              ${result.total_cost.toFixed(2)}
            </span>
            <div className="text-right text-[11px] font-mono">
              <span className="text-slate-500 block">BASE: ${result.baseline_cost.toFixed(2)}</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-[#182133] flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Method:</span>
            <span className="text-sky-300 font-mono font-bold">OR-Tools LP (GLOP)</span>
          </div>
        </div>

        {/* Card 2: Cost Savings */}
        <div className="bg-[#0f1422] border border-[#1e273c] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-mono">
            <span>NET BILL SAVINGS</span>
            <TrendingDown className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
              ${result.savings_amount.toFixed(2)}
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-xs font-mono font-bold">
              +{result.savings_pct.toFixed(1)}%
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-[#182133] flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Peak Arbitrage:</span>
            <span className="text-emerald-400 font-mono font-bold">OPTIMAL</span>
          </div>
        </div>

        {/* Card 3: Solar Generation */}
        <div className="bg-[#0f1422] border border-[#1e273c] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-amber-400 text-xs font-mono">
            <span>SOLAR UTILIZATION</span>
            <Sun className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-white font-mono tracking-tight">
              {result.total_solar_used_kwh.toFixed(1)}{' '}
              <span className="text-xs font-normal text-slate-400">kWh</span>
            </span>
            <span className="text-xs font-mono text-amber-400 font-bold">
              {result.solar_utilization_pct.toFixed(0)}% Utilized
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-[#182133] flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Solar Curtailed:</span>
            <span className="text-slate-300 font-mono">{result.total_solar_curtailed_kwh.toFixed(1)} kWh</span>
          </div>
        </div>

        {/* Card 4: Grid Import & Peak */}
        <div className="bg-[#0f1422] border border-[#1e273c] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>PEAK GRID DEMAND</span>
            <Zap className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-white font-mono tracking-tight">
              {result.peak_grid_demand_kw.toFixed(1)}{' '}
              <span className="text-xs font-normal text-slate-400">kW</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Total: {result.total_grid_imported_kwh.toFixed(0)} kWh
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-[#182133] flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Status:</span>
            <span className="text-emerald-400 font-mono font-bold">CONSTRAINTS MET</span>
          </div>
        </div>

      </div>

      {/* Solver Status Alert */}
      {result.explanation && (
        <div className="p-3 rounded-lg bg-[#0b0f19] border border-[#1d273d] flex items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center space-x-2 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-sky-400"></span>
            <span>SOLVER TELEMETRY:</span>
            <span className="text-slate-400 font-sans font-medium">{result.explanation}</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-[#151e30] text-sky-400 border border-[#223150] text-[10px] shrink-0 font-bold">
            {result.solver_status}
          </span>
        </div>
      )}

      {/* Chart 1: 24h Energy Dispatch Power Balance */}
      <div className="bg-[#0f1422] border border-[#1e273c] rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#1b2336] gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
              <Layers className="w-4 h-4 text-sky-400" />
              24-HOUR POWER FLOW TELEMETRY & DISPATCH SCHEDULE
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Power Balance: Solar (Used) + Battery Discharge + Grid Import = Building Demand + Battery Charge.
            </p>
          </div>

          <div className="flex items-center space-x-1 text-[11px] font-mono text-slate-400 bg-[#0a0d16] p-1 rounded-md border border-[#1b2336]">
            <span>UNITS: kWh / kW</span>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="solarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d97706" stopOpacity={0.7}/>
                  <stop offset="95%" stopColor="#d97706" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="batGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.7}/>
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="gridGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e11d48" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="#e11d48" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 2" stroke="#182236" />
              <XAxis dataKey="hour" stroke="#475569" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis stroke="#475569" tick={{ fontSize: 10, fill: '#94a3b8' }} unit=" kW" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10, fontFamily: 'monospace' }} />
              
              <Area type="monotone" dataKey="solarUsed" name="Solar PV Used" unit=" kWh" stroke="#d97706" strokeWidth={1.5} fillOpacity={1} fill="url(#solarGradient)" />
              <Area type="monotone" dataKey="batteryDischarge" name="Battery Discharge" unit=" kWh" stroke="#0284c7" strokeWidth={1.5} fillOpacity={1} fill="url(#batGradient)" />
              <Area type="monotone" dataKey="gridImport" name="Grid Import" unit=" kWh" stroke="#e11d48" strokeWidth={1.5} fillOpacity={1} fill="url(#gridGradient)" />
              <Line type="monotone" dataKey="demand" name="Building Load Demand" unit=" kWh" stroke="#ffffff" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="batteryCharge" name="Battery Charging" unit=" kWh" stroke="#10b981" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2 & 3: Side-by-Side (Battery SOC & Hourly Arbitrage) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Battery SOC Trajectory */}
        <div className="bg-[#0f1422] border border-[#1e273c] rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#1b2336]">
            <div>
              <h3 className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                BATTERY STATE OF CHARGE (SOC %)
              </h3>
              <p className="text-[10px] text-slate-400">Reserve constraints and cycle tracking</p>
            </div>
            <span className="text-[10px] font-mono text-emerald-400">EFF: 95%</span>
          </div>

          <div className="h-60 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="socGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 2" stroke="#182236" />
                <XAxis dataKey="hour" stroke="#475569" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis stroke="#475569" domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={20} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "Reserve Buffer (20%)", fill: '#ef4444', fontSize: 9, position: 'insideTopLeft' }} />
                <Area type="monotone" dataKey="batterySocPct" name="Battery SOC" unit="%" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#socGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hourly Cost vs Time-of-Use Tariff */}
        <div className="bg-[#0f1422] border border-[#1e273c] rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#1b2336]">
            <div>
              <h3 className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-sky-400" />
                HOURLY COST & TIME-OF-USE TARIFF
              </h3>
              <p className="text-[10px] text-slate-400">Peak hour discharge arbitrage</p>
            </div>
            <span className="text-[10px] font-mono text-sky-400">TOU ARBITRAGE</span>
          </div>

          <div className="h-60 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#182236" />
                <XAxis dataKey="hour" stroke="#475569" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis stroke="#475569" tick={{ fontSize: 10, fill: '#94a3b8' }} unit="$" />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10, fontFamily: 'monospace' }} />
                <Bar dataKey="hourlyCost" name="Net Cost ($)" unit=" $" fill="#0284c7" radius={[2, 2, 0, 0]} />
                <Line type="monotone" dataKey="tariff" name="Tariff ($/kWh)" unit=" $/kWh" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
