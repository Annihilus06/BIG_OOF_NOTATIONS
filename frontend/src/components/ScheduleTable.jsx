import React, { useState } from 'react';
import { Download, Table, Filter, Clock, Zap, Sun, Battery, FileText } from 'lucide-react';

export default function ScheduleTable({ result }) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!result || !result.hourly_schedule || result.hourly_schedule.length === 0) {
    return (
      <div className="bg-[#0f1422] border border-[#1e273c] rounded-xl p-12 text-center">
        <Table className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-white font-mono">NO DISPATCH DATA</h3>
        <p className="text-xs text-slate-400 mt-1">Execute solver in Operator Terminal to generate hourly telemetry.</p>
      </div>
    );
  }

  const exportCSV = () => {
    const headers = [
      'Hour',
      'Demand_kWh',
      'Solar_Avail_kWh',
      'Solar_Used_kWh',
      'Solar_Curtailed_kWh',
      'Battery_Charge_kWh',
      'Battery_Discharge_kWh',
      'Battery_SOC_kWh',
      'Battery_SOC_Pct',
      'Grid_Import_kWh',
      'Grid_Export_kWh',
      'Tariff_USD_kWh',
      'Hourly_Cost_USD',
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
    link.setAttribute('download', `gridwise_dispatch_${result.scenario_name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = result.hourly_schedule.filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.time_label.toLowerCase().includes(term) ||
      (item.active_directives && item.active_directives.some(d => d.toLowerCase().includes(term)))
    );
  });

  return (
    <div className="bg-[#0f1422] border border-[#1e273c] rounded-xl p-5 shadow-sm space-y-4">
      
      {/* Table Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#1b2336] gap-3">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
            <Table className="w-4 h-4 text-sky-400" />
            24-HOUR ENERGY DISPATCH MATRIX (SCADA SCHEDULE)
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Optimal hour-by-hour power allocation, battery states, and cost breakdown.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Search hour or constraint..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-2.5 py-1.5 bg-[#090c14] rounded-md border border-[#222c42] text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500"
          />

          <button
            onClick={exportCSV}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#172238] hover:bg-[#202f4e] text-sky-300 border border-[#26375c] transition font-mono"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT CSV</span>
          </button>
        </div>
      </div>

      {/* High Density Table */}
      <div className="overflow-x-auto rounded-lg border border-[#1b2336]">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#0a0d16] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#1b2336]">
            <tr>
              <th className="px-3 py-2.5">TIME</th>
              <th className="px-3 py-2.5 text-right">DEMAND</th>
              <th className="px-3 py-2.5 text-right text-amber-400">SOLAR (AV/USE)</th>
              <th className="px-3 py-2.5 text-right text-emerald-400">BATT (CHG/DIS)</th>
              <th className="px-3 py-2.5 text-right text-sky-400">SOC (%)</th>
              <th className="px-3 py-2.5 text-right text-rose-400">GRID IMPORT</th>
              <th className="px-3 py-2.5 text-right">TARIFF</th>
              <th className="px-3 py-2.5 text-right">COST ($)</th>
              <th className="px-3 py-2.5">CONSTRAINTS / DIRECTIVES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#172033] bg-[#0c101a]">
            {filtered.map((row) => {
              const hasDirectives = row.active_directives && row.active_directives.length > 0;
              return (
                <tr
                  key={row.hour}
                  className={`hover:bg-[#131b2e] transition ${hasDirectives ? 'bg-[#101729]' : ''}`}
                >
                  <td className="px-3 py-2 font-bold text-white">
                    {row.time_label}
                  </td>

                  <td className="px-3 py-2 text-right text-slate-300">
                    {row.load_kwh.toFixed(1)} kW
                  </td>

                  <td className="px-3 py-2 text-right text-amber-300">
                    {row.solar_available_kwh.toFixed(1)} / <span className="font-bold text-amber-400">{row.solar_used_kwh.toFixed(1)}</span>
                  </td>

                  <td className="px-3 py-2 text-right">
                    {row.battery_charge_kwh > 0 ? (
                      <span className="text-emerald-400 font-bold">+{row.battery_charge_kwh.toFixed(1)} kW</span>
                    ) : row.battery_discharge_kwh > 0 ? (
                      <span className="text-sky-400 font-bold">-{row.battery_discharge_kwh.toFixed(1)} kW</span>
                    ) : (
                      <span className="text-slate-600">0.0</span>
                    )}
                  </td>

                  <td className="px-3 py-2 text-right">
                    <span className="font-bold text-white">{row.battery_soc_pct.toFixed(0)}%</span>
                    <span className="text-[10px] text-slate-500 block">({row.battery_soc_kwh.toFixed(1)} kWh)</span>
                  </td>

                  <td className="px-3 py-2 text-right">
                    {row.grid_import_kwh > 0 ? (
                      <span className="text-rose-400 font-bold">{row.grid_import_kwh.toFixed(1)} kW</span>
                    ) : (
                      <span className="text-slate-600">0.0</span>
                    )}
                  </td>

                  <td className="px-3 py-2 text-right text-slate-400">
                    ${row.tariff_per_kwh.toFixed(2)}
                  </td>

                  <td className="px-3 py-2 text-right font-bold text-white">
                    ${row.hourly_cost.toFixed(3)}
                  </td>

                  <td className="px-3 py-2">
                    {hasDirectives ? (
                      <div className="flex flex-wrap gap-1 font-sans">
                        {row.active_directives.map((dir, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#162238] text-sky-300 border border-[#233557]"
                          >
                            {dir}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-600 text-[10px]">NOMINAL</span>
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
