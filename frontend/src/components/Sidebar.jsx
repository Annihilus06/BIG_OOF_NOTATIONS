import React from 'react';
import { 
  Plus, MessageSquare, Activity, Table, History, 
  Layers, ChevronLeft, ChevronRight, Zap, CheckCircle2, 
  Clock, ShieldAlert, Cpu, Sparkles
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
  backendStatus,
  onOpenArchModal
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
        {/* Top Header */}
        <div className="flex items-center justify-between p-3.5 border-b border-[#262626]">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#2563EB] flex items-center justify-center text-white font-bold text-xs shadow-xs">
              GW
            </div>
            <div>
              <div className="font-semibold text-sm text-white tracking-tight flex items-center gap-1.5">
                <span>GridWise AI</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#262626] text-slate-300">v1.0</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-[#262626] transition-colors cursor-pointer"
            title="Collapse Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Action: + New Optimization Button */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewOptimization();
              setActiveTab('optimizer');
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#212121] hover:bg-[#2f2f2f] text-white text-xs font-medium border border-[#2f2f2f] hover:border-[#404040] transition-all cursor-pointer shadow-xs group"
          >
            <div className="flex items-center space-x-2">
              <Plus className="w-4 h-4 text-sky-400 group-hover:rotate-90 transition-transform duration-200" />
              <span>New optimization</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">?K</span>
          </button>
        </div>

        {/* Scrollable Nav & History */}
        <div className="flex-1 overflow-y-auto px-3 space-y-4 text-xs">
          
          {/* Main Views */}
          <div className="space-y-1">
            <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Workspace
            </div>
            
            <button
              onClick={() => setActiveTab('optimizer')}
              className={`w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'optimizer' 
                  ? 'bg-[#262626] text-white font-medium' 
                  : 'text-slate-300 hover:text-white hover:bg-[#212121]'
              }`}
            >
              <MessageSquare className={`w-4 h-4 ${activeTab === 'optimizer' ? 'text-sky-400' : 'text-slate-400'}`} />
              <span>Operator Prompt & Input</span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'dashboard' 
                  ? 'bg-[#262626] text-white font-medium' 
                  : 'text-slate-300 hover:text-white hover:bg-[#212121]'
              }`}
            >
              <Activity className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>Telemetry & Graphs</span>
            </button>

            <button
              onClick={() => setActiveTab('schedule')}
              className={`w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'schedule' 
                  ? 'bg-[#262626] text-white font-medium' 
                  : 'text-slate-300 hover:text-white hover:bg-[#212121]'
              }`}
            >
              <Table className={`w-4 h-4 ${activeTab === 'schedule' ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>24h Schedule Matrix</span>
            </button>
          </div>

          {/* Preset Grid Scenarios */}
          <div className="space-y-1 pt-2 border-t border-[#262626]">
            <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Preset Scenarios
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

          {/* Previous Runs History */}
          {historyList && historyList.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-[#262626]">
              <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Recent Runs</span>
                <span className="font-mono text-[10px] text-slate-400">{historyList.length}</span>
              </div>

              <div className="space-y-0.5">
                {historyList.slice(0, 8).map((hist, idx) => (
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

        {/* Bottom User / Backend Info */}
        <div className="p-3 border-t border-[#262626] bg-[#141414] space-y-2">
          
          <button
            onClick={onOpenArchModal}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#212121] text-xs transition-colors cursor-pointer"
          >
            <div className="flex items-center space-x-2">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>System Architecture</span>
            </div>
            <span className="text-[10px] text-slate-400">Specs</span>
          </button>

          <div className="flex items-center justify-between pt-1 border-t border-[#262626]/80 text-[11px]">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white">
                RM
              </div>
              <div className="leading-tight">
                <div className="font-medium text-slate-200 truncate max-w-[100px]">RADOAN (Operator)</div>
                <div className="text-[10px] text-slate-400 font-mono">BUP Hackathon</div>
              </div>
            </div>

            <div className="flex items-center space-x-1 px-1.5 py-0.5 rounded-full bg-[#1c1c1c] border border-[#2a2a2a] text-[10px] font-mono">
              <span className={`w-1.5 h-1.5 rounded-full ${backendStatus === 'healthy' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className="text-slate-300">{backendStatus === 'healthy' ? 'Live' : 'Sim'}</span>
            </div>
          </div>

        </div>

      </aside>
    </>
  );
}
