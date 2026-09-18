import React from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend, ReferenceLine 
} from 'recharts';
import { 
  TrendingDown, Sun, Zap, 
  Layers, BatteryCharging, Cpu, CheckCircle2, AlertTriangle, ShieldCheck 
} from 'lucide-react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { COLORS } from '../lib/colors';

export default function ResultsDashboard({ result }) {
  if (!result || !result.hourly_schedule || result.hourly_schedule.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Cpu className="w-10 h-10 text-[#94A3B8] mx-auto mb-3" />
        <h3 className="text-[16px] font-semibold text-[#F9FAFB]">No Optimization Results</h3>
        <p className="text-[14px] text-[#94A3B8] mt-1 max-w-sm mx-auto">
          Execute the OR-Tools solver in the Operator Console to compute the 24-hour lowest-cost schedule.
        </p>
      </Card>
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
    isValid: item.is_valid ?? true,
    activeDirectives: item.active_directives || []
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 rounded-[8px] border border-[#374151] bg-[#111827] text-[12px] font-mono shadow-md space-y-1">
          <p className="font-semibold text-[#F9FAFB] border-b border-[#374151] pb-1 flex items-center justify-between gap-4">
            <span>Hour: {label}</span>
            <span className="text-[#94A3B8] font-normal">24h Schedule</span>
          </p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4 py-0.5">
              <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-bold text-[#F9FAFB]">
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
      
      {/* Validation Status Banner */}
      {isInvalid ? (
        <div className="p-4 rounded-[10px] bg-[#DC2626]/15 border border-[#DC2626]/40 text-[#F87171] flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-[14px]">SCHEDULE STATUS: INVALID</span>
              <Badge variant="danger">VALIDATION FAILED</Badge>
            </div>
            <p className="text-[13px] text-[#FCA5A5]">
              The optimizer could not generate a valid schedule satisfying all constraints:
            </p>
            <ul className="list-disc pl-5 text-[12px] text-[#FCA5A5] space-y-0.5 font-mono">
              {result.validation_errors?.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-[10px] bg-[#0B1220] border border-[#374151] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px]">
          <div className="flex items-center space-x-2.5 text-[#CBD5E1]">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
            <span>
              <strong className="text-[#F9FAFB]">Constraint Check:</strong> All 24 hourly power balances verified. Initial battery ({result.initial_battery_kwh} kWh) == Final battery ({result.final_battery_kwh} kWh).
            </span>
          </div>
          <Badge variant="success" className="shrink-0 self-start sm:self-auto">
            {result.solver_status || 'OPTIMAL'}
          </Badge>
        </div>
      )}

      {/* 4 Primary Metric Cards in BDT (৳) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Optimized Bill */}
        <Card className="p-4">
          <div className="flex items-center justify-between text-[#94A3B8] text-[12px] font-medium">
            <span>TOTAL OPTIMIZED BILL</span>
            <span className="text-[#2563EB] font-bold text-[14px]">৳</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-[28px] font-bold font-mono text-[#F9FAFB] tracking-tight">
              ৳{costTotal.toFixed(2)}
            </span>
            <div className="text-right text-[12px] font-mono text-[#94A3B8]">
              <span>Base: ৳{costBaseline.toFixed(2)}</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#374151] flex items-center justify-between text-[12px]">
            <span className="text-[#94A3B8]">Currency:</span>
            <span className="text-[#F9FAFB] font-mono font-medium">BDT (৳)</span>
          </div>
        </Card>

        {/* Card 2: Cost Savings */}
        <Card className="p-4">
          <div className="flex items-center justify-between text-[#16A34A] text-[12px] font-medium">
            <span>NET BILL SAVINGS</span>
            <TrendingDown className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-[28px] font-bold font-mono text-[#16A34A] tracking-tight">
              ৳{costSavings.toFixed(2)}
            </span>
            <Badge variant="success">
              +{result.savings_pct.toFixed(1)}%
            </Badge>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#374151] flex items-center justify-between text-[12px]">
            <span className="text-[#94A3B8]">Arbitrage:</span>
            <span className="text-[#16A34A] font-mono font-medium">Active (LP)</span>
          </div>
        </Card>

        {/* Card 3: Solar Generation */}
        <Card className="p-4">
          <div className="flex items-center justify-between text-[#EAB308] text-[12px] font-medium">
            <span>SOLAR GENERATION USED</span>
            <Sun className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-[28px] font-bold font-mono text-[#F9FAFB] tracking-tight">
              {result.total_solar_used_kwh.toFixed(1)}{' '}
              <span className="text-[14px] font-normal text-[#94A3B8]">kWh</span>
            </span>
            <span className="text-[12px] font-mono text-[#EAB308]">
              {result.solar_utilization_pct.toFixed(0)}% Used
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#374151] flex items-center justify-between text-[12px]">
            <span className="text-[#94A3B8]">Curtailed:</span>
            <span className="text-[#F9FAFB] font-mono">{result.total_solar_curtailed_kwh.toFixed(1)} kWh</span>
          </div>
        </Card>

        {/* Card 4: Battery Balance Status */}
        <Card className="p-4">
          <div className="flex items-center justify-between text-[#22C55E] text-[12px] font-medium">
            <span>BATTERY ENERGY BALANCE</span>
            <BatteryCharging className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-[28px] font-bold font-mono text-[#F9FAFB] tracking-tight">
              {result.final_battery_kwh.toFixed(1)}{' '}
              <span className="text-[14px] font-normal text-[#94A3B8]">kWh</span>
            </span>
            <Badge variant="success">
              CONSERVED
            </Badge>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#374151] flex items-center justify-between text-[12px]">
            <span className="text-[#94A3B8]">Start: {result.initial_battery_kwh} kWh</span>
            <span className="text-[#F9FAFB] font-mono">End: {result.final_battery_kwh} kWh</span>
          </div>
        </Card>

      </div>

      {/* Applied Directives Confirmation Card */}
      {result.directives_applied && result.directives_applied.length > 0 && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#374151]">
            <h3 className="text-[14px] font-semibold text-[#F9FAFB] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
              Applied Operational Directives Confirmation ({result.directives_applied.length})
            </h3>
            <span className="text-[11px] font-mono text-[#94A3B8]">STATUS: ENFORCED IN SOLVER</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {result.directives_applied.map((dir, i) => (
              <div
                key={i}
                className="p-2.5 rounded-[8px] bg-[#0B1220] border border-[#374151] flex items-start justify-between gap-2 text-[12px]"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-[#F9FAFB] font-mono">
                      {dir.directive_type.toUpperCase()}
                    </span>
                    <span className="text-[#94A3B8] font-mono">
                      Hours: [{dir.hours?.join(', ') || 'All'}]
                    </span>
                  </div>
                  <p className="text-[11px] text-[#CBD5E1]">
                    {dir.status_message || dir.notes || 'Enforced in linear program constraints.'}
                  </p>
                </div>

                <Badge variant={dir.applied ? "success" : "danger"}>
                  {dir.applied ? "ENFORCED" : "FAILED"}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Chart 1: 24h Energy Dispatch Power Balance */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#374151] gap-2">
          <div>
            <h3 className="text-[16px] font-semibold text-[#F9FAFB] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#2563EB]" />
              24-Hour Power Flow & Energy Dispatch Balance
            </h3>
            <p className="text-[12px] text-[#94A3B8] mt-0.5">
              Power Balance: Solar Used + Battery Discharge + Grid Import = Building Demand + Battery Charge.
            </p>
          </div>

          <span className="text-[12px] font-mono text-[#94A3B8]">
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
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
              <XAxis dataKey="hour" stroke="#94A3B8" tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <YAxis stroke="#94A3B8" tick={{ fontSize: 11, fill: '#94A3B8' }} unit=" kW" />
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
      </Card>

      {/* Chart 2 & 3: Side-by-Side (Battery SOC & Hourly Cost in BDT) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Battery SOC Trajectory */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#374151]">
            <div>
              <h3 className="text-[16px] font-semibold text-[#F9FAFB] flex items-center gap-2">
                <BatteryCharging className="w-4 h-4 text-[#22C55E]" />
                Battery State of Charge (SOC %) & Reserves
              </h3>
              <p className="text-[12px] text-[#94A3B8] mt-0.5">Exact start/end conservation and reserve floor</p>
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
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                <XAxis dataKey="hour" stroke="#94A3B8" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis stroke="#94A3B8" domain={[0, 100]} tick={{ fontSize: 11, fill: '#94A3B8' }} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={15} stroke="#DC2626" strokeDasharray="3 3" label={{ value: "Reserve Buffer (15%)", fill: '#DC2626', fontSize: 10, position: 'insideTopLeft' }} />
                <Area type="monotone" dataKey="batterySocPct" name="Battery SOC" unit="%" stroke={COLORS.chart.battery} strokeWidth={2} fillOpacity={1} fill="url(#socGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Hourly Cost in BDT vs Time-of-Use Tariff */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#374151]">
            <div>
              <h3 className="text-[16px] font-semibold text-[#F9FAFB] flex items-center gap-2">
                <span className="text-[#2563EB] font-bold">৳</span>
                Hourly Electricity Cost & TOU Tariff
              </h3>
              <p className="text-[12px] text-[#94A3B8] mt-0.5">Peak hour discharge cost reduction (BDT)</p>
            </div>
            <Badge variant="neutral">TOU Arbitrage</Badge>
          </div>

          <div className="h-60 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                <XAxis dataKey="hour" stroke="#94A3B8" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis stroke="#94A3B8" tick={{ fontSize: 11, fill: '#94A3B8' }} unit=" ৳" />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar dataKey="hourlyCost" name="Net Cost (৳)" unit=" ৳" fill={COLORS.chart.demand} radius={[2, 2, 0, 0]} />
                <Line type="monotone" dataKey="tariff" name="Tariff (৳/kWh)" unit=" ৳/kWh" stroke={COLORS.chart.tariff} strokeWidth={1.5} dot={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

      </div>

    </div>
  );
}