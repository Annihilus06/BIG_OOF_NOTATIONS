import React, { useState, useEffect } from 'react';
import { 
  Menu, Plus
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
  saveLocalHistory,
  isValidOperatorPrompt
} from './lib/api';

function getTabFromUrl() {
  const path = window.location.pathname.toLowerCase().replace(/\/$/, '');
  const hash = window.location.hash.toLowerCase();
  
  if (path === '/output' || path === '/results' || hash === '#/output' || hash === '#output' || hash === '#results') {
    return 'dashboard';
  }
  if (path === '/schedule' || hash === '#/schedule' || hash === '#schedule') {
    return 'schedule';
  }
  if (path === '/history' || hash === '#/history' || hash === '#history') {
    return 'history';
  }
  return 'optimizer';
}

export default function App() {
  const [activeTab, setActiveTab] = useState(getTabFromUrl()); // 'optimizer' (/) | 'dashboard' (/output) | 'schedule' (/schedule) | 'history' (/history)
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
    setTimeout(() => setToastMessage(null), 4000);
  };

  const navigateTo = (tab, updateHistory = true) => {
    setActiveTab(tab);
    if (updateHistory) {
      let path = '/';
      if (tab === 'dashboard') path = '/output';
      else if (tab === 'schedule') path = '/schedule';
      else if (tab === 'history') path = '/history';
      window.history.pushState({ tab }, '', path);
    }
  };

  // Listen to browser Back/Forward buttons for distinct hyperlink navigation
  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(getTabFromUrl());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Initial load: check health and fetch history
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
    
    if (!isValidOperatorPrompt(promptText)) {
      showToast(`Could not understand: "${promptText}". Please enter a valid operational constraint.`);
      return;
    }

    setIsParsingDirectives(true);
    try {
      const res = await parseNaturalLanguagePrompt(promptText);
      if (res && res.success === false) {
        showToast(res.error || `Unrecognized instruction: "${promptText}".`);
        return;
      }

      if (res && res.directives && res.directives.length > 0) {
        setDirectives(res.directives);
        showToast(`Extracted ${res.directives.length} operational constraint(s).`);
      } else {
        showToast('No active dispatch constraints detected.');
      }
    } catch (err) {
      console.error('Directive parse error:', err);
      showToast('Directive parsing failed.');
    } finally {
      setIsParsingDirectives(false);
    }
  };

  // Run OR-Tools Optimization and navigate to /output URL!
  const handleRunOptimization = async () => {
    // If prompt has text, validate it first!
    if (operatorPrompt.trim().length > 0 && !isValidOperatorPrompt(operatorPrompt)) {
      showToast(`Could not understand directive: "${operatorPrompt}". Please enter a valid operational constraint or clear the prompt.`);
      return;
    }

    setIsLoading(true);
    try {
      let currentDirectives = directives;
      
      if (operatorPrompt.trim() && directives.length === 0) {
        const parsedRes = await parseNaturalLanguagePrompt(operatorPrompt);
        if (parsedRes && parsedRes.success === false) {
          showToast(parsedRes.error || `Unrecognized instruction: "${operatorPrompt}".`);
          setIsLoading(false);
          return;
        }
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

      showToast(`Optimal dispatch found! Saved BDT ${(res.savings_amount_bdt || res.savings_amount || 0).toFixed(2)} (+${res.savings_pct.toFixed(1)}%).`);
      
      // NAVIGATE TO DISTINCT HYPERLINK: /output
      navigateTo('dashboard');
    } catch (err) {
      console.error('Optimization solve error:', err);
      showToast('Optimization failed. Check scenario constraints.');
    } finally {
      setIsLoading(false);
    }
  };

  const [promptViewKey, setPromptViewKey] = useState(0);

  const handleNewOptimization = () => {
    setOperatorPrompt('');
    setDirectives([]);
    setScenario(DEFAULT_SCENARIOS.default);
    setResult(null);
    setPromptViewKey(prev => prev + 1);
    navigateTo('optimizer'); // Navigates to /
    showToast('Ready for new optimization.');
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
      navigateTo('dashboard'); // Navigates to /output
      showToast(`Loaded scenario: ${item.scenario_name}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#111111] text-[#ececec] flex font-sans overflow-x-hidden">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md px-4 py-3 rounded-xl border border-[#333] bg-[#1a1a1a] text-xs font-mono text-slate-200 shadow-2xl flex items-center space-x-2.5 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ChatGPT-Style Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        activeTab={activeTab}
        setActiveTab={navigateTo}
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
        
        {/* Top Minimalist Navigation Bar with Distinct Hyperlinks */}
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

            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                handleNewOptimization();
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#212121] hover:bg-[#2c2c2c] text-slate-200 text-xs font-medium border border-[#2f2f2f] transition-all cursor-pointer"
              title="New Optimization Prompt"
            >
              <Plus className="w-3.5 h-3.5 text-sky-400" />
              <span>New Optimization</span>
            </a>
          </div>

          {/* Center: View Switcher Links */}
          <nav className="flex items-center p-1 rounded-full bg-[#1c1c1c] border border-[#2e2e2e] text-xs">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                navigateTo('optimizer');
              }}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                activeTab === 'optimizer' ? 'bg-[#2f2f2f] text-white font-medium shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Input Console
            </a>

            <a
              href="/output"
              onClick={(e) => {
                e.preventDefault();
                navigateTo('dashboard');
              }}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                activeTab === 'dashboard' ? 'bg-[#2f2f2f] text-white font-medium shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Output & Graphs
            </a>

            <a
              href="/schedule"
              onClick={(e) => {
                e.preventDefault();
                navigateTo('schedule');
              }}
              className={`hidden sm:inline-block px-3 py-1 rounded-full transition-all cursor-pointer ${
                activeTab === 'schedule' ? 'bg-[#2f2f2f] text-white font-medium shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              24h Schedule
            </a>
          </nav>

          {/* Right Status Indicator */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#1c1c1c] border border-[#2e2e2e] text-[11px] font-mono">
              <span className={`w-2 h-2 rounded-full ${backendStatus === 'healthy' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className="text-slate-300 hidden sm:inline">{backendStatus === 'healthy' ? 'OR-Tools Live' : 'Simulation'}</span>
            </div>
          </div>

        </header>

        {/* Page Content Router */}
        <main className="flex-1 flex flex-col px-4 sm:px-6 py-4">
          
          {/* PAGE 1: CHATGPT-STYLE INPUT PROMPT VIEW (URL: /) */}
          {activeTab === 'optimizer' && (
            <ChatPromptView
              key={promptViewKey}
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

          {/* PAGE 2: TELEMETRY, ANALYTICS OUTPUTS & GRAPHS (URL: /output) */}
          {activeTab === 'dashboard' && (
            <ResultsDashboard 
              result={result} 
              onBackToConsole={() => navigateTo('optimizer')}
              onNewRun={handleNewOptimization}
            />
          )}

          {/* PAGE 3: 24-HOUR DISPATCH SCHEDULE MATRIX (URL: /schedule) */}
          {activeTab === 'schedule' && (
            <div className="max-w-7xl w-full mx-auto space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
                <div>
                  <h1 className="text-xl font-bold text-white">24-Hour Dispatch Schedule</h1>
                  <p className="text-xs text-slate-400">Complete hourly SCADA power matrix and pricing</p>
                </div>
                <button
                  onClick={() => navigateTo('dashboard')}
                  className="text-xs text-sky-400 hover:underline font-mono"
                >
                  [VIEW GRAPHS ?]
                </button>
              </div>
              <ScheduleTable result={result} />
            </div>
          )}

          {/* PAGE 4: AUDIT LOG / HISTORY (URL: /history) */}
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
