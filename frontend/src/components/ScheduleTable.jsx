import React, { useState } from 'react';
import { Download, Table, Filter, Clock, Zap, Sun, Battery } from 'lucide-react';

export default function ScheduleTable({ result }) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!result || !result.hourly_schedule || result.hourly_schedule.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800 bg-slate-900/60">
        <Table className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white">No Schedule Data Available</h3>
        <p className="text-xs text-slate-400 mt-1">Run an optimization in the Optimizer tab to see the 24-hour schedule.</p>
      </div>
    );
  }

  const exportCSV = () => {
    const headers = [
      'Hour',
      'Demand (kWh)',
      'Solar Available (kWh)',
      'Solar Used (kWh)',
      'Solar Curtailed (kWh)',
      'Battery Charge (kWh)',
      'Battery Discharge (kWh)',
      'Battery SOC (kWh)',
      'Battery SOC (%)',
      'Grid Import (kWh)',
      'Grid Export (kWh)',
      'Tariff ($/kWh)',
      'Hourly Cost ($)',
      'Directives'
    ];

    const rows = result.hourly_schedule.map(item => [
      item.time_label,
      item.load_kwh,
      item.solar_available_kwh,
      item.solar_used_kwh,
      item.solar_curtailed_kwh,
      item.battery_charge_kwh,
      item.battery_discharge_kwh,
      item.battery_soc_kwh,
      item.battery_soc_pct,
      item.grid_import_kwh,
      item.grid_export_kwh,
      item.tariff_per_kwh,
      item.hourly_cost,
      `"${(item.active_directives || []).join('; ')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gridwise_schedule_${result.scenario_name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredSchedule = result.hourly_schedule.filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.time_label.toLowerCase().includes(term) ||
      (item.active_directives && item.active_directives.some(d => d.toLowerCase().includes(term)))
    );
  });

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 bg-slate-900/80 shadow-xl space-y-4">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Table className="w-5 h-5 text-cyan-400" />
            24-Hour Mathematical Dispatch Table
          </h2>
          <p className="text-xs text-slate-400">
            Optimal hour-by-hour power allocation, battery states, and cost breakdown.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Filter by time or directive..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 rounded-lg border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />

          <button
            onClick={exportCSV}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
            <tr>
              <th className="px-3 py-2.5">Time</th>
              <th className="px-3 py-2.5 text-right">Demand</th>
              <th className="px-3 py-2.5 text-right text-amber-400">Solar (Avail / Used)</th>
              <th className="px-3 py-2.5 text-right text-emerald-400">Battery (Chg / Dischg)</th>
              <th className="px-3 py-2.5 text-right text-cyan-400">SOC (%)</th>
              <th className="px-3 py-2.5 text-right text-rose-400">Grid Import</th>
              <th className="px-3 py-2.5 text-right">Tariff</th>
              <th className="px-3 py-2.5 text-right">Cost</th>
              <th className="px-3 py-2.5">Active Directives</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
            {filteredSchedule.map((row) => {
              const hasDirectives = row.active_directives && row.active_directives.length > 0;
              return (
                <tr
                  key={row.hour}
                  className={`hover:bg-slate-800/40 transition ${hasDirectives ? 'bg-cyan-950/20' : ''}`}
                >
                  <td className="px-3 py-2 font-mono font-bold text-slate-200">
                    {row.time_label}
                  </td>

                  <td className="px-3 py-2 text-right font-mono text-slate-300">
                    {row.load_kwh.toFixed(1)} kWh
                  </td>

                  <td className="px-3 py-2 text-right font-mono text-amber-300/90">
                    {row.solar_available_kwh.toFixed(1)} / <span className="font-bold text-amber-400">{row.solar_used_kwh.toFixed(1)}</span>
                  </td>

                  <td className="px-3 py-2 text-right font-mono">
                    {row.battery_charge_kwh > 0 ? (
                      <span className="text-emerald-400 font-bold">+{row.battery_charge_kwh.toFixed(1)}</span>
                    ) : row.battery_discharge_kwh > 0 ? (
                      <span className="text-cyan-400 font-bold">-{row.battery_discharge_kwh.toFixed(1)}</span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>

                  <td className="px-3 py-2 text-right font-mono">
                    <span className="font-bold text-white">{row.battery_soc_pct.toFixed(0)}%</span>
                    <span className="text-[10px] text-slate-500 block">({row.battery_soc_kwh.toFixed(1)} kWh)</span>
                  </td>

                  <td className="px-3 py-2 text-right font-mono">
                    {row.grid_import_kwh > 0 ? (
                      <span className="text-rose-400 font-bold">{row.grid_import_kwh.toFixed(1)} kWh</span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>

                  <td className="px-3 py-2 text-right font-mono text-slate-400">
                    ${row.tariff_per_kwh.toFixed(2)}
                  </td>

                  <td className="px-3 py-2 text-right font-mono font-bold text-white">
                    ${row.hourly_cost.toFixed(3)}
                  </td>

                  <td className="px-3 py-2">
                    {hasDirectives ? (
                      <div className="flex flex-wrap gap-1">
                        {row.active_directives.map((dir, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800/80"
                          >
                            {dir}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-600 text-[10px]">Standard</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
