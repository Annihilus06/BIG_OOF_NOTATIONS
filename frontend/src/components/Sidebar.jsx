import React from 'react';
import { 
  Plus, ChevronLeft, Zap, Clock, Trash2 
} from 'lucide-react';

export default function Sidebar({
  isOpen,
  setIsOpen,
  activeTab,
  setActiveTab,
  onNewOptimization,
  scenario,
  setScenario,
  presetScenarios,
  historyList,
  onSelectHistoryItem,
  onClearHistory,
  backendStatus
}) {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#171717] border-r border-[#262626] text-[#ececec]
        transition-all duration-200 ease-in-out select-none
        ${isOpen ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:border-none lg:overflow-hidden'}
      `}>
        {/* Top Header - Click to redirect to homepage */}
        <div className="flex items-center justify-between p-3.5 border-b border-[#262626]">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNewOptimization();
            }}
            className="flex items-center space-x-2.5 hover:opacity-90 transition-opacity cursor-pointer group"
            title="Go to GridWise AI Homepage"
          >
            <div className="w-7 h-7 rounded-lg bg-[#2563EB] group-hover:bg-[#1d4ed8] flex items-center justify-center text-white font-bold text-xs shadow-xs transition-colors">
              GW
            </div>
            <div>
              <div className="font-semibold text-sm text-white tracking-tight flex items-center gap-1.5">
                <span>GridWise AI</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#262626] text-slate-300">v1.0</span>
              </div>
            </div>
          </a>

          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-[#262626] transition-colors cursor-pointer"
            title="Collapse Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Action: + New Optimization Button - Click to reset and go to homepage */}
        <div className="p-3">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNewOptimization();
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#212121] hover:bg-[#2f2f2f] text-white text-xs font-medium border border-[#2f2f2f] hover:border-[#404040] transition-all cursor-pointer shadow-xs group"
            title="Start New Optimization"
          >
            <div className="flex items-center space-x-2">
              <Plus className="w-4 h-4 text-sky-400 group-hover:rotate-90 transition-transform duration-200" />
              <span>New optimization</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Ctrl+K</span>
          </a>
        </div>

        {/* Scrollable Presets & History */}
        <div className="flex-1 overflow-y-auto px-3 space-y-4 text-xs">
          
          {/* Preset Grid Scenarios */}
          <div className="space-y-1">
            <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Scenarios
            </div>

            {Object.entries(presetScenarios).map(([key, item]) => {
              const isSelected = scenario.name === item.name;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setScenario(item);
                    setActiveTab('optimizer');
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg transition-colors cursor-pointer truncate flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#212121] text-sky-300 border border-sky-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-[#212121]'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Previous Runs History (Only real runs, no demo data) */}
          {historyList && historyList.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-[#262626]">
              <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Recent Runs</span>
                {onClearHistory && (
                  <button 
                    onClick={onClearHistory}
                    className="text-slate-400 hover:text-rose-400 p-0.5"
                    title="Clear History"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="space-y-0.5">
                {historyList.slice(0, 10).map((hist, idx) => (
                  <button
                    key={hist.id || idx}
                    onClick={() => {
                      onSelectHistoryItem(hist);
                      setActiveTab('dashboard');
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#212121] transition-colors cursor-pointer truncate flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <Clock className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-400 shrink-0" />
                      <span className="truncate text-[11px] text-slate-300 group-hover:text-white">
                        {hist.scenario_name || 'Optimization Run'}
                      </span>
                    </div>
                    {hist.savings_pct !== undefined && (
                      <span className="text-[10px] font-mono text-emerald-400 shrink-0">
                        +{hist.savings_pct}%
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Minimalist Bottom Status */}
        <div className="p-3 border-t border-[#262626] bg-[#141414] flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-mono">Engine Status</span>
          <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-[#1c1c1c] border border-[#2a2a2a] text-[10px] font-mono">
            <span className={`w-1.5 h-1.5 rounded-full ${backendStatus === 'healthy' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className="text-slate-300">{backendStatus === 'healthy' ? 'OR-Tools Live' : 'Simulation'}</span>
          </div>
        </div>

      </aside>
    </>
  );
}
