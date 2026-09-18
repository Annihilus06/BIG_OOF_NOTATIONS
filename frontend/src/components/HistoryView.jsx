import React from 'react';
import { History, ArrowRight, Clock, Database, CheckCircle2, Cpu } from 'lucide-react';

export default function HistoryView({ historyList, onSelectHistoryItem }) {
  if (!historyList || historyList.length === 0) {
    return (
      <div className="bg-[#0f1422] border border-[#1e273c] rounded-xl p-12 text-center">
        <History className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-white font-mono">NO OPTIMIZATION AUDIT LOGS</h3>
        <p className="text-xs text-slate-400 mt-1">Every solver run and applied directive schedule is persisted to database.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0f1422] border border-[#1e273c] rounded-xl p-5 shadow-sm space-y-4">
      <div className="pb-3 border-b border-[#1b2336] flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
            <History className="w-4 h-4 text-sky-400" />
            OPTIMIZATION AUDIT LOG & HISTORICAL RUNS
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Compare directive configurations and historical cost performance.
          </p>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#162035] text-slate-300 border border-[#253659]">
          RECORDS: {historyList.length}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {historyList.map((item, index) => {
          const dateStr = item.created_at ? new Date(item.created_at).toLocaleString() : 'Recent';
          return (
            <div
              key={item.id || index}
              className="p-4 rounded-lg border border-[#1d263b] bg-[#0a0d16] hover:border-sky-500/50 transition space-y-2.5 font-mono"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white font-sans">
                    {item.scenario_name || '24h Dispatch Optimization'}
                  </h4>
                  <div className="flex items-center space-x-2 text-[10px] text-slate-500 mt-0.5">
                    <Clock className="w-3 h-3 text-slate-600" />
                    <span>{dateStr}</span>
                  </div>
                </div>

                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                  +{Number(item.savings_pct || 0).toFixed(1)}% SAVED
                </span>
              </div>

              {item.raw_prompt && (
                <p className="text-[11px] text-slate-300 bg-[#0f1422] p-2 rounded border border-[#1b2336] font-sans italic line-clamp-2">
                  "{item.raw_prompt}"
                </p>
              )}

              <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-[#182133]">
                <div>
                  <span className="text-[10px] text-slate-500 block">TOTAL COST</span>
                  <span className="font-bold text-white">${Number(item.total_cost || 0).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">SOLAR USE</span>
                  <span className="font-bold text-amber-400">{Number(item.total_solar_used_kwh || 0).toFixed(1)} kWh</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">GRID IN</span>
                  <span className="font-bold text-rose-400">{Number(item.total_grid_imported_kwh || 0).toFixed(1)} kWh</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">
                  STATUS: {item.solver_status || 'OPTIMAL'}
                </span>

                <button
                  type="button"
                  onClick={() => onSelectHistoryItem(item)}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded bg-[#172238] hover:bg-[#202f4e] text-sky-300 border border-[#26375c] text-[11px] transition"
                >
                  <span>LOAD TELEMETRY</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
