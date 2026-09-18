import React, { useState, useRef } from 'react';
import { 
  Send, Upload, FileText, Sparkles, Sliders, CheckCircle2, AlertTriangle, 
  RotateCcw, Play, Sun, Battery, Zap, Clock, ChevronDown, ChevronUp 
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
  const [showScenarioDetails, setShowScenarioDetails] = useState(false);
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
          throw new Error('JSON scenario must include load_profile, solar_profile, and tariff_profile (24 items each).');
        }
        if (json.load_profile.length !== 24 || json.solar_profile.length !== 24 || json.tariff_profile.length !== 24) {
          throw new Error('All profile arrays must have exactly 24 hourly entries.');
        }
        setScenario(json);
        setSelectedPresetKey('custom');
      } catch (err) {
        setUploadError(err.message || 'Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  const handlePromptChange = (val) => {
    setOperatorPrompt(val);
  };

  const handleQuickPrompt = async (text) => {
    setOperatorPrompt(text);
    await onParseDirectives(text);
  };

  const getDirectiveBadgeColor = (type) => {
    switch (type) {
      case 'solar_reduction': return 'border-amber-500/40 bg-amber-950/40 text-amber-300';
      case 'minimum_battery_reserve': return 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300';
      case 'no_charge_window': return 'border-rose-500/40 bg-rose-950/40 text-rose-300';
      case 'no_discharge_window': return 'border-blue-500/40 bg-blue-950/40 text-blue-300';
      case 'max_grid_window': return 'border-purple-500/40 bg-purple-950/40 text-purple-300';
      default: return 'border-slate-700 bg-slate-800 text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Chat & Operator Directives (7 Cols) */}
        <div className="lg:col-span-7 glass-panel rounded-2xl p-5 border border-slate-800 bg-slate-900/80 shadow-xl space-y-4">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  AI Operator Instruction Chat
                  <span className="text-[10px] font-semibold bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800/60">
                    Gemini Flash
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Input weather alerts, load shifts, or operational constraints in plain English.
                </p>
              </div>
            </div>

            {directives.length > 0 && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                {directives.length} Directive(s) Active
              </span>
            )}
          </div>

          {/* Chat Input Field */}
          <div className="space-y-2">
            <div className="relative">
              <textarea
                rows={3}
                value={operatorPrompt}
                onChange={(e) => handlePromptChange(e.target.value)}
                placeholder='e.g. "Solar production will drop to 20% between 1 PM and 3 PM, and keep at least 40% battery reserve from 6 PM to 10 PM."'
                className="w-full px-4 py-3 bg-slate-950/90 rounded-xl border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm text-slate-100 placeholder-slate-500 transition resize-none outline-none font-medium"
              />
              <div className="absolute bottom-3 right-3 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => onParseDirectives(operatorPrompt)}
                  disabled={isParsingDirectives || !operatorPrompt.trim()}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition flex items-center space-x-1.5 disabled:opacity-50"
                  title="Extract directives with Gemini"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isParsingDirectives ? 'Parsing...' : 'Parse Directives'}</span>
                </button>
              </div>
            </div>

            {/* Quick Chips */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Quick Prompt Examples:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PROMPT_SUGGESTIONS.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickPrompt(suggestion)}
                    className="text-xs text-left px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-750 text-slate-300 border border-slate-700/80 hover:border-cyan-500/50 transition hover:text-cyan-300"
                  >
                    "{suggestion}"
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Parsed Directives Preview Badges */}
          {directives.length > 0 && (
            <div className="pt-3 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Extracted Mathematical Directives:
                </span>
                <button
                  type="button"
                  onClick={() => setDirectives([])}
                  className="text-xs text-rose-400 hover:underline"
                >
                  Clear Directives
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {directives.map((dir, i) => (
                  <div
                    key={i}
                    className={`p-2.5 rounded-xl border ${getDirectiveBadgeColor(dir.directive_type)} space-y-1`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {dir.directive_type.replace(/_/g, ' ')}
                      </span>
                      {dir.factor !== undefined && dir.factor !== null && (
                        <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-200">
                          Factor: {(dir.factor * 100).toFixed(0)}%
                        </span>
                      )}
                      {dir.min_soc_pct !== undefined && dir.min_soc_pct !== null && (
                        <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-200">
                          Min SOC: {(dir.min_soc_pct * 100).toFixed(0)}%
                        </span>
                      )}
                      {dir.max_grid_kw !== undefined && dir.max_grid_kw !== null && (
                        <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-200">
                          Max: {dir.max_grid_kw} kW
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] opacity-80 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        Hours: {dir.hours?.length > 0 ? dir.hours.map(h => `${h}:00`).join(', ') : 'All Day'}
                      </span>
                    </div>
                    {dir.notes && (
                      <p className="text-[10px] opacity-75 italic">{dir.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right: Scenario Profile & Hardware Config (5 Cols) */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-5 border border-slate-800 bg-slate-900/80 shadow-xl space-y-4 flex flex-col justify-between">
          
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Scenario Profile</h2>
                  <p className="text-xs text-slate-400">Select baseline or upload 24h JSON scenario.</p>
                </div>
              </div>
            </div>

            {/* Scenario Preset Selector Buttons */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Preset Energy Scenarios:</label>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(DEFAULT_SCENARIOS).map(([key, s]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handlePresetSelect(key)}
                    className={`p-3 rounded-xl text-left border transition ${
                      selectedPresetKey === key
                        ? 'border-cyan-500/80 bg-cyan-950/40 text-cyan-200 shadow-md shadow-cyan-500/10'
                        : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{s.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {s.battery_capacity_kwh} kWh Batt
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{s.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* JSON Upload & Details Toggle */}
            <div className="pt-2 flex items-center justify-between">
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
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              >
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>Upload Scenario JSON</span>
              </button>

              <button
                type="button"
                onClick={() => setShowScenarioDetails(!showScenarioDetails)}
                className="flex items-center space-x-1 text-xs font-medium text-slate-400 hover:text-cyan-300 transition"
              >
                <span>{showScenarioDetails ? 'Hide Specs' : 'View Battery Specs'}</span>
                {showScenarioDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {uploadError && (
              <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Collapsible Specs */}
            {showScenarioDetails && (
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] block">Capacity</span>
                  <span className="font-bold text-white">{scenario.battery_capacity_kwh} kWh</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Max Chg/Dischg</span>
                  <span className="font-bold text-white">{scenario.max_charge_kw} kW</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Efficiency</span>
                  <span className="font-bold text-white">{(scenario.battery_efficiency * 100).toFixed(0)}%</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Initial SOC</span>
                  <span className="font-bold text-white">{scenario.initial_soc_kwh} kWh</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Min Reserve</span>
                  <span className="font-bold text-white">{(scenario.min_soc_pct * 100).toFixed(0)}%</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Max Reserve</span>
                  <span className="font-bold text-white">{(scenario.max_soc_pct * 100).toFixed(0)}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Glowing Primary Run Action */}
          <div className="pt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onRunOptimization}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2.5 py-3.5 px-6 rounded-xl font-bold text-base bg-gradient-to-r from-cyan-500 via-sky-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white shadow-xl shadow-cyan-500/25 transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Solving Optimal Dispatch with OR-Tools...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>Run Google OR-Tools Optimizer</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
