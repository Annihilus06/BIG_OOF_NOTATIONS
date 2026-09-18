import React, { useState } from 'react';
import { Download, Table, Search } from 'lucide-react';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Input } from './ui/Input';

export default function ScheduleTable({ result }) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!result || !result.hourly_schedule || result.hourly_schedule.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Table className="w-10 h-10 text-[#94A3B8] mx-auto mb-3" />
        <h3 className="text-[16px] font-semibold text-[#F9FAFB]">No Dispatch Data Available</h3>
        <p className="text-[14px] text-[#94A3B8] mt-1">Execute solver in Operator Console to generate hourly dispatch.</p>
      </Card>
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
    <Card className="space-y-4">
      {/* Table Header & Controls */}
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-semibold text-[#F9FAFB] flex items-center gap-2">
            <Table className="w-4 h-4 text-[#2563EB]" />
            24-Hour Energy Dispatch Schedule Matrix
          </h2>
          <p className="text-[12px] text-[#94A3B8] mt-0.5">
            Optimal hour-by-hour power allocation, battery states, and cost breakdown.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="w-48 sm:w-64">
            <Input
              type="text"
              placeholder="Filter by time or directive..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="py-1.5 text-[12px]"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </Button>
        </div>
      </CardHeader>

      {/* Enterprise Table */}
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] font-mono">
            <thead className="sticky top-0 bg-[#0B1220] text-[#94A3B8] uppercase text-[11px] font-semibold tracking-wider border-b border-[#374151]">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-3 py-3 text-right">Demand</th>
                <th className="px-3 py-3 text-right text-[#EAB308]">Solar (Avail/Used)</th>
                <th className="px-3 py-3 text-right text-[#22C55E]">Battery (Chg/Dis)</th>
                <th className="px-3 py-3 text-right text-[#60A5FA]">SOC (%)</th>
                <th className="px-3 py-3 text-right text-[#F87171]">Grid Import</th>
                <th className="px-3 py-3 text-right text-[#94A3B8]">Tariff</th>
                <th className="px-3 py-3 text-right">Cost ($)</th>
                <th className="px-4 py-3">Directives</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937]">
              {filtered.map((row, index) => {
                const isEven = index % 2 === 0;
                const hasDirectives = row.active_directives && row.active_directives.length > 0;
                return (
                  <tr
                    key={row.hour}
                    className={`transition-colors hover:bg-[#1F2937]/60 ${
                      isEven ? 'bg-[#111827]' : 'bg-[#0E1524]'
                    } ${hasDirectives ? 'bg-[#1E293B]/40' : ''}`}
                  >
                    <td className="px-4 py-2.5 font-bold text-[#F9FAFB]">
                      {row.time_label}
                    </td>

                    <td className="px-3 py-2.5 text-right text-[#CBD5E1]">
                      {row.load_kwh.toFixed(1)} kW
                    </td>

                    <td className="px-3 py-2.5 text-right text-[#FDE047]">
                      {row.solar_available_kwh.toFixed(1)} / <span className="font-bold text-[#EAB308]">{row.solar_used_kwh.toFixed(1)}</span>
                    </td>

                    <td className="px-3 py-2.5 text-right">
                      {row.battery_charge_kwh > 0 ? (
                        <span className="text-[#22C55E] font-semibold">+{row.battery_charge_kwh.toFixed(1)} kW</span>
                      ) : row.battery_discharge_kwh > 0 ? (
                        <span className="text-[#60A5FA] font-semibold">-{row.battery_discharge_kwh.toFixed(1)} kW</span>
                      ) : (
                        <span className="text-[#64748B]">0.0</span>
                      )}
                    </td>

                    <td className="px-3 py-2.5 text-right">
                      <span className="font-semibold text-[#F9FAFB]">{row.battery_soc_pct.toFixed(0)}%</span>
                      <span className="text-[10px] text-[#94A3B8] block">({row.battery_soc_kwh.toFixed(1)} kWh)</span>
                    </td>

                    <td className="px-3 py-2.5 text-right">
                      {row.grid_import_kwh > 0 ? (
                        <span className="text-[#F87171] font-semibold">{row.grid_import_kwh.toFixed(1)} kW</span>
                      ) : (
                        <span className="text-[#64748B]">0.0</span>
                      )}
                    </td>

                    <td className="px-3 py-2.5 text-right text-[#94A3B8]">
                      ${row.tariff_per_kwh.toFixed(2)}
                    </td>

                    <td className="px-3 py-2.5 text-right font-bold text-[#F9FAFB]">
                      ${row.hourly_cost.toFixed(3)}
                    </td>

                    <td className="px-4 py-2.5">
                      {hasDirectives ? (
                        <div className="flex flex-wrap gap-1 font-sans">
                          {row.active_directives.map((dir, i) => (
                            <Badge key={i} variant="primary">
                              {dir}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[#64748B] text-[11px]">Nominal</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}