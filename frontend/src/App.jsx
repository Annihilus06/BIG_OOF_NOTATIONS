import React, { useState, useEffect } from 'react';
import { 
  Menu, Plus, ArrowLeft
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import ChatPromptView from './components/ChatPromptView';
import ResultsDashboard from './components/ResultsDashboard';
import ScheduleTable from './components/ScheduleTable';
import HistoryView from './components/HistoryView';
import { DEFAULT_SCENARIOS } from './lib/presets';
import { 
  checkBackendHealth, 
  parseNaturalLanguagePrompt, 
  runOptimization, 
  fetchHistory, 
  saveLocalHistory 
} from './lib/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('optimizer'); // 'optimizer' | 'dashboard' | 'schedule' | 'history'
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [scenario, setScenario] = useState(DEFAULT_SCENARIOS.default);
  const [directives, setDirectives] = useState([]);
  const [operatorPrompt, setOperatorPrompt] = useState('');
  const [result, setResult] = useState(null); // Starts empty (no demo data)
  const [historyList, setHistoryList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isParsingDirectives, setIsParsingDirectives] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initial load: check health and fetch real history only (NO fake demo data generation)
  useEffect(() => {
    async function init() {
      const health = await checkBackendHealth();
      setBackendStatus(health.status === 'healthy' ? 'healthy' : 'simulation');
      
      const history = await fetchHistory();
      setHistoryList(history);
    }
    init();
  }, []);

  // Parse natural language directives via Gemini
  const handleParseDirectives = async (promptText) => {
    if (!promptText || !promptText.trim()) return;
    setIsParsingDirectives(true);
    try {
      const res = await parseNaturalLanguagePrompt(promptText);
      if (res && res.directives) {
        setDirectives(res.directives);
        showToast(`Gemini extracted ${res.directives.length} operational constraint(s).`);
      }
    } catch (err) {
      console.error('Directive parse error:', err);
      showToast('Directive parsing failed, using fallback.');
    } finally {
      setIsParsingDirectives(false);
    }
  };

  // Run OR-Tools Optimization and transition to the next page!
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

      showToast(`Optimal dispatch found! Saved ?${(res.savings_amount_bdt || res.savings_amount || 0).toFixed(2)} (+${res.savings_pct.toFixed(1)}%).`);
      
      // PRODUCE OUTPUT AND GRAPH IN NEXT PAGE:
      setActiveTab('dashboard');
    } catch (err) {
      console.error('Optimization solve error:', err);
      showToast('Optimization failed. Check scenario constraints.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewOptimization = () => {
    setOperatorPrompt('');
    setDirectives([]);
    setScenario(DEFAULT_SCENARIOS.default);
    setResult(null);
    setActiveTab('optimizer');
  };

  const handleClearHistory = () => {
    localStorage.removeItem('gridwise_history');
    setHistoryList([]);
    showToast('History cleared.');
  };

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
    <div className="min-h-screen bg-[#111111] text-[#ececec] flex font-sans overflow-x-hidden">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl border border-[#333] bg-[#1a1a1a] text-xs font-mono text-slate-200 shadow-2xl flex items-center space-x-2 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-sky-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ChatGPT-Style Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewOptimization={handleNewOptimization}
        scenario={scenario}
        setScenario={setScenario}
        presetScenarios={DEFAULT_SCENARIOS}
        historyList={historyList}
        onSelectHistoryItem={handleSelectHistoryItem}
        onClearHistory={handleClearHistory}
        backendStatus={backendStatus}
      />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-200 ${isSidebarOpen ? 'lg:pl-64' : 'pl-0'}`}>
        
        {/* Top Minimalist Navigation Bar */}
        <header className="sticky top-0 z-30 h-14 bg-[#111111]/90 backdrop-blur-md border-b border-[#222222] px-4 flex items-center justify-between">
          
          {/* Left: Sidebar Toggle & New Optimization icon */}
          <div className="flex items-center space-x-2">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#212121] transition-colors cursor-pointer"
                title="Open Sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={handleNewOptimization}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#212121] hover:bg-[#2c2c2c] text-slate-200 text-xs font-medium border border-[#2f2f2f] transition-all cursor-pointer"
              title="New Optimization"
            >
              <Plus className="w-3.5 h-3.5 text-sky-400" />
              <span>New Optimization</span>
            </button>
          </div>

          {/* Center: View Switcher */}
          <div className="flex items-center p-1 rounded-full bg-[#1c1c1c] border border-[#2e2e2e] text-xs">
            <button
              onClick={() => setActiveTab('optimizer')}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                activeTab === 'optimizer' ? 'bg-[#2f2f2f] text-white font-medium shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Prompt Console
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                activeTab === 'dashboard' ? 'bg-[#2f2f2f] text-white font-medium shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Telemetry & Graphs
            </button>

            <button
              onClick={() => setActiveTab('schedule')}
              className={`hidden sm:inline-block px-3 py-1 rounded-full transition-all cursor-pointer ${
                activeTab === 'schedule' ? 'bg-[#2f2f2f] text-white font-medium shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              24h Schedule
            </button>
          </div>

          {/* Right Status Indicator */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#1c1c1c] border border-[#2e2e2e] text-[11px] font-mono">
              <span className={`w-2 h-2 rounded-full ${backendStatus === 'healthy' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className="text-slate-300 hidden sm:inline">{backendStatus === 'healthy' ? 'OR-Tools Engine Live' : 'Simulation'}</span>
            </div>
          </div>

        </header>

        {/* Page Content Router */}
        <main className="flex-1 flex flex-col px-4 sm:px-6 py-4">
          
          {/* PAGE 1: CHATGPT-STYLE PROMPT VIEW */}
          {activeTab === 'optimizer' && (
            <ChatPromptView
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
              backendStatus={backendStatus}
            />
          )}

          {/* PAGE 2: TELEMETRY, ANALYTICS OUTPUTS & GRAPHS */}
          {activeTab === 'dashboard' && (
            <ResultsDashboard 
              result={result} 
              onBackToConsole={() => setActiveTab('optimizer')}
              onNewRun={handleNewOptimization}
            />
          )}

          {/* PAGE 3: 24-HOUR DISPATCH SCHEDULE MATRIX */}
          {activeTab === 'schedule' && (
            <div className="max-w-7xl w-full mx-auto space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
                <div>
                  <h1 className="text-xl font-bold text-white">24-Hour Dispatch Schedule</h1>
                  <p className="text-xs text-slate-400">Complete hourly SCADA power matrix and pricing</p>
                </div>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="text-xs text-sky-400 hover:underline font-mono"
                >
                  [VIEW GRAPHS ?]
                </button>
              </div>
              <ScheduleTable result={result} />
            </div>
          )}

          {/* PAGE 4: AUDIT LOG / HISTORY */}
          {activeTab === 'history' && (
            <div className="max-w-7xl w-full mx-auto space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
                <div>
                  <h1 className="text-xl font-bold text-white">Audit Log & Saved Scenarios</h1>
                  <p className="text-xs text-slate-400">Database historical records and audit logs</p>
                </div>
              </div>
              <HistoryView
                historyList={historyList}
                onSelectHistoryItem={handleSelectHistoryItem}
              />
            </div>
          )}

        </main>

      </div>

    </div>
  );
}
