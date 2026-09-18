import React, { useState, useRef } from 'react';
import { 
  Terminal, Sparkles, Upload, Sliders, CheckCircle2, AlertTriangle, 
  Play, Clock, ChevronDown, ChevronUp, Cpu, RefreshCw, X, FileJson, ArrowRight
} from 'lucide-react';
import { QUICK_PROMPT_SUGGESTIONS, DEFAULT_SCENARIOS } from '../lib/presets';

export default function OptimizationConsole({
  scenario,
  setScenario,
  directives,
  setDirectives,
  operatorPrompt,
  setOperatorPrompt,
  onRunOptimization,
  isLoading,
  onParseDirectives,
  isParsingDirectives
}) {
  const [selectedPresetKey, setSelectedPresetKey] = useState('default');
  const [showConfig, setShowConfig] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  const handlePresetSelect = (key) => {
    setSelectedPresetKey(key);
    if (DEFAULT_SCENARIOS[key]) {
      setScenario(DEFAULT_SCENARIOS[key]);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result);
        if (!json.load_profile || !json.solar_profile || !json.tariff_profile) {
          throw new Error('JSON scenario must contain load_profile, solar_profile, and tariff_profile (24 hourly floats).');
        }
        if (json.load_profile.length !== 24 || json.solar_profile.length !== 24 || json.tariff_profile.length !== 24) {
          throw new Error('All load, solar, and tariff arrays must have exactly 24 elements.');
        }
        setScenario(json);
        setSelectedPresetKey('custom');
      } catch (err) {
        setUploadError(err.message || 'Invalid JSON scenario format.');
      }
    };
    reader.readAsText(file);
  };

  const handleRemoveDirective = (index) => {
    const updated = [...directives];
    updated.splice(index, 1);
    setDirectives(updated);
  };

  const getDirectiveBadge = (type) => {
    switch (type) {
      case 'solar_reduction': return { label: 'SOLAR_REDUCTION', color: 'bg-amber-950/80 text-amber-300 border-amber-800/80' };
      case 'minimum_battery_reserve': return { label: 'MIN_SOC_RESERVE', color: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80' };
      case 'no_charge_window': return { label: 'LOCKOUT_CHARGE', color: 'bg-rose-950/80 text-rose-300 border-rose-800/80' };
      case 'no_discharge_window': return { label: 'LOCKOUT_DISCHARGE', color: 'bg-sky-950/80 text-sky-300 border-sky-800/80' };
      case 'max_grid_window': return { label: 'PEAK_GRID_CAP', color: 'bg-purple-950/80 text-purple-300 border-purple-800/80' };
      default: return { label: 'NO_OP', color: 'bg-slate-900 text-slate-400 border-slate-700' };
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      
      {/* Left (7 Cols): Operator NLP Terminal & Directives */}
      <div className="lg:col-span-7 bg-[#0f1422] border border-[#1e273c] rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
        
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#1b2336]">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded bg-[#162035] border border-[#253659] flex items-center justify-center text-sky-400">
                <Terminal className="w-3.5 h-3.5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Operator Instruction Terminal
                </h2>
                <p className="text-[11px] text-slate-400">
                  Enter operational directives, weather contingencies, or reserve locks.
                </p>
              </div>
            </div>

            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#141b2c] text-slate-300 border border-[#212d48]">
              PARSER: STRICT JSON
            </span>
          </div>

          {/* Terminal Input Box */}
          <div className="space-y-2">
            <div className="relative rounded-lg bg-[#090c14] border border-[#222c42] focus-within:border-sky-500/80 transition p-2.5">
              <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-500 pb-1.5 border-b border-slate-900">
                <span className="text-emerald-400 font-bold">operator@gridwise:~$</span>
                <span>input-directive --prompt</span>
              </div>
              <textarea
                rows={3}
                value={operatorPrompt}
                onChange={(e) => setOperatorPrompt(e.target.value)}
                placeholder='e.g. "Solar production will drop to 20% between 1 PM and 3 PM, and keep minimum 40% battery reserve from 6 PM to 10 PM."'
                className="w-full bg-transparent text-xs sm:text-sm text-slate-100 placeholder-slate-600 outline-none resize-none pt-2 font-mono leading-relaxed"
              />
              <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono text-slate-500">FORMAT: Natural Language</span>
                </div>
                <button
                  type="button"
                  onClick={() => onParseDirectives(operatorPrompt)}
                  disabled={isParsingDirectives || !operatorPrompt.trim()}
                  className="px-3 py-1 rounded bg-[#172238] hover:bg-[#202f4e] text-sky-300 border border-[#26375c] text-xs font-semibold transition flex items-center space-x-1.5 disabled:opacity-40"
                >
                  <Sparkles className="w-3 h-3 text-sky-400" />
                  <span>{isParsingDirectives ? 'Parsing Directives...' : 'Parse Directives (Gemini)'}</span>
                </button>
              </div>
            </div>

            {/* Quick Directive Chips */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                Preset Directive Commands:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PROMPT_SUGGESTIONS.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setOperatorPrompt(s);
                      onParseDirectives(s);
                    }}
                    className="text-[11px] text-left px-2 py-1 rounded bg-[#121828] hover:bg-[#1a233b] text-slate-300 border border-[#1e2840] hover:border-sky-500/40 transition font-sans"
                  >
                    "{s}"
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Mathematical Directives Queue */}
          <div className="space-y-2 pt-2 border-t border-[#1b2336]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Active Directives Queue ({directives.length})
              </span>
              {directives.length > 0 && (
                <button
                  type="button"
                  onClick={() => setDirectives([])}
                  className="text-[11px] text-rose-400 hover:underline font-mono"
                >
                  [CLEAR ALL]
                </button>
              )}
            </div>

            {directives.length === 0 ? (
              <div className="p-3 rounded-lg bg-[#0a0d16] border border-[#1b2336] text-[11px] text-slate-500 font-mono text-center">
                NO CONSTRAINTS QUEUED. OR-TOOLS WILL RUN UNCONSTRAINED ECONOMIC DISPATCH.
              </div>
            ) : (
              <div className="space-y-2">
                {directives.map((dir, idx) => {
                  const badge = getDirectiveBadge(dir.directive_type);
                  return (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-[#0a0d16] border border-[#1e273c] flex items-start justify-between gap-3 text-xs font-mono"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${badge.color}`}>
                            {badge.label}
                          </span>
                          <span className="text-slate-300 text-[11px]">
                            Hours: [{dir.hours?.join(', ') || 'ALL'}]
                          </span>
                          {dir.factor !== undefined && dir.factor !== null && (
                            <span className="text-amber-400 text-[11px]">
                              Factor: {dir.factor}
                            </span>
                          )}
                          {dir.min_soc_pct !== undefined && dir.min_soc_pct !== null && (
                            <span className="text-emerald-400 text-[11px]">
                              Min SOC: {(dir.min_soc_pct * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>
                        {dir.notes && (
                          <p className="text-[10px] text-slate-400 font-sans">{dir.notes}</p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveDirective(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition"
                        title="Remove directive"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Right (5 Cols): Scenario Profiles & Hardware Control */}
      <div className="lg:col-span-5 bg-[#0f1422] border border-[#1e273c] rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
        
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#1b2336]">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded bg-[#162035] border border-[#253659] flex items-center justify-center text-sky-400">
                <Sliders className="w-3.5 h-3.5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Scenario & Asset Configuration
                </h2>
                <p className="text-[11px] text-slate-400">
                  Select baseline telemetry or upload scenario JSON.
                </p>
              </div>
            </div>
          </div>

          {/* Scenario Presets Selector */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block">
              Benchmark Site Scenarios:
            </span>
            <div className="space-y-2">
              {Object.entries(DEFAULT_SCENARIOS).map(([key, item]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handlePresetSelect(key)}
                  className={`w-full text-left p-3 rounded-lg border transition ${
                    selectedPresetKey === key
                      ? 'bg-[#162238] border-sky-500/80 text-white'
                      : 'bg-[#0a0d16] border-[#1b2336] text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-100">{item.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                      {item.battery_capacity_kwh} kWh / {item.max_charge_kw} kW
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{item.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Upload JSON / Hardware Parameters Toggle */}
          <div className="flex items-center justify-between pt-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#141b2c] hover:bg-[#1a243c] text-slate-200 border border-[#212d48] text-xs font-medium transition"
            >
              <FileJson className="w-3.5 h-3.5 text-sky-400" />
              <span>Upload Custom JSON</span>
            </button>

            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className="flex items-center space-x-1 text-xs text-slate-400 hover:text-sky-300 transition font-mono"
            >
              <span>{showConfig ? '[- HIDE PARAMS]' : '[+ ASSET SPECS]'}</span>
            </button>
          </div>

          {uploadError && (
            <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center space-x-2 font-mono">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Hardware Parameters Grid */}
          {showConfig && (
            <div className="p-3 rounded-lg bg-[#0a0d16] border border-[#1b2336] grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono">
              <div>
                <span className="text-slate-500 text-[10px] block">BESS CAPACITY</span>
                <span className="font-bold text-white">{scenario.battery_capacity_kwh} kWh</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">INVERTER MAX</span>
                <span className="font-bold text-white">{scenario.max_charge_kw} kW</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">ROUND-TRIP EFF</span>
                <span className="font-bold text-white">{(scenario.battery_efficiency * 100).toFixed(0)}%</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">INITIAL SOC</span>
                <span className="font-bold text-white">{scenario.initial_soc_kwh} kWh</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">SAFETY FLOOR</span>
                <span className="font-bold text-white">{(scenario.min_soc_pct * 100).toFixed(0)}%</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">MAX CEILING</span>
                <span className="font-bold text-white">{(scenario.max_soc_pct * 100).toFixed(0)}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Big Industrial Solve Button */}
        <div className="pt-4 border-t border-[#1b2336]">
          <button
            type="button"
            onClick={onRunOptimization}
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-bold text-sm bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white transition shadow-sm disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Computing LP Optimal Dispatch (OR-Tools)...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Execute OR-Tools Linear Solver</span>
              </>
            )}
          </button>
        </div>

      </div>

    </div>
  );
}
