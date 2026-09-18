import React, { useState } from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend, ReferenceLine 
} from 'recharts';
import { 
  TrendingDown, Sun, Layers, BatteryCharging, 
  CheckCircle2, AlertTriangle, ShieldCheck, 
  ArrowLeft, Download, Table, Activity, FileSpreadsheet
} from 'lucide-react';
import { Badge } from './ui/Badge';
import { COLORS } from '../lib/colors';

export default function ResultsDashboard({ result, onBackToConsole, onNewRun }) {
  const [activeView, setActiveView] = useState('graphs'); // 'graphs' | 'table'

  if (!result || !result.hourly_schedule || result.hourly_schedule.length === 0) {
    return (
      <div className="max-w-md mx-auto py-28 text-center space-y-3 select-none">
        <h3 className="text-base font-semibold text-slate-300">Nothing to show</h3>
        <p className="text-xs text-slate-500">
          Attach a 24-hour grid scenario JSON or enter operator instructions in the prompt console to run optimization.
        </p>
        {onBackToConsole && (
          <button
            onClick={onBackToConsole}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#212121] hover:bg-[#2a2a2a] text-sky-400 text-xs font-medium border border-[#333] transition-colors cursor-pointer mt-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Open Prompt Console</span>
          </button>
        )}
      </div>
    );
  }

  const costTotal = result.total_cost_bdt ?? result.total_cost ?? 0;
  const costBaseline = result.baseline_cost_bdt ?? result.baseline_cost ?? 0;
  const costSavings = result.savings_amount_bdt ?? result.savings_amount ?? 0;
  const isInvalid = !result.success || result.solver_status === 'INVALID' || result.validation_passed === false;

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
    tariff: item.tariff_bdt_per_kwh ?? item.tariff_per_kwh ?? 0,
    hourlyCost: item.hourly_cost_bdt ?? item.hourly_cost ?? 0,
    isValid: item.is_valid ?? true
  }));

  const handleExportCSV = () => {
    if (!result.hourly_schedule) return;
    const headers = ["Hour", "Time", "Demand (kWh)", "Solar Effective (kWh)", "Solar Used (kWh)", "Battery Charge (kWh)", "Battery Discharge (kWh)", "Battery SOC (%)", "Grid Import (kWh)", "Tariff (BDT/kWh)", "Hourly Cost (BDT)"];
    const rows = result.hourly_schedule.map(h => [
      h.hour,
      h.time_label,
      h.load_kwh,
      h.solar_effective_kwh,
      h.solar_used_kwh,
      h.battery_charge_kwh,
      h.battery_discharge_kwh,
      h.battery_soc_pct,
      h.grid_import_kwh,
      h.tariff_bdt_per_kwh || h.tariff_per_kwh,
      h.hourly_cost_bdt || h.hourly_cost
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `gridwise_dispatch_${result.scenario_name || 'schedule'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 rounded-xl border border-[#333] bg-[#181818] text-xs font-mono shadow-2xl space-y-1">
          <p className="font-semibold text-white border-b border-[#333] pb-1 flex items-center justify-between gap-4">
            <span>Hour: {label}</span>
            <span className="text-slate-400 font-normal">24h Schedule</span>
          </p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4 py-0.5">
              <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-bold text-white">
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12 select-none">
      
      {/* Top Header Bar with Back Navigation & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#262626] gap-3">
        <div className="flex items-center space-x-3">
          {onBackToConsole && (
            <button
              onClick={onBackToConsole}
              className="p-2 rounded-xl bg-[#212121] hover:bg-[#2a2a2a] text-slate-300 hover:text-white border border-[#333] transition-colors cursor-pointer"
              title="Return to Prompt Console"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {result.scenario_name || '24-Hour Dispatch Telemetry'}
              </h1>
              <Badge variant="success">OPTIMAL</Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Mathematical lowest-cost dispatch computed via Google OR-Tools (LP/GLOP)
            </p>
          </div>
        </div>

        {/* View Switcher & Export */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <div className="flex items-center p-1 rounded-xl bg-[#1c1c1c] border border-[#2e2e2e] text-xs">
            <button
              onClick={() => setActiveView('graphs')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeView === 'graphs' ? 'bg-[#292929] text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Graphs & Analytics</span>
            </button>

            <button
              onClick={() => setActiveView('table')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeView === 'table' ? 'bg-[#292929] text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5 text-amber-400" />
              <span>Schedule Matrix</span>
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#212121] hover:bg-[#2a2a2a] text-slate-200 border border-[#333] text-xs font-medium transition-colors cursor-pointer"
            title="Download CSV Schedule"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Validation Status Banner */}
      {isInvalid ? (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-sm">SCHEDULE STATUS: INVALID CONSTRAINTS</span>
            <p className="text-xs text-rose-200">
              The optimizer could not generate a valid schedule satisfying all power balance and reserve limits:
            </p>
            <ul className="list-disc pl-5 text-xs text-rose-200 space-y-0.5 font-mono">
              {result.validation_errors?.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-[#1c1c1c] border border-[#2e2e2e] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2.5 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong className="text-white">Strict Power Balance Verified:</strong> 24 hourly power flows balanced. End-of-day battery ({result.final_battery_kwh} kWh) fully recovered to starting energy ({result.initial_battery_kwh} kWh).
            </span>
          </div>
          <span className="font-mono text-emerald-400 font-semibold shrink-0">
            SOLVER: GLOP (OPTIMAL)
          </span>
        </div>
      )}

      {/* 4 Primary Metric KPI Cards in BDT (?) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Card 1: Total Optimized Bill */}
        <div className="p-4 rounded-2xl bg-[#1c1c1c] border border-[#2e2e2e] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>TOTAL OPTIMIZED BILL</span>
            <span className="text-sky-400 font-bold text-sm">?</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
              ?{costTotal.toFixed(2)}
            </span>
            <span className="text-xs font-mono text-slate-400">
              Base: ?{costBaseline.toFixed(2)}
            </span>
          </div>
          <div className="pt-2 border-t border-[#2a2a2a] flex items-center justify-between text-xs text-slate-400">
            <span>Currency:</span>
            <span className="text-slate-200 font-mono font-medium">BDT (?)</span>
          </div>
        </div>

        {/* Card 2: Net Bill Savings */}
        <div className="p-4 rounded-2xl bg-[#1c1c1c] border border-[#2e2e2e] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-medium">
            <span>NET BILL SAVINGS</span>
            <TrendingDown className="w-4 h-4" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400 tracking-tight">
              ?{costSavings.toFixed(2)}
            </span>
            <Badge variant="success">
              +{result.savings_pct.toFixed(1)}%
            </Badge>
          </div>
          <div className="pt-2 border-t border-[#2a2a2a] flex items-center justify-between text-xs text-slate-400">
            <span>Arbitrage:</span>
            <span className="text-emerald-400 font-mono font-medium">Active (LP)</span>
          </div>
        </div>

        {/* Card 3: Solar Generation Used */}
        <div className="p-4 rounded-2xl bg-[#1c1c1c] border border-[#2e2e2e] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-amber-400 text-xs font-medium">
            <span>SOLAR UTILIZATION</span>
            <Sun className="w-4 h-4" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
              {result.total_solar_used_kwh.toFixed(1)}{' '}
              <span className="text-sm font-normal text-slate-400">kWh</span>
            </span>
            <span className="text-xs font-mono text-amber-400">
              {result.solar_utilization_pct.toFixed(0)}% Used
            </span>
          </div>
          <div className="pt-2 border-t border-[#2a2a2a] flex items-center justify-between text-xs text-slate-400">
            <span>Curtailed:</span>
            <span className="text-slate-200 font-mono">{result.total_solar_curtailed_kwh.toFixed(1)} kWh</span>
          </div>
        </div>

        {/* Card 4: Battery Conservation Balance */}
        <div className="p-4 rounded-2xl bg-[#1c1c1c] border border-[#2e2e2e] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-medium">
            <span>BATTERY CYCLE BALANCE</span>
            <BatteryCharging className="w-4 h-4" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
              {result.final_battery_kwh.toFixed(1)}{' '}
              <span className="text-sm font-normal text-slate-400">kWh</span>
            </span>
            <Badge variant="success">
              CONSERVED
            </Badge>
          </div>
          <div className="pt-2 border-t border-[#2a2a2a] flex items-center justify-between text-xs text-slate-400">
            <span>Start: {result.initial_battery_kwh} kWh</span>
            <span className="text-slate-200 font-mono">End: {result.final_battery_kwh} kWh</span>
          </div>
        </div>

      </div>

      {/* Applied Directives Confirmation Card */}
      {result.directives_applied && result.directives_applied.length > 0 && (
        <div className="p-4 rounded-2xl bg-[#1c1c1c] border border-[#2e2e2e] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#2e2e2e]">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              Applied Gemini Operational Directives ({result.directives_applied.length})
            </h3>
            <span className="text-[11px] font-mono text-slate-400">ENFORCED IN LINEAR PROGRAM</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {result.directives_applied.map((dir, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-[#141414] border border-[#2a2a2a] flex items-start justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white font-mono">
                      {dir.directive_type.toUpperCase()}
                    </span>
                    <span className="text-slate-400 font-mono">
                      Hours: [{dir.hours?.join(', ') || 'All'}]
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    {dir.status_message || dir.notes || 'Enforced in linear program constraints.'}
                  </p>
                </div>

                <Badge variant={dir.applied ? "success" : "danger"}>
                  {dir.applied ? "ENFORCED" : "FAILED"}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONDITIONAL: VIEW 1 - INTERACTIVE GRAPHS */}
      {activeView === 'graphs' && (
        <div className="space-y-6">
          
          {/* Chart 1: 24h Energy Dispatch Power Balance */}
          <div className="p-5 rounded-2xl bg-[#1c1c1c] border border-[#2e2e2e] space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#2e2e2e] gap-2">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-400" />
                  24-Hour Power Flow & Energy Dispatch Balance
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Power Balance: Solar Used + Battery Discharge + Grid Import = Building Demand + Battery Charge.
                </p>
              </div>

              <span className="text-xs font-mono text-slate-400">
                Units: kWh / kW
              </span>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.chart.solar} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={COLORS.chart.solar} stopOpacity={0.02}/>
                    </linearGradient>
                    <linearGradient id="batGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.chart.battery} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={COLORS.chart.battery} stopOpacity={0.02}/>
                    </linearGradient>
                    <linearGradient id="gridGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.chart.grid} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={COLORS.chart.grid} stopOpacity={0.02}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                  <XAxis dataKey="hour" stroke="#888" tick={{ fontSize: 11, fill: '#888' }} />
                  <YAxis stroke="#888" tick={{ fontSize: 11, fill: '#888' }} unit=" kW" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  
                  <Area type="monotone" dataKey="solarUsed" name="Solar PV Used" unit=" kWh" stroke={COLORS.chart.solar} strokeWidth={1.5} fillOpacity={1} fill="url(#solarGrad)" />
                  <Area type="monotone" dataKey="batteryDischarge" name="Battery Discharge" unit=" kWh" stroke={COLORS.chart.battery} strokeWidth={1.5} fillOpacity={1} fill="url(#batGrad)" />
                  <Area type="monotone" dataKey="gridImport" name="Grid Import" unit=" kWh" stroke={COLORS.chart.grid} strokeWidth={1.5} fillOpacity={1} fill="url(#gridGrad)" />
                  <Line type="monotone" dataKey="demand" name="Building Demand" unit=" kWh" stroke={COLORS.chart.demand} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="batteryCharge" name="Battery Charging" unit=" kWh" stroke="#16A34A" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2 & 3: Side-by-Side (Battery SOC & Hourly Cost in BDT) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Battery SOC Trajectory */}
            <div className="p-5 rounded-2xl bg-[#1c1c1c] border border-[#2e2e2e] space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#2e2e2e]">
                <div>
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <BatteryCharging className="w-4 h-4 text-emerald-400" />
                    Battery State of Charge (SOC %) & Reserves
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Exact start/end conservation and reserve floor</p>
                </div>
                <Badge variant="success">Neutral Energy Cycle</Badge>
              </div>

              <div className="h-60 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="socGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.chart.battery} stopOpacity={0.4}/>
                        <stop offset="95%" stopColor={COLORS.chart.battery} stopOpacity={0.02}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                    <XAxis dataKey="hour" stroke="#888" tick={{ fontSize: 11, fill: '#888' }} />
                    <YAxis stroke="#888" domain={[0, 100]} tick={{ fontSize: 11, fill: '#888' }} unit="%" />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={15} stroke="#DC2626" strokeDasharray="3 3" label={{ value: "Reserve Buffer (15%)", fill: '#DC2626', fontSize: 10, position: 'insideTopLeft' }} />
                    <Area type="monotone" dataKey="batterySocPct" name="Battery SOC" unit="%" stroke={COLORS.chart.battery} strokeWidth={2} fillOpacity={1} fill="url(#socGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Hourly Cost in BDT vs Time-of-Use Tariff */}
            <div className="p-5 rounded-2xl bg-[#1c1c1c] border border-[#2e2e2e] space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#2e2e2e]">
                <div>
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <span className="text-sky-400 font-bold">?</span>
                    Hourly Electricity Cost & TOU Tariff
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Peak hour discharge cost reduction (BDT)</p>
                </div>
                <Badge variant="neutral">TOU Arbitrage</Badge>
              </div>

              <div className="h-60 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                    <XAxis dataKey="hour" stroke="#888" tick={{ fontSize: 11, fill: '#888' }} />
                    <YAxis stroke="#888" tick={{ fontSize: 11, fill: '#888' }} unit=" ?" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                    <Bar dataKey="hourlyCost" name="Net Cost (?)" unit=" ?" fill={COLORS.chart.demand} radius={[2, 2, 0, 0]} />
                    <Line type="monotone" dataKey="tariff" name="Tariff (?/kWh)" unit=" ?/kWh" stroke={COLORS.chart.tariff} strokeWidth={1.5} dot={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* CONDITIONAL: VIEW 2 - 24-HOUR DISPATCH MATRIX TABLE */}
      {activeView === 'table' && (
        <div className="rounded-2xl bg-[#1c1c1c] border border-[#2e2e2e] overflow-hidden shadow-2xl space-y-0">
          <div className="p-4 bg-[#141414] border-b border-[#2e2e2e] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">
                24-Hour SCADA Dispatch Schedule Matrix
              </h3>
              <p className="text-xs text-slate-400">All energy values in kWh, monetary costs in BDT (?)</p>
            </div>
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#212121] hover:bg-[#2a2a2a] text-slate-300 text-xs font-mono border border-[#333] cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-[#181818] border-b border-[#2e2e2e] text-slate-400 text-[11px] uppercase tracking-wider">
                  <th className="p-3">Hour</th>
                  <th className="p-3">Demand</th>
                  <th className="p-3 text-amber-400">Solar (Eff)</th>
                  <th className="p-3 text-emerald-400">Bat Chg</th>
                  <th className="p-3 text-emerald-400">Bat Dischg</th>
                  <th className="p-3 text-sky-400">Bat SOC</th>
                  <th className="p-3 text-rose-400">Grid Import</th>
                  <th className="p-3">Tariff (?)</th>
                  <th className="p-3 text-right">Cost (?)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626] text-slate-300">
                {result.hourly_schedule.map((row) => (
                  <tr key={row.hour} className="hover:bg-[#222] transition-colors">
                    <td className="p-3 font-bold text-white">{row.time_label}</td>
                    <td className="p-3">{row.load_kwh.toFixed(2)}</td>
                    <td className="p-3 text-amber-300">{row.solar_effective_kwh.toFixed(2)}</td>
                    <td className="p-3 text-emerald-400">{row.battery_charge_kwh > 0 ? `+${row.battery_charge_kwh.toFixed(2)}` : '0.00'}</td>
                    <td className="p-3 text-emerald-400">{row.battery_discharge_kwh > 0 ? `-${row.battery_discharge_kwh.toFixed(2)}` : '0.00'}</td>
                    <td className="p-3 text-sky-300">{row.battery_soc_pct.toFixed(0)}% ({row.battery_soc_kwh.toFixed(1)}kwh)</td>
                    <td className="p-3 text-rose-300">{row.grid_import_kwh.toFixed(2)}</td>
                    <td className="p-3 text-slate-400">?{(row.tariff_bdt_per_kwh || row.tariff_per_kwh).toFixed(2)}</td>
                    <td className="p-3 text-right font-bold text-white">?{(row.hourly_cost_bdt || row.hourly_cost).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
