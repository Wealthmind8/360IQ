
import React, { useState, useEffect } from 'react';
import { GameState, Level, CoachingFeedback, UserResponse, CognitiveProfile, HistoryEntry } from './types';
import { generateLevelContent, processLevelResponses } from './services/geminiService';
import { INITIAL_PROFILE } from './constants';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.WELCOME);
  const [currentLevel, setCurrentLevel] = useState<Level | null>(null);
  const [levelNumber, setLevelNumber] = useState(1);
  const [profile, setProfile] = useState<CognitiveProfile>(INITIAL_PROFILE);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [responses, setResponses] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [coaching, setCoaching] = useState<CoachingFeedback | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('iq360_state_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProfile(parsed.profile || INITIAL_PROFILE);
        setLevelNumber(parsed.levelNumber || 1);
        setHistory(parsed.history || []);
      } catch (e) {
        console.error("Failed to load saved state", e);
      }
    }
    setHasLoaded(true);
  }, []);

  useEffect(() => {
    if (hasLoaded) {
      localStorage.setItem('iq360_state_v2', JSON.stringify({ profile, levelNumber, history }));
    }
  }, [profile, levelNumber, history, hasLoaded]);

  const startLevel = async () => {
    setLoading(true);
    try {
      const level = await generateLevelContent(levelNumber, profile);
      setCurrentLevel(level);
      setResponses([]);
      setGameState(GameState.LEVEL_ACTIVE);
    } catch (error) {
      console.error("Failed to generate level:", error);
      alert("Intelligence threshold reached or connection lost. Retrying...");
    } finally {
      setLoading(false);
    }
  };

  const resumeGame = () => {
    startLevel();
  };

  const submitAnswers = async () => {
    if (!currentLevel) return;
    if (responses.length < currentLevel.questions.length) {
      alert("Please provide responses for all tasks to ensure cognitive accuracy.");
      return;
    }
    setLoading(true);
    try {
      const feedback = await processLevelResponses(levelNumber, responses, profile);
      setCoaching(feedback);
      
      const updatedProf = feedback.updatedProfile || profile;
      setProfile(updatedProf);

      // Add to history
      const newEntry: HistoryEntry = {
        levelNumber: levelNumber,
        timestamp: Date.now(),
        cii: updatedProf.cii,
        feedback: feedback,
        title: currentLevel.title
      };
      setHistory(prev => [...prev, newEntry]);
      
      setGameState(GameState.COACHING);
    } catch (error) {
      console.error("Failed to process responses:", error);
    } finally {
      setLoading(false);
    }
  };

  const proceedToNext = () => {
    setLevelNumber(prev => prev + 1);
    setGameState(GameState.WELCOME); // Back to start screen for the next one
  };

  const handleResponseChange = (id: string, value: string) => {
    setResponses(prev => {
      const filtered = prev.filter(r => r.questionId !== id);
      return [...filtered, { questionId: id, answer: value }];
    });
  };

  const resetGame = () => {
    if (confirm("This will erase all progress and history. Are you sure?")) {
      localStorage.removeItem('iq360_state_v2');
      setProfile(INITIAL_PROFILE);
      setLevelNumber(1);
      setHistory([]);
      setGameState(GameState.WELCOME);
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 font-sans">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setGameState(GameState.WELCOME)}
            className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20"
          >
            IQ
          </button>
          <h1 className="text-xl font-bold tracking-tight">360 <span className="text-zinc-500 font-medium">Cognitive Engine</span></h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setGameState(GameState.DASHBOARD)}
            className="hidden sm:flex items-center gap-2 px-4 py-2 hover:bg-zinc-800 rounded-xl transition-colors text-sm font-bold text-zinc-400"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            Stats
          </button>
          <button 
            onClick={() => setGameState(GameState.HISTORY)}
            className="hidden sm:flex items-center gap-2 px-4 py-2 hover:bg-zinc-800 rounded-xl transition-colors text-sm font-bold text-zinc-400"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            History
          </button>
          <div className="w-[1px] h-6 bg-zinc-800 mx-2 hidden sm:block" />
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-6 md:p-12">
        {gameState === GameState.WELCOME && (
          <div className="max-w-2xl mx-auto text-center space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-4 pt-12">
              <h2 className="text-6xl md:text-7xl font-black text-white leading-[1.1] tracking-tighter">
                Master Your <span className="text-indigo-500">Mind.</span>
              </h2>
              <p className="text-zinc-500 text-xl font-medium leading-relaxed max-w-lg mx-auto">
                {levelNumber > 1 
                  ? `You are currently at Level ${levelNumber}. Your mind has evolved significantly since you started.` 
                  : "Experience the world's most advanced cognitive evaluation simulation. 30 Tiers of intelligence design."}
              </p>
            </div>
            
            <div className="flex flex-col gap-4">
              <button 
                onClick={resumeGame}
                disabled={loading}
                className="group relative px-12 py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl text-2xl font-black shadow-2xl shadow-indigo-600/30 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50 overflow-hidden"
              >
                <div className="relative z-10 flex items-center justify-center gap-3">
                  {loading ? "FAST-LOADING..." : (levelNumber > 1 ? `RESUME LEVEL ${levelNumber}` : "INITIALIZE LEVEL 1")}
                  <svg className="w-6 h-6 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </button>
              
              {levelNumber > 1 && (
                <button 
                  onClick={() => setGameState(GameState.DASHBOARD)}
                  className="px-8 py-3 text-zinc-500 hover:text-white font-bold transition-colors"
                >
                  VIEW PROGRESS REPORT
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8 opacity-60">
              <div className="p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800 text-center">
                <div className="text-xs font-black text-zinc-600 uppercase tracking-[0.2em] mb-3">Precision</div>
                <div className="text-lg font-bold text-zinc-300">Fluid Logic</div>
              </div>
              <div className="p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800 text-center">
                <div className="text-xs font-black text-zinc-600 uppercase tracking-[0.2em] mb-3">Judgment</div>
                <div className="text-lg font-bold text-zinc-300">Decision Science</div>
              </div>
              <div className="p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800 text-center">
                <div className="text-xs font-black text-zinc-600 uppercase tracking-[0.2em] mb-3">Control</div>
                <div className="text-lg font-bold text-zinc-300">Stress Response</div>
              </div>
            </div>
          </div>
        )}

        {gameState === GameState.LEVEL_ACTIVE && currentLevel && (
          <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-500">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="px-4 py-2 bg-zinc-800 rounded-xl text-xs font-black text-zinc-400 tracking-widest uppercase">Level {levelNumber}</span>
                  <div className="w-[1px] h-4 bg-zinc-800" />
                  <span className="text-zinc-600 text-sm font-bold uppercase tracking-widest">Active Scenario</span>
                </div>
                <div className="text-indigo-500 text-xs font-bold uppercase tracking-widest">Tier {Math.ceil(levelNumber / 3)}</div>
              </div>
              <h2 className="text-4xl font-black text-white tracking-tight">{currentLevel.title}</h2>
              <div className="relative">
                <div className="absolute -left-6 top-0 bottom-0 w-1 bg-indigo-500 rounded-full" />
                <p className="text-xl text-zinc-400 leading-relaxed italic">
                  "{currentLevel.scenarioIntroduction}"
                </p>
              </div>
            </div>

            <div className="space-y-10">
              {currentLevel.questions.map((q, idx) => (
                <div key={q.id} className="space-y-5 animate-in slide-in-from-left duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                  <div className="flex gap-6">
                    <span className="flex-none w-10 h-10 rounded-2xl bg-zinc-800 text-zinc-400 flex items-center justify-center font-black text-sm border border-zinc-700 shadow-xl">
                      0{idx + 1}
                    </span>
                    <div className="space-y-4 flex-1">
                      <p className="text-2xl font-bold text-zinc-100 leading-tight tracking-tight">{q.text}</p>
                      <textarea
                        className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-3xl p-6 text-zinc-200 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-zinc-700 min-h-[140px] text-lg font-medium"
                        placeholder="Detail your cognitive approach..."
                        onChange={(e) => handleResponseChange(q.id, e.target.value)}
                        value={responses.find(r => r.questionId === q.id)?.answer || ''}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-12 flex justify-end">
              <button 
                onClick={submitAnswers}
                disabled={loading}
                className="px-12 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-black text-xl transition-all disabled:opacity-50 flex items-center gap-4 shadow-2xl shadow-indigo-600/40"
              >
                {loading ? "FAST-SYNCING..." : "ANALYZE RESPONSES"}
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </button>
            </div>
          </div>
        )}

        {gameState === GameState.COACHING && coaching && (
          <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-emerald-500/20 text-emerald-500 rounded-2xl flex items-center justify-center shadow-xl border border-emerald-500/30">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                </div>
                <div>
                  <h2 className="text-4xl font-black text-white tracking-tight">Intelligence Report</h2>
                  <p className="text-zinc-500 font-bold text-sm uppercase tracking-widest">Level {levelNumber} Evaluated</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FeedbackCard title="Thinking Insight" content={coaching.thinkingInsight} icon="🧠" color="indigo" />
              <FeedbackCard title="Life Dynamics" content={coaching.lifeApplication} icon="🌿" color="emerald" />
              <FeedbackCard title="Business Execution" content={coaching.businessApplication} icon="💼" color="amber" />
              <FeedbackCard title="Strategic Advice" content={coaching.coachRecommendation} icon="🎯" color="rose" />
            </div>

            <div className="bg-indigo-600/5 border border-indigo-500/20 p-8 rounded-[32px] space-y-4">
              <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest">Summary Conclusion</h3>
              <p className="text-2xl font-bold text-zinc-100 leading-tight italic">"{coaching.levelProgressSummary}"</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-8 border-t border-zinc-900">
              <button 
                onClick={() => setGameState(GameState.DASHBOARD)}
                className="px-8 py-4 text-zinc-500 hover:text-white font-bold flex items-center gap-3 transition-colors text-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                VIEW DASHBOARD
              </button>
              <button 
                onClick={proceedToNext}
                className="w-full sm:w-auto px-12 py-5 bg-white text-zinc-950 hover:bg-zinc-200 rounded-3xl font-black text-xl transition-all shadow-2xl"
              >
                PROCEED TO LEVEL {levelNumber + 1}
              </button>
            </div>
          </div>
        )}

        {gameState === GameState.DASHBOARD && (
          <div className="space-y-12 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-4xl font-black text-white tracking-tighter">Cognitive Profile</h2>
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Analytics & Domain Performance</p>
              </div>
              <button 
                onClick={() => coaching ? setGameState(GameState.COACHING) : setGameState(GameState.WELCOME)}
                className="p-3 bg-zinc-900 hover:bg-zinc-800 rounded-2xl text-zinc-400 hover:text-white transition-all border border-zinc-800"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <Dashboard profile={profile} history={history} />
            
            <div className="flex justify-center pt-8">
              <button 
                onClick={() => {
                   if (coaching) {
                      proceedToNext();
                   } else {
                      resumeGame();
                   }
                }}
                className="px-16 py-6 bg-indigo-600 text-white rounded-3xl font-black text-2xl shadow-2xl shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all"
              >
                CONTINUE EVOLUTION
              </button>
            </div>
          </div>
        )}

        {gameState === GameState.HISTORY && (
          <div className="space-y-10 animate-in fade-in duration-500 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-4xl font-black text-white tracking-tighter">Evolution Log</h2>
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Your Historical Thinking Patterns</p>
              </div>
              <button 
                onClick={() => setGameState(GameState.WELCOME)}
                className="p-3 bg-zinc-900 hover:bg-zinc-800 rounded-2xl text-zinc-400 hover:text-white transition-all border border-zinc-800"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            {history.length > 0 ? (
              <div className="space-y-6">
                {history.slice().reverse().map((entry, idx) => (
                  <div key={idx} className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl hover:border-zinc-700 transition-all group">
                    <div className="flex justify-between items-start mb-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg text-xs font-black uppercase tracking-widest">Level {entry.levelNumber}</span>
                          <span className="text-zinc-600 font-mono text-xs">{new Date(entry.timestamp).toLocaleString()}</span>
                        </div>
                        <h3 className="text-2xl font-black text-white group-hover:text-indigo-400 transition-colors">{entry.title}</h3>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-black text-white">{entry.cii}</div>
                        <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">CII Score</div>
                      </div>
                    </div>
                    <p className="text-zinc-400 leading-relaxed italic border-l-2 border-zinc-800 pl-4">
                      {entry.feedback.levelProgressSummary}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-24 text-center space-y-4">
                <div className="text-6xl opacity-20">📜</div>
                <h3 className="text-2xl font-bold text-zinc-600">No history found.</h3>
                <p className="text-zinc-500">Complete your first level to start your evolution log.</p>
                <button onClick={startLevel} className="mt-4 px-8 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl font-bold transition-all">Start Level 1</button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-zinc-900/50 text-center">
        <p className="text-[10px] text-zinc-700 font-black tracking-[0.4em] uppercase">
          &copy; Wealthmind Psychology 2026 — Advanced Cognitive Architecture
        </p>
      </footer>

      {/* Profile Sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsSidebarOpen(false)} />
          <aside className="relative w-full max-w-md bg-zinc-900 h-full shadow-2xl p-10 border-l border-zinc-800 animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between mb-12">
              <h3 className="text-2xl font-black text-white tracking-tight">System Status</h3>
              <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="space-y-10">
              <div className="flex items-center gap-6">
                <div className="flex-1 text-center p-8 bg-zinc-950 rounded-3xl border border-zinc-800 shadow-xl">
                  <div className="text-6xl font-black text-white mb-2">{profile.cii}</div>
                  <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">CII Index</div>
                </div>
                <div className="flex-1 text-center p-8 bg-zinc-950 rounded-3xl border border-zinc-800 shadow-xl">
                  <div className="text-6xl font-black text-indigo-500 mb-2">{levelNumber}</div>
                  <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Progress Tier</div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Cognitive State</h4>
                <div className="p-6 bg-zinc-800/50 rounded-3xl border border-zinc-700/50 space-y-2">
                  <div className="text-white font-black text-xl leading-tight">{profile.thinkingStyle}</div>
                  <div className="text-zinc-400 text-sm font-medium">
                    {Math.ceil(levelNumber / 3) * 10}% Synchronization Complete
                  </div>
                  <div className="w-full h-2 bg-zinc-900 rounded-full mt-4 overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 transition-all duration-1000" 
                      style={{ width: `${(levelNumber / 30) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-12">
                <button 
                  onClick={() => { setIsSidebarOpen(false); setGameState(GameState.DASHBOARD); }}
                  className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all border border-zinc-700"
                >
                  EXPAND ANALYTICS
                </button>
                <button 
                  onClick={resetGame}
                  className="w-full py-4 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white text-xs font-black rounded-2xl border border-rose-500/20 transition-all"
                >
                  PURGE NEURAL HISTORY
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-950/95 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="relative w-32 h-32 mb-10">
            <div className="absolute inset-0 border-[6px] border-zinc-900 rounded-[40px] rotate-45" />
            <div className="absolute inset-0 border-[6px] border-indigo-500 rounded-[40px] border-t-transparent border-l-transparent animate-spin rotate-45" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-white font-black tracking-[0.3em] uppercase text-sm animate-pulse">Calculating Synaptic Weights</p>
            <p className="text-zinc-500 font-bold text-[11px] uppercase tracking-widest">Ultra-Fast Generation Active (6-10s Target)</p>
            <p className="text-zinc-600 font-mono text-[10px]">Accessing Cognitive Engine V.4.2...</p>
          </div>
        </div>
      )}
    </div>
  );
};

const FeedbackCard: React.FC<{ title: string; content: string; icon: string; color: string }> = ({ title, content, icon, color }) => {
  const colorMap: any = {
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };
  
  return (
    <div className="bg-zinc-900/80 border border-zinc-800 p-8 rounded-[32px] space-y-4 transition-all hover:border-zinc-700 hover:-translate-y-1 shadow-xl">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl border ${colorMap[color]}`}>
          {icon}
        </div>
        <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest">{title}</h3>
      </div>
      <p className="text-zinc-200 leading-relaxed font-medium text-lg">{content}</p>
    </div>
  );
};

export default App;
