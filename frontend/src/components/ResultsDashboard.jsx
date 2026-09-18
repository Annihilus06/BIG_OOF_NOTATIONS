import React from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend, ReferenceLine 
} from 'recharts';
import { 
  DollarSign, TrendingDown, Sun, Battery, BatteryCharging, Zap, 
  CheckCircle2, Sparkles, ArrowDownRight, Layers, Shield 
} from 'lucide-react';

export default function ResultsDashboard({ result }) {
  if (!result || !result.hourly_schedule || result.hourly_schedule.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800 bg-slate-900/60">
        <Zap className="w-12 h-12 text-cyan-500/40 mx-auto mb-4 animate-pulse" />
        <h3 className="text-lg font-bold text-white mb-1">No Optimization Results Yet</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Click <strong>"Run Google OR-Tools Optimizer"</strong> above or type an operator instruction to generate the optimal 24-hour dispatch schedule.
        </p>
      </div>
    );
  }

  // Format data for Recharts
  const chartData = result.hourly_schedule.map((item) => ({
    hour: item.time_label,
    hourNum: item.hour,
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

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel p-3 rounded-xl border border-slate-700 bg-slate-950/95 text-xs shadow-2xl space-y-1">
          <p className="font-bold text-white border-b border-slate-800 pb-1 flex items-center justify-between">
            <span>Time: {label}</span>
            <span className="text-[10px] text-cyan-400 font-mono">24h Dispatch</span>
          </p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4 py-0.5">
              <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-mono font-bold text-slate-200">
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
    <div className="space-y-6">
      
      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Cost */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 bg-slate-900/80 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Optimized Bill</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              ${result.total_cost.toFixed(2)}
            </span>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span>Baseline:</span>
              <span className="line-through text-slate-500">${result.baseline_cost.toFixed(2)}</span>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl" />
        </div>

        {/* Card 2: Cost Savings */}
        <div className="glass-panel rounded-2xl p-5 border border-emerald-900/40 bg-slate-900/80 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Total Savings</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
                ${result.savings_amount.toFixed(2)}
              </span>
              <span className="text-sm font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800/60">
                +{result.savings_pct.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Linear programming arbitrage savings
            </p>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
        </div>

        {/* Card 3: Solar Utilization */}
        <div className="glass-panel rounded-2xl p-5 border border-amber-900/40 bg-slate-900/80 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Solar Used</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Sun className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {result.total_solar_used_kwh.toFixed(1)}{' '}
              <span className="text-sm font-normal text-slate-400">kWh</span>
            </span>
            <p className="text-xs text-amber-400/90 mt-1 flex items-center gap-1">
              <span>{result.solar_utilization_pct.toFixed(1)}% Generation Utilized</span>
            </p>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl" />
        </div>

        {/* Card 4: Grid Import & Peak */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 bg-slate-900/80 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Peak Grid Draw</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {result.peak_grid_demand_kw.toFixed(1)}{' '}
              <span className="text-sm font-normal text-slate-400">kW</span>
            </span>
            <p className="text-xs text-slate-400 mt-1">
              Total Imported: {result.total_grid_imported_kwh.toFixed(1)} kWh
            </p>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl" />
        </div>

      </div>

      {/* Solver Summary Pill */}
      {result.explanation && (
        <div className="p-4 rounded-2xl glass-panel border border-cyan-900/40 bg-slate-900/90 flex items-start space-x-3">
          <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">OR-Tools Optimization Summary:</span>
            <p className="text-xs sm:text-sm text-slate-200 mt-0.5 leading-relaxed font-medium">
              {result.explanation}
            </p>
          </div>
        </div>
      )}

      {/* Chart 1: 24h Energy Dispatch Power Balance */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 bg-slate-900/80 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              24-Hour Energy Generation & Dispatch Schedule
            </h3>
            <p className="text-xs text-slate-400">
              Optimal power flow: Solar + Battery Discharge + Grid Import = Building Load + Battery Charge.
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSolar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorGridIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="colorBatDis" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit=" kW" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
              
              <Area type="monotone" dataKey="solarUsed" name="Solar Used" unit=" kWh" stroke="#f59e0b" fillOpacity={1} fill="url(#colorSolar)" />
              <Area type="monotone" dataKey="batteryDischarge" name="Battery Discharge" unit=" kWh" stroke="#06b6d4" fillOpacity={1} fill="url(#colorBatDis)" />
              <Area type="monotone" dataKey="gridImport" name="Grid Import" unit=" kWh" stroke="#ef4444" fillOpacity={1} fill="url(#colorGridIn)" />
              <Line type="monotone" dataKey="demand" name="Building Load" unit=" kWh" stroke="#ffffff" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="batteryCharge" name="Battery Charge" unit=" kWh" stroke="#10b981" strokeWidth={2} strokeDasharray="4 4" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2 & 3: Side-by-Side (Battery SOC & Hourly Cost) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Battery SOC Timeline */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 bg-slate-900/80 shadow-xl space-y-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BatteryCharging className="w-4 h-4 text-emerald-400" />
              Battery State of Charge (SOC %)
            </h3>
            <p className="text-xs text-slate-400">
              Dynamic SOC trajectory adhering to reserve limits and peak dispatch.
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSoc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={20} label={{ value: "Reserve Limit", fill: '#f87171', fontSize: 10 }} stroke="#f87171" strokeDasharray="3 3" />
                <Area type="monotone" dataKey="batterySocPct" name="Battery SOC" unit="%" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSoc)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hourly Electricity Cost & Tariff Profile */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 bg-slate-900/80 shadow-xl space-y-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-cyan-400" />
              Hourly Cost & Time-of-Use Grid Tariff
            </h3>
            <p className="text-xs text-slate-400">
              Arbitrage performance: shifting grid import away from high-price hours.
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit="$" />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar dataKey="hourlyCost" name="Optimized Cost" unit=" $" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="tariff" name="Tariff ($/kWh)" unit=" $/kWh" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
