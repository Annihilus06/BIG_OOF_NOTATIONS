import React from 'react';
import { Terminal, Activity, Table, History, Layers } from 'lucide-react';
import { Button } from './ui/Button';

export default function Navbar({ activeTab, setActiveTab, backendStatus, onOpenArchModal }) {
  const navItems = [
    { id: 'optimizer', label: 'Operator Console', icon: Terminal },
    { id: 'dashboard', label: 'Telemetry & Analytics', icon: Activity },
    { id: 'schedule', label: '24h Dispatch Schedule', icon: Table },
    { id: 'history', label: 'Audit Log', icon: History }
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#111827] border-b border-[#374151]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          
          {/* Brand Logo & Context */}
          <div 
            className="flex items-center space-x-3 cursor-pointer" 
            onClick={() => setActiveTab('optimizer')}
          >
            <div className="w-8 h-8 rounded-[8px] bg-[#2563EB] flex items-center justify-center text-white font-bold text-[14px]">
              GW
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[16px] font-bold text-[#F9FAFB] tracking-tight">
                  GridWise <span className="font-normal text-[#94A3B8]">AI</span>
                </span>
                <span className="px-1.5 py-0.5 text-[11px] font-mono rounded bg-[#1F2937] text-[#94A3B8] border border-[#374151]">
                  v1.0
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-[8px] text-[13px] font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#1F2937] text-[#F9FAFB] border border-[#374151]'
                      : 'text-[#94A3B8] hover:text-[#F9FAFB] hover:bg-[#1F2937]/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#2563EB]' : 'text-[#94A3B8]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Status & Action */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-2.5 py-1 rounded-[8px] bg-[#0B1220] border border-[#374151] text-[12px] font-mono">
              <span className={`w-2 h-2 rounded-full ${backendStatus === 'healthy' ? 'bg-[#16A34A]' : 'bg-[#D97706]'}`} />
              <span className="text-[#CBD5E1] hidden sm:inline">
                {backendStatus === 'healthy' ? 'OR-Tools Engine Live' : 'Simulation Mode'}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={onOpenArchModal}
            >
              <Layers className="w-3.5 h-3.5 text-[#94A3B8]" />
              <span>Architecture</span>
            </Button>
          </div>

        </div>
      </div>
    </header>
  );
}