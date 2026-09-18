import React, { useState, useRef } from 'react';
import { 
  Terminal, Sparkles, Upload, Sliders, CheckCircle2, 
  Play, X, FileJson, ChevronDown, ChevronUp 
} from 'lucide-react';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { TextArea } from './ui/Input';
import { DEFAULT_SCENARIOS } from '../lib/presets';

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
          throw new Error('JSON must contain load_profile, solar_profile, and tariff_profile arrays.');
        }
        if (json.load_profile.length !== 24 || json.solar_profile.length !== 24 || json.tariff_profile.length !== 24) {
          throw new Error('Profile arrays must contain exactly 24 hourly entries.');
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

  const getDirectiveBadgeVariant = (type) => {
    switch (type) {
      case 'solar_reduction': return 'warning';
      case 'minimum_battery_reserve': return 'success';
      case 'no_charge_window': return 'danger';
      case 'no_discharge_window': return 'primary';
      case 'max_grid_window': return 'primary';
      default: return 'neutral';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Natural Language Operator Input (6 Cols) */}
        <Card className="lg:col-span-6 flex flex-col justify-between">
          <div>
            <CardHeader className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-[#2563EB]" />
                <h2 className="text-[15px] font-semibold text-[#F9FAFB]">
                  Operator Directives (Gemini NLP)
                </h2>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <TextArea
                  rows={4}
                  value={operatorPrompt}
                  onChange={(e) => setOperatorPrompt(e.target.value)}
                  placeholder='e.g. "Solar will drop to 20% between 1 PM and 3 PM, and keep at least 40% battery reserve from 6 PM to 10 PM."'
                />

                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#94A3B8]">
                    Natural language is converted into strict mathematical rules.
                  </span>

                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    onClick={() => onParseDirectives(operatorPrompt)}
                    disabled={isParsingDirectives || !operatorPrompt.trim()}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>{isParsingDirectives ? 'Parsing...' : 'Parse Directives'}</span>
                  </Button>
                </div>
              </div>

              {/* Parsed Directives Chips */}
              {directives.length > 0 && (
                <div className="pt-3 border-t border-[#374151] space-y-2">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-semibold text-[#F9FAFB] flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                      Extracted Constraints ({directives.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setDirectives([])}
                      className="text-[#DC2626] hover:underline font-mono cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {directives.map((dir, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-[6px] bg-[#0B1220] border border-[#374151] flex items-center justify-between gap-2 text-[12px]"
                      >
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <Badge variant={getDirectiveBadgeVariant(dir.directive_type)}>
                            {dir.directive_type.toUpperCase()}
                          </Badge>
                          <span className="font-mono text-[#CBD5E1]">
                            Hours: [{dir.hours?.join(', ') || 'All'}]
                          </span>
                          {dir.factor !== undefined && dir.factor !== null && (
                            <span className="font-mono text-[#FBBF24]">
                              Factor: {dir.factor}
                            </span>
                          )}
                          {dir.min_soc_pct !== undefined && dir.min_soc_pct !== null && (
                            <span className="font-mono text-[#4ADE80]">
                              Min SOC: {(dir.min_soc_pct * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveDirective(idx)}
                          className="text-[#94A3B8] hover:text-[#DC2626] p-1 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </div>
        </Card>

        {/* Right Column: Scenario Profile (6 Cols) */}
        <Card className="lg:col-span-6 flex flex-col justify-between">
          <div>
            <CardHeader className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-[#2563EB]" />
                <h2 className="text-[15px] font-semibold text-[#F9FAFB]">
                  Energy Profile & Storage
                </h2>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <span className="text-[12px] font-medium text-[#94A3B8] uppercase tracking-wider block">
                  Select Scenario:
                </span>
                <div className="space-y-2">
                  {Object.entries(DEFAULT_SCENARIOS).map(([key, item]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handlePresetSelect(key)}
                      className={`w-full text-left p-3 rounded-[8px] border transition-colors cursor-pointer ${
                        selectedPresetKey === key
                          ? 'bg-[#1F2937] border-[#2563EB] text-[#F9FAFB]'
                          : 'bg-[#0B1220] border-[#374151] text-[#CBD5E1] hover:border-[#4B5563]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-semibold text-[#F9FAFB]">{item.name}</span>
                        <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[#111827] text-[#94A3B8] border border-[#374151]">
                          {item.battery_capacity_kwh} kWh Batt
                        </span>
                      </div>
                      <p className="text-[12px] text-[#94A3B8] mt-1 line-clamp-1">{item.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload & Specs Toggle */}
              <div className="flex items-center justify-between pt-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".json"
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileJson className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Upload JSON Scenario</span>
                </Button>

                <button
                  type="button"
                  onClick={() => setShowConfig(!showConfig)}
                  className="flex items-center space-x-1 text-[12px] text-[#94A3B8] hover:text-[#F9FAFB] transition-colors cursor-pointer"
                >
                  <span>{showConfig ? 'Hide Hardware Specs' : 'View Hardware Specs'}</span>
                  {showConfig ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {uploadError && (
                <div className="p-2.5 rounded-[8px] bg-[#DC2626]/15 border border-[#DC2626]/30 text-[#F87171] text-[12px]">
                  {uploadError}
                </div>
              )}

              {/* Specifications Details */}
              {showConfig && (
                <div className="p-3 rounded-[8px] bg-[#0B1220] border border-[#374151] grid grid-cols-3 gap-2 text-[12px] font-mono">
                  <div>
                    <span className="text-[#94A3B8] text-[10px] block uppercase">Capacity</span>
                    <span className="font-bold text-[#F9FAFB]">{scenario.battery_capacity_kwh} kWh</span>
                  </div>
                  <div>
                    <span className="text-[#94A3B8] text-[10px] block uppercase">Max Power</span>
                    <span className="font-bold text-[#F9FAFB]">{scenario.max_charge_kw} kW</span>
                  </div>
                  <div>
                    <span className="text-[#94A3B8] text-[10px] block uppercase">Efficiency</span>
                    <span className="font-bold text-[#F9FAFB]">{(scenario.battery_efficiency * 100).toFixed(0)}%</span>
                  </div>
                </div>
              )}
            </CardContent>
          </div>
        </Card>

      </div>

      {/* Main Submit Action */}
      <Button
        variant="primary"
        size="lg"
        className="w-full py-3"
        type="button"
        onClick={onRunOptimization}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Computing Mathematical Dispatch (Google OR-Tools)...</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4 fill-current" />
            <span>Run OR-Tools Energy Optimization</span>
          </>
        )}
      </Button>
    </div>
  );
}