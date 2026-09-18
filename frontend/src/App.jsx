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
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Check health and load initial optimization
  useEffect(() => {
    async function init() {
      const health = await checkBackendHealth();
      setBackendStatus(health.status === 'healthy' ? 'healthy' : 'simulation');
      
      const history = await fetchHistory();
      setHistoryList(history);

      // Perform initial benchmark solve so graphs are populated immediately
      try {
        const initialRes = await runOptimization(DEFAULT_SCENARIOS.default, [], 'Benchmark initial run');
        setResult(initialRes);
      } catch (e) {
        console.error('Initial solve error:', e);
      }
    }
    init();
  }, []);

  // Parse natural language operator notes via Gemini
  const handleParseDirectives = async (promptText) => {
    if (!promptText || !promptText.trim()) return;
    setIsParsingDirectives(true);
    try {
      const res = await parseNaturalLanguagePrompt(promptText);
      if (res && res.directives) {
        setDirectives(res.directives);
        showToast(`Parsed ${res.directives.length} operational directive(s) via Gemini Flash.`);
      }
    } catch (err) {
      console.error('Parse error:', err);
      showToast('Failed to parse directives.');
    } finally {
      setIsParsingDirectives(false);
    }
  };

  // Run full Google OR-Tools optimization
  const handleRunOptimization = async () => {
    setIsLoading(true);
    try {
      let currentDirectives = directives;
      
      // If user typed a prompt but hasn't explicitly clicked "Parse", parse it first
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
      
      // Refresh history
      const updatedHistory = await fetchHistory();
      setHistoryList(updatedHistory);

      showToast(`Optimization completed! Saved $${res.savings_amount.toFixed(2)} (${res.savings_pct.toFixed(1)}%).`);
      setActiveTab('dashboard');
    } catch (err) {
      console.error('Optimization run error:', err);
      showToast('Optimization failed. Check scenario constraints.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Run from Hero section
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

      showToast(`Simulated solar reduction scenario! Saved $${res.savings_amount.toFixed(2)}.`);
      setActiveTab('dashboard');
    } catch (err) {
      console.error('Quick run error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Reload past history item into result dashboard
  const handleSelectHistoryItem = (item) => {
    if (item.hourly_schedule) {
      setResult(item);
      setOperatorPrompt(item.raw_prompt || '');
      if (item.directives_applied) {
        setDirectives(item.directives_applied);
      }
      setActiveTab('dashboard');
      showToast(`Loaded optimization: ${item.scenario_name}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 glass-panel-glow px-4 py-3 rounded-xl border border-cyan-500/40 text-xs font-semibold text-cyan-200 shadow-2xl flex items-center space-x-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        backendStatus={backendStatus}
        onOpenArchModal={() => setIsArchModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        
        {/* Hero Section */}
        <HeroSection
          onQuickRun={handleQuickRun}
          onOpenArchModal={() => setIsArchModalOpen(true)}
        />

        {/* Tab Content */}
        {activeTab === 'optimizer' && (
          <div className="space-y-8 animate-fadeIn">
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

            {/* Live Results Preview Below Console */}
            {result && (
              <div className="pt-6 border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-white">Latest Optimal Dispatch Summary</h3>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="text-xs font-semibold text-cyan-400 hover:underline"
                  >
                    View Full Interactive Charts →
                  </button>
                </div>
                <ResultsDashboard result={result} />
              </div>
            )}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="animate-fadeIn">
            <ResultsDashboard result={result} />
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="animate-fadeIn">
            <ScheduleTable result={result} />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="animate-fadeIn">
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
      <footer className="glass-panel border-t border-slate-800/80 mt-12 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>GridWise AI – Enterprise Energy Optimization & Microgrid Dispatch Platform</span>
          <span className="text-slate-400">Powered by <strong>Gemini Flash</strong> + <strong>Google OR-Tools</strong> + <strong>Supabase</strong></span>
        </div>
      </footer>

    </div>
  );
}
