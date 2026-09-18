import React from 'react';
import { History, ArrowRight, Clock } from 'lucide-react';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

export default function HistoryView({ historyList, onSelectHistoryItem }) {
  if (!historyList || historyList.length === 0) {
    return (
      <Card className="p-12 text-center">
        <History className="w-10 h-10 text-[#94A3B8] mx-auto mb-3" />
        <h3 className="text-[16px] font-semibold text-[#F9FAFB]">No Historical Optimization Logs</h3>
        <p className="text-[14px] text-[#94A3B8] mt-1">Every solver run and applied directive schedule is persisted to database.</p>
      </Card>
    );
  }

  return (
    <Card className="space-y-4">
      <CardHeader className="flex items-center justify-between">
        <div>
          <h2 className="text-[16px] font-semibold text-[#F9FAFB] flex items-center gap-2">
            <History className="w-4 h-4 text-[#2563EB]" />
            Optimization Audit Log & History (BDT ৳)
          </h2>
          <p className="text-[12px] text-[#94A3B8] mt-0.5">
            Previous energy dispatch runs saved in PostgreSQL database.
          </p>
        </div>
        <Badge variant="neutral">
          {historyList.length} Records
        </Badge>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {historyList.map((item, index) => {
            const dateStr = item.created_at ? new Date(item.created_at).toLocaleString() : 'Recent';
            const costVal = item.total_cost_bdt ?? item.total_cost ?? 0;
            return (
              <div
                key={item.id || index}
                className="p-4 rounded-[8px] border border-[#374151] bg-[#0B1220] hover:border-[#2563EB]/60 transition-colors space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-[14px] font-semibold text-[#F9FAFB]">
                      {item.scenario_name || '24h Dispatch Optimization'}
                    </h4>
                    <div className="flex items-center space-x-1.5 text-[11px] text-[#94A3B8] mt-0.5 font-mono">
                      <Clock className="w-3 h-3 text-[#94A3B8]" />
                      <span>{dateStr}</span>
                    </div>
                  </div>

                  <Badge variant="success">
                    +{Number(item.savings_pct || 0).toFixed(1)}% Saved
                  </Badge>
                </div>

                {item.raw_prompt && (
                  <p className="text-[12px] text-[#CBD5E1] bg-[#111827] p-2.5 rounded-[6px] border border-[#374151] italic line-clamp-2">
                    "{item.raw_prompt}"
                  </p>
                )}

                <div className="grid grid-cols-3 gap-2 text-[12px] font-mono pt-2 border-t border-[#374151]">
                  <div>
                    <span className="text-[10px] text-[#94A3B8] block uppercase">Cost</span>
                    <span className="font-bold text-[#F9FAFB]">৳{Number(costVal).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#94A3B8] block uppercase">Solar</span>
                    <span className="font-bold text-[#EAB308]">{Number(item.total_solar_used_kwh || 0).toFixed(1)} kWh</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#94A3B8] block uppercase">Grid</span>
                    <span className="font-bold text-[#F87171]">{Number(item.total_grid_imported_kwh || 0).toFixed(1)} kWh</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[#94A3B8]">
                    Status: {item.solver_status || 'OPTIMAL'}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSelectHistoryItem(item)}
                  >
                    <span>Load Telemetry</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}