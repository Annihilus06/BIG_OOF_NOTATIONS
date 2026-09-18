import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import OptimizationConsole from './components/OptimizationConsole';
import ResultsDashboard from './components/ResultsDashboard';
import ScheduleTable from './components/ScheduleTable';
import HistoryView from './components/HistoryView';
import ArchitectureModal from './components/ArchitectureModal';
import { DEFAULT_SCENARIOS } from './lib/presets';
import { 
  checkBackendHealth, 
  parseNaturalLanguagePrompt, 
  runOptimization, 
  fetchHistory, 
  saveLocalHistory 
} from './lib/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('optimizer');
  const [scenario, setScenario] = useState(DEFAULT_SCENARIOS.default);
  const [directives, setDirectives] = useState([]);
  const [operatorPrompt, setOperatorPrompt] = useState('');
  const [result, setResult] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isParsingDirectives, setIsParsingDirectives] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [isArchModalOpen, setIsArchModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initial load
  useEffect(() => {
    async function init() {
      const health = await checkBackendHealth();
      setBackendStatus(health.status === 'healthy' ? 'healthy' : 'simulation');
      
      const history = await fetchHistory();
      setHistoryList(history);

      try {
        const initialRes = await runOptimization(DEFAULT_SCENARIOS.default, [], 'Initial baseline');
        setResult(initialRes);
      } catch (e) {
        console.error('Initial solve error:', e);
      }
    }
    init();
  }, []);

  // Parse directives via Gemini
  const handleParseDirectives = async (promptText) => {
    if (!promptText || !promptText.trim()) return;
    setIsParsingDirectives(true);
    try {
      const res = await parseNaturalLanguagePrompt(promptText);
      if (res && res.directives) {
        setDirectives(res.directives);
        showToast(`Extracted ${res.directives.length} operational directive(s).`);
      }
    } catch (err) {
      console.error('Parse error:', err);
      showToast('Directive parsing failed.');
    } finally {
      setIsParsingDirectives(false);
    }
  };

  // Run OR-Tools Optimization
  const handleRunOptimization = async () => {
    setIsLoading(true);
    try {
      let currentDirectives = directives;
      
      if (operatorPrompt.trim() && directives.length === 0) {
        const parsedRes = await parseNaturalLanguagePrompt(operatorPrompt);
        if (parsedRes && parsedRes.directives) {
          currentDirectives = parsedRes.directives;
          setDirectives(parsedRes.directives);
        }
      }

      const res = await runOptimization(scenario, currentDirectives, operatorPrompt);
      setResult(res);
      saveLocalHistory(res, scenario, currentDirectives, operatorPrompt);
      
      const updatedHistory = await fetchHistory();
      setHistoryList(updatedHistory);

      showToast(`Optimization complete. Saved $${res.savings_amount.toFixed(2)} (${res.savings_pct.toFixed(1)}%).`);
      setActiveTab('dashboard'); // Switch cleanly to dedicated Analytics view
    } catch (err) {
      console.error('Optimization run error:', err);
      showToast('Optimization failed. Check scenario constraints.');
    } finally {
      setIsLoading(false);
    }
  };

  // Select History Item
  const handleSelectHistoryItem = (item) => {
    if (item.hourly_schedule) {
      setResult(item);
      setOperatorPrompt(item.raw_prompt || '');
      if (item.directives_applied) {
        setDirectives(item.directives_applied);
      }
      setActiveTab('dashboard');
      showToast(`Loaded scenario: ${item.scenario_name}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1220] text-[#F9FAFB] flex flex-col font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-[8px] border border-[#374151] bg-[#111827] text-[13px] text-[#F9FAFB] shadow-md flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        backendStatus={backendStatus}
        onOpenArchModal={() => setIsArchModalOpen(true)}
      />

      {/* Clean Main Content - Dedicated Single View per Tab */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        
        {/* TAB 1: OPERATOR CONSOLE */}
        {activeTab === 'optimizer' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#374151]">
              <div>
                <h1 className="text-[24px] font-bold text-[#F9FAFB] tracking-tight">
                  Operator Dispatch Console
                </h1>
                <p className="text-[14px] text-[#94A3B8] mt-0.5">
                  Input operational instructions and select scenario to compute lowest-cost dispatch.
                </p>
              </div>

              {result && (
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="text-[13px] text-[#2563EB] hover:text-[#60A5FA] font-medium flex items-center gap-1 cursor-pointer"
                >
                  <span>View Current Results →</span>
                </button>
              )}
            </div>

            <OptimizationConsole
              scenario={scenario}
              setScenario={setScenario}
              directives={directives}
              setDirectives={setDirectives}
              operatorPrompt={operatorPrompt}
              setOperatorPrompt={setOperatorPrompt}
              onRunOptimization={handleRunOptimization}
              isLoading={isLoading}
              onParseDirectives={handleParseDirectives}
              isParsingDirectives={isParsingDirectives}
            />
          </div>
        )}

        {/* TAB 2: DEDICATED TELEMETRY & ANALYTICS CHARTS */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#374151]">
              <div>
                <h1 className="text-[24px] font-bold text-[#F9FAFB] tracking-tight">
                  Telemetry & Analytics
                </h1>
                <p className="text-[14px] text-[#94A3B8] mt-0.5">
                  Real-time power dispatch breakdown, battery SOC trajectory, and cost arbitrage.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('schedule')}
                className="text-[13px] text-[#2563EB] hover:text-[#60A5FA] font-medium flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Table Matrix →</span>
              </button>
            </div>

            <ResultsDashboard result={result} />
          </div>
        )}

        {/* TAB 3: DEDICATED HOURLY DISPATCH TABLE */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#374151]">
              <div>
                <h1 className="text-[24px] font-bold text-[#F9FAFB] tracking-tight">
                  24-Hour Dispatch Schedule
                </h1>
                <p className="text-[14px] text-[#94A3B8] mt-0.5">
                  Detailed hourly generation, storage charge/discharge, grid exchange, and cost breakdown.
                </p>
              </div>
            </div>

            <ScheduleTable result={result} />
          </div>
        )}

        {/* TAB 4: DEDICATED AUDIT LOG / HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#374151]">
              <div>
                <h1 className="text-[24px] font-bold text-[#F9FAFB] tracking-tight">
                  Audit Log & Saved Runs
                </h1>
                <p className="text-[14px] text-[#94A3B8] mt-0.5">
                  Historical optimization records persisted in PostgreSQL database.
                </p>
              </div>
            </div>

            <HistoryView
              historyList={historyList}
              onSelectHistoryItem={handleSelectHistoryItem}
            />
          </div>
        )}

      </main>

      {/* Architecture Modal */}
      <ArchitectureModal
        isOpen={isArchModalOpen}
        onClose={() => setIsArchModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-[#374151] bg-[#111827] py-4 text-center text-[12px] text-[#94A3B8]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>GridWise AI – Energy Optimization Platform</span>
          <span>Engine: <strong className="text-[#F9FAFB]">Google OR-Tools</strong> | NLP: <strong className="text-[#F9FAFB]">Gemini Flash</strong></span>
        </div>
      </footer>

    </div>
  );
}