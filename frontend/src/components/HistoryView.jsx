import React from 'react';
import { History, ArrowRight, DollarSign, TrendingDown, Clock, Zap, CheckCircle2 } from 'lucide-react';

export default function HistoryView({ historyList, onSelectHistoryItem }) {
  if (!historyList || historyList.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800 bg-slate-900/60">
        <History className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white">No Previous Optimization History</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Every optimization run and operator directive schedule is saved automatically to Supabase and local cache.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 bg-slate-900/80 shadow-xl space-y-4">
      <div className="pb-3 border-b border-slate-800">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <History className="w-5 h-5 text-cyan-400" />
          Optimization Run History & Saved Records
        </h2>
        <p className="text-xs text-slate-400">
          Review previous energy scenarios, operator directives, and cost performance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {historyList.map((item, index) => {
          const dateStr = item.created_at ? new Date(item.created_at).toLocaleString() : 'Recent';
          return (
            <div
              key={item.id || index}
              className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-cyan-500/50 transition space-y-3 relative group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition">
                    {item.scenario_name || '24h Energy Optimization'}
                  </h4>
                  <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{dateStr}</span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  +{Number(item.savings_pct || 0).toFixed(1)}% Saved
                </span>
              </div>

              {/* Operator prompt if any */}
              {item.raw_prompt && (
                <p className="text-xs text-slate-300 bg-slate-900/80 p-2 rounded-lg border border-slate-800 italic line-clamp-2">
                  "{item.raw_prompt}"
                </p>
              )}

              {/* Metric stats */}
              <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-slate-800/80">
                <div>
                  <span className="text-[10px] text-slate-500 block">Total Bill</span>
                  <span className="font-bold text-white">${Number(item.total_cost || 0).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Solar Used</span>
                  <span className="font-bold text-amber-400">{Number(item.total_solar_used_kwh || 0).toFixed(1)} kWh</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Grid Import</span>
                  <span className="font-bold text-rose-400">{Number(item.total_grid_imported_kwh || 0).toFixed(1)} kWh</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {item.directives_count || (item.directives_applied ? item.directives_applied.length : 0)} Directive(s)
                </span>

                <button
                  type="button"
                  onClick={() => onSelectHistoryItem(item)}
                  className="flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 transition"
                >
                  <span>Load Dashboard</span>
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
