import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
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
        const initialRes = await runOptimization(DEFAULT_SCENARIOS.default, [], 'Initial benchmark baseline');
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
        showToast(`Parsed ${res.directives.length} directive(s) via Gemini Flash.`);
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

      showToast(`Optimal dispatch found! Saved $${res.savings_amount.toFixed(2)} (+${res.savings_pct.toFixed(1)}%).`);
      setActiveTab('dashboard');
    } catch (err) {
      console.error('Optimization run error:', err);
      showToast('Optimization failed. Check scenario constraints.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Run
  const handleQuickRun = async (presetPrompt) => {
    setOperatorPrompt(presetPrompt);
    setIsLoading(true);
    try {
      const parsedRes = await parseNaturalLanguagePrompt(presetPrompt);
      const parsedDirs = parsedRes?.directives || [];
      setDirectives(parsedDirs);

      const res = await runOptimization(DEFAULT_SCENARIOS.default, parsedDirs, presetPrompt);
      setResult(res);
      saveLocalHistory(res, DEFAULT_SCENARIOS.default, parsedDirs, presetPrompt);

      const updatedHistory = await fetchHistory();
      setHistoryList(updatedHistory);

      showToast(`Solar contingency simulated! Saved $${res.savings_amount.toFixed(2)}.`);
      setActiveTab('dashboard');
    } catch (err) {
      console.error('Quick run error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Select History
  const handleSelectHistoryItem = (item) => {
    if (item.hourly_schedule) {
      setResult(item);
      setOperatorPrompt(item.raw_prompt || '');
      if (item.directives_applied) {
        setDirectives(item.directives_applied);
      }
      setActiveTab('dashboard');
      showToast(`Loaded historical record: ${item.scenario_name}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1220] text-[#F9FAFB] flex flex-col font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-[10px] border border-[#374151] bg-[#111827] text-[13px] text-[#F9FAFB] shadow-lg flex items-center space-x-2">
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

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Context Bar */}
        <HeroSection
          scenario={scenario}
          onQuickRun={handleQuickRun}
        />

        {/* Tab Content */}
        {activeTab === 'optimizer' && (
          <div className="space-y-6">
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

            {/* Latest Result Summary */}
            {result && (
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[14px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                    Latest Solved Dispatch Overview
                  </h3>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="text-[13px] text-[#2563EB] hover:underline font-medium cursor-pointer"
                  >
                    View Complete Analytics Charts →
                  </button>
                </div>
                <ResultsDashboard result={result} />
              </div>
            )}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <ResultsDashboard result={result} />
        )}

        {activeTab === 'schedule' && (
          <ScheduleTable result={result} />
        )}

        {activeTab === 'history' && (
          <HistoryView
            historyList={historyList}
            onSelectHistoryItem={handleSelectHistoryItem}
          />
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
          <span>GridWise AI – Enterprise Energy Management Platform</span>
          <span>Engine: <strong className="text-[#F9FAFB]">Google OR-Tools</strong> | NLP: <strong className="text-[#F9FAFB]">Gemini Flash</strong></span>
        </div>
      </footer>

    </div>
  );
}