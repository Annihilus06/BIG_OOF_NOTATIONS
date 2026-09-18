import React from 'react';
import { Cpu, History, Table, Activity, Layers, Terminal, Radio, ShieldCheck } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, backendStatus, onOpenArchModal }) {
  return (
    <header className="sticky top-0 z-50 bg-[#0c101a] border-b border-[#1b2334] text-slate-200">
      {/* Top Telemetry Ticker Bar */}
      <div className="bg-[#070a12] border-b border-[#161c2b] px-4 py-1 text-[11px] text-slate-400 flex items-center justify-between font-mono">
        <div className="flex items-center space-x-4 overflow-x-auto whitespace-nowrap">
          <span className="flex items-center space-x-1.5 text-slate-300">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>NODE: <strong className="text-white">US-EAST-BESS-01</strong></span>
          </span>
          <span className="text-slate-600">|</span>
          <span>GRID FREQ: <strong className="text-slate-200">50.02 Hz</strong></span>
          <span className="text-slate-600">|</span>
          <span>DISPATCH MODE: <strong className="text-sky-400">ECONOMIC ARBITRAGE (LP)</strong></span>
          <span className="text-slate-600">|</span>
          <span>AI PARSER: <strong className="text-amber-400">GEMINI 1.5 FLASH</strong></span>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <div className="flex items-center space-x-1.5">
            <div className={`w-2 h-2 rounded-full ${backendStatus === 'healthy' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300">
              {backendStatus === 'healthy' ? 'OR-Tools Engine Live' : 'Simulation Engine'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Nav Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          
          {/* Brand Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('optimizer')}>
            <div className="w-8 h-8 rounded-lg bg-[#141d30] border border-[#233150] flex items-center justify-center text-sky-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-bold tracking-tight text-white font-sans">
                  GridWise <span className="text-sky-400 font-semibold">OS</span>
                </span>
                <span className="px-1.5 py-0.2 text-[9px] font-mono uppercase rounded bg-[#18233c] text-sky-300 border border-[#233355]">
                  Microgrid SCADA
                </span>
              </div>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex items-center space-x-1 bg-[#101624] p-1 rounded-lg border border-[#1d263a]">
            <button
              onClick={() => setActiveTab('optimizer')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeTab === 'optimizer'
                  ? 'bg-[#1b253d] text-white border border-[#2d3e66] shadow-inner'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#151c2d]'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-sky-400" />
              <span>Operator Terminal</span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeTab === 'dashboard'
                  ? 'bg-[#1b253d] text-white border border-[#2d3e66] shadow-inner'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#151c2d]'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Telemetry & Charts</span>
            </button>

            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeTab === 'schedule'
                  ? 'bg-[#1b253d] text-white border border-[#2d3e66] shadow-inner'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#151c2d]'
              }`}
            >
              <Table className="w-3.5 h-3.5 text-amber-400" />
              <span>Dispatch Matrix (24h)</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeTab === 'history'
                  ? 'bg-[#1b253d] text-white border border-[#2d3e66] shadow-inner'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#151c2d]'
              }`}
            >
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span>Audit Log</span>
            </button>
          </nav>

          {/* Right Action */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenArchModal}
              className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-[#131a2c] hover:bg-[#1a233b] text-slate-300 border border-[#202b45] transition"
            >
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>System Topology</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
