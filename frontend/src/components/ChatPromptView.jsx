import React, { useState, useRef } from 'react';
import { 
  Plus, ArrowUp, Sparkles, FileJson, X, 
  CheckCircle2, AlertCircle, Sliders, ChevronDown
} from 'lucide-react';
import { DEFAULT_SCENARIOS } from '../lib/presets';

export default function ChatPromptView({
  scenario,
  setScenario,
  directives,
  setDirectives,
  operatorPrompt,
  setOperatorPrompt,
  onRunOptimization,
  isLoading,
  onParseDirectives,
  isParsingDirectives,
  backendStatus
}) {
  const [attachedFile, setAttachedFile] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [showScenarioMenu, setShowScenarioMenu] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = JSON.parse(event.target?.result);
        
        let parsedScenario = null;
        if (raw.load_profile && raw.solar_profile && raw.tariff_profile) {
          parsedScenario = raw;
        } else if (raw.cases && Array.isArray(raw.cases) && raw.cases.length > 0) {
          parsedScenario = raw.cases[0];
        } else if (Array.isArray(raw) && raw.length > 0) {
          parsedScenario = raw[0];
        } else if (raw.scenario) {
          parsedScenario = raw.scenario;
        }

        if (!parsedScenario || !parsedScenario.load_profile || !parsedScenario.solar_profile || !parsedScenario.tariff_profile) {
          throw new Error('JSON scenario must include load_profile (24h), solar_profile (24h), and tariff_profile (24h).');
        }

        if (parsedScenario.load_profile.length !== 24 || parsedScenario.solar_profile.length !== 24 || parsedScenario.tariff_profile.length !== 24) {
          throw new Error(`Profile arrays must contain exactly 24 hourly entries. Got load: ${parsedScenario.load_profile.length}, solar: ${parsedScenario.solar_profile.length}.`);
        }

        const cleanScenario = {
          name: parsedScenario.name || file.name.replace(/\.json$/i, ''),
          description: parsedScenario.description || `Custom grid scenario loaded from ${file.name}`,
          battery_capacity_kwh: Number(parsedScenario.battery_capacity_kwh || 40.0),
          max_charge_kw: Number(parsedScenario.max_charge_kw || 10.0),
          max_discharge_kw: Number(parsedScenario.max_discharge_kw || 10.0),
          battery_efficiency: Number(parsedScenario.battery_efficiency || 0.90),
          initial_soc_kwh: Number(parsedScenario.initial_soc_kwh || 20.0),
          min_soc_pct: Number(parsedScenario.min_soc_pct || 0.15),
          max_soc_pct: Number(parsedScenario.max_soc_pct || 0.95),
          load_profile: parsedScenario.load_profile.map(Number),
          solar_profile: parsedScenario.solar_profile.map(Number),
          tariff_profile: parsedScenario.tariff_profile.map(Number),
          feed_in_tariff: parsedScenario.feed_in_tariff ? parsedScenario.feed_in_tariff.map(Number) : Array(24).fill(5.00)
        };

        setScenario(cleanScenario);
        setAttachedFile({
          name: file.name,
          size: (file.size / 1024).toFixed(1) + ' KB',
          capacity: cleanScenario.battery_capacity_kwh
        });
      } catch (err) {
        console.error('File parsing error:', err);
        setUploadError(err.message || 'Invalid JSON format. Please verify the 24-hour profile arrays.');
      }
    };
    reader.readAsText(file);
  };

  const handleRemoveAttachedFile = () => {
    setAttachedFile(null);
    setScenario(DEFAULT_SCENARIOS.default);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading) {
        onRunOptimization();
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center max-w-2xl w-full mx-auto px-4 py-6 select-none">
      
      {/* Hidden File Input for JSON attachment */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json,application/json"
        className="hidden"
      />

      {/* Top Clean Greeting (ChatGPT style) */}
      <div className="w-full text-center space-y-2 mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
          What can I optimize today?
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto">
          Attach a 24-hour grid scenario JSON, enter natural language operator notes, and compute lowest-cost mathematical dispatch.
        </p>
      </div>

      {/* Main Central Input Container (ChatGPT Style) */}
      <div className="w-full space-y-2.5">
        
        {/* Error Notification */}
        {uploadError && (
          <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
            <button onClick={() => setUploadError(null)} className="text-rose-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* The Sleek Compact ChatGPT Prompt Pill */}
        <div className="w-full bg-[#212121] rounded-2xl border border-[#2f2f2f] hover:border-[#3f3f3f] focus-within:border-[#555] transition-all shadow-lg p-2.5 sm:p-3 space-y-2">
          
          {/* Top Row: Attached JSON File or Scenario Tag */}
          <div className="flex items-center justify-between flex-wrap gap-1.5 text-xs">
            {attachedFile ? (
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md bg-[#2a2a2a] border border-[#3a3a3a] text-sky-300 font-mono text-[11px]">
                <FileJson className="w-3 h-3 text-sky-400" />
                <span>{attachedFile.name}</span>
                <span className="text-slate-400 text-[10px]">({attachedFile.capacity} kWh)</span>
                <button
                  type="button"
                  onClick={handleRemoveAttachedFile}
                  className="text-slate-400 hover:text-rose-400 ml-1 cursor-pointer"
                  title="Remove attached JSON"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowScenarioMenu(!showScenarioMenu)}
                  className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-[#1a1a1a] hover:bg-[#282828] border border-[#333] text-slate-300 text-[11px] transition-colors cursor-pointer"
                >
                  <Sliders className="w-3 h-3 text-amber-400" />
                  <span className="font-medium text-slate-200">{scenario.name}</span>
                  <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                </button>

                {showScenarioMenu && (
                  <div className="absolute top-full left-0 mt-1 w-60 bg-[#1e1e1e] border border-[#333] rounded-xl shadow-2xl z-50 p-1 space-y-0.5">
                    <div className="px-2 py-0.5 text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                      Select Scenario Profile
                    </div>
                    {Object.entries(DEFAULT_SCENARIOS).map(([key, item]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setScenario(item);
                          setShowScenarioMenu(false);
                        }}
                        className={`w-full text-left px-2 py-1 rounded-md text-[11px] transition-colors cursor-pointer flex items-center justify-between ${
                          scenario.name === item.name 
                            ? 'bg-[#2a2a2a] text-sky-300' 
                            : 'text-slate-300 hover:bg-[#262626] hover:text-white'
                        }`}
                      >
                        <span className="truncate">{item.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{item.battery_capacity_kwh}kWh</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Directives count preview */}
            {directives.length > 0 && (
              <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono">
                <CheckCircle2 className="w-2.5 h-2.5" />
                <span>{directives.length} constraint(s)</span>
              </div>
            )}
          </div>

          {/* Center: Sleek Compact Textarea Input */}
          <textarea
            rows={2}
            value={operatorPrompt}
            onChange={(e) => setOperatorPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything or enter operator instructions (e.g. 'Reduce solar to 30% from 1 PM to 4 PM')..."
            className="w-full bg-transparent text-white placeholder-slate-500 text-xs sm:text-sm outline-none resize-none font-sans leading-relaxed min-h-[44px]"
          />

          {/* Bottom Bar: + Button on Left, Action Buttons on Right */}
          <div className="flex items-center justify-between pt-1 border-t border-[#2a2a2a]">
            
            {/* Left: + Icon (Add JSON file of input) */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-[#2a2a2a] hover:bg-[#333] text-slate-200 hover:text-white text-[11px] font-medium transition-all cursor-pointer group"
                title="Attach 24h Scenario JSON file"
              >
                <Plus className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
                <span>Add JSON Scenario</span>
              </button>
            </div>

            {/* Right: Parse Directives & Circular Send (↑) */}
            <div className="flex items-center space-x-1.5">
              
              {operatorPrompt.trim().length > 0 && (
                <button
                  type="button"
                  onClick={() => onParseDirectives(operatorPrompt)}
                  disabled={isParsingDirectives}
                  className="hidden sm:flex items-center space-x-1 px-2 py-1 rounded-full bg-[#1c1c1c] hover:bg-[#282828] text-slate-300 text-[11px] border border-[#333] transition-colors cursor-pointer"
                  title="Extract mathematical constraints with Gemini"
                >
                  <Sparkles className="w-3 h-3 text-sky-400" />
                  <span>{isParsingDirectives ? 'Parsing...' : 'Parse'}</span>
                </button>
              )}

              {/* Circular Send (↑) Button */}
              <button
                type="button"
                onClick={onRunOptimization}
                disabled={isLoading}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md ${
                  isLoading
                    ? 'bg-slate-700 text-slate-400 cursor-wait'
                    : 'bg-white hover:bg-slate-200 text-black active:scale-95'
                }`}
                title="Run Optimization & View Output in Next Page"
              >
                {isLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ArrowUp className="w-4 h-4 font-bold stroke-[2.5]" />
                )}
              </button>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
