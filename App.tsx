
import React, { useState, useEffect, useCallback } from 'react';
import { GameState, Level, CoachingFeedback, UserResponse, CognitiveProfile } from './types';
import { generateLevelContent, processLevelResponses } from './services/geminiService';
import { INITIAL_PROFILE } from './constants';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.WELCOME);
  const [currentLevel, setCurrentLevel] = useState<Level | null>(null);
  const [levelNumber, setLevelNumber] = useState(1);
  const [profile, setProfile] = useState<CognitiveProfile>(INITIAL_PROFILE);
  const [responses, setResponses] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [coaching, setCoaching] = useState<CoachingFeedback | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('iq360_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      setProfile(parsed.profile);
      setLevelNumber(parsed.levelNumber);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('iq360_state', JSON.stringify({ profile, levelNumber }));
  }, [profile, levelNumber]);

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

  const submitAnswers = async () => {
    if (responses.length < (currentLevel?.questions.length || 0)) {
      alert("Please provide responses for all tasks to ensure cognitive accuracy.");
      return;
    }
    setLoading(true);
    try {
      const feedback = await processLevelResponses(levelNumber, responses, profile);
      setCoaching(feedback);
      if (feedback.updatedProfile) {
        setProfile(feedback.updatedProfile);
      }
      setGameState(GameState.COACHING);
    } catch (error) {
      console.error("Failed to process responses:", error);
    } finally {
      setLoading(false);
    }
  };

  const nextLevel = () => {
    setLevelNumber(prev => prev + 1);
    setGameState(GameState.SUMMARY); // Could transition to dashboard or next start
  };

  const handleResponseChange = (id: string, value: string) => {
    setResponses(prev => {
      const filtered = prev.filter(r => r.questionId !== id);
      return [...filtered, { questionId: id, answer: value }];
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 font-sans">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            IQ
          </div>
          <h1 className="text-xl font-bold tracking-tight">360 <span className="text-zinc-500 font-medium">Cognitive Engine</span></h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs text-zinc-500 uppercase font-bold">CII Index</span>
            <span className="text-lg font-mono font-bold text-indigo-400">{profile.cii}</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-6 md:p-12">
        {gameState === GameState.WELCOME && (
          <div className="max-w-2xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-4">
              <h2 className="text-5xl md:text-6xl font-black text-white leading-tight">Decode Your <span className="text-indigo-500">Thinking.</span></h2>
              <p className="text-zinc-400 text-lg leading-relaxed">
                Welcome to IQ360. This is a psychologically grounded cognitive simulation designed to reveal how you think, decide, innovate, and apply intelligence.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-8">
              {[
                { title: "Fluid Logic", icon: "🧠" },
                { title: "Decision Science", icon: "⚖️" },
                { title: "Stress Logic", icon: "⚡" }
              ].map(item => (
                <div key={item.title} className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 text-center">
                  <div className="text-3xl mb-2">{item.icon}</div>
                  <div className="text-sm font-semibold text-zinc-300">{item.title}</div>
                </div>
              ))}
            </div>

            <button 
              onClick={startLevel}
              disabled={loading}
              className="px-12 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-lg font-bold shadow-xl shadow-indigo-600/30 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50"
            >
              {loading ? "INITIALIZING ENGINE..." : "START LEVEL 1"}
            </button>
          </div>
        )}

        {gameState === GameState.LEVEL_ACTIVE && currentLevel && (
          <div className="space-y-12 animate-in fade-in duration-500">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-zinc-800 rounded-md text-xs font-bold text-zinc-400 tracking-widest uppercase">Level {levelNumber}</span>
                <span className="text-zinc-600">/</span>
                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{currentLevel.title}</h2>
              </div>
              <p className="text-lg text-zinc-400 bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 italic leading-relaxed">
                "{currentLevel.scenarioIntroduction}"
              </p>
            </div>

            <div className="space-y-8">
              {currentLevel.questions.map((q, idx) => (
                <div key={q.id} className="space-y-4 group">
                  <div className="flex gap-4">
                    <span className="flex-none w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center font-bold text-sm">
                      {idx + 1}
                    </span>
                    <div className="space-y-4 flex-1">
                      <p className="text-xl font-medium text-zinc-100 group-hover:text-white transition-colors">{q.text}</p>
                      <textarea
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-zinc-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-zinc-600 min-h-[100px]"
                        placeholder="Enter your reasoning..."
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
                className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? "ANALYZING COGNITION..." : "SUBMIT FOR ANALYSIS"}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </button>
            </div>
          </div>
        )}

        {gameState === GameState.COACHING && coaching && (
          <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">Coaching Feedback</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FeedbackCard title="Thinking Insight" content={coaching.thinkingInsight} icon="🧠" />
              <FeedbackCard title="Life Application" content={coaching.lifeApplication} icon="🌿" />
              <FeedbackCard title="Business Application" content={coaching.businessApplication} icon="💼" />
              <FeedbackCard title="Coach Recommendation" content={coaching.coachRecommendation} icon="🎯" />
            </div>

            <div className="bg-indigo-600/10 border border-indigo-500/30 p-6 rounded-2xl space-y-2">
              <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest">Progress Summary</h3>
              <p className="text-zinc-200 leading-relaxed italic">{coaching.levelProgressSummary}</p>
            </div>

            <div className="flex justify-between items-center pt-8 border-t border-zinc-800">
              <button 
                onClick={() => setGameState(GameState.DASHBOARD)}
                className="text-zinc-400 hover:text-white font-medium flex items-center gap-2 transition-colors"
              >
                View Updated Dashboard
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
              </button>
              <button 
                onClick={startLevel}
                className="px-8 py-4 bg-white text-zinc-950 hover:bg-zinc-200 rounded-xl font-bold transition-all shadow-lg"
              >
                PROCEED TO LEVEL {levelNumber + 1}
              </button>
            </div>
          </div>
        )}

        {gameState === GameState.DASHBOARD && (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black text-white">Cognitive Dashboard</h2>
              <button 
                onClick={() => setGameState(GameState.COACHING)}
                className="text-zinc-400 hover:text-white flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                Back to Feedback
              </button>
            </div>
            <Dashboard profile={profile} />
            <div className="flex justify-center">
              <button 
                onClick={() => {
                   setLevelNumber(prev => prev + 1);
                   startLevel();
                }}
                className="px-12 py-5 bg-indigo-600 text-white rounded-full font-black text-lg shadow-2xl shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all"
              >
                CONTINUE EVOLUTION
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-zinc-900 text-center">
        <p className="text-xs text-zinc-600 font-medium tracking-widest uppercase">
          &copy; Wealthmind Psychology 2026
        </p>
      </footer>

      {/* Profile Sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
          <aside className="relative w-full max-w-sm bg-zinc-900 h-full shadow-2xl p-8 border-l border-zinc-800 animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-white">Profile Overview</h3>
              <button onClick={() => setIsSidebarOpen(false)} className="text-zinc-500 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="space-y-8">
              <div className="text-center p-6 bg-zinc-950 rounded-2xl border border-zinc-800">
                <div className="text-5xl font-black text-white mb-2">{profile.cii}</div>
                <div className="text-xs font-black text-zinc-500 uppercase tracking-widest">Composite Index</div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest">Current Tier</h4>
                <div className="p-4 bg-zinc-800 rounded-xl border border-zinc-700">
                  <div className="text-indigo-400 font-bold">Tier {Math.ceil(levelNumber / 3)}</div>
                  <div className="text-zinc-400 text-sm">
                    { [
                      "Logic & Attention", "Decision & Intent", "Executive Function", "Innovation", "Stress Logic", 
                      "Resource Intel", "Leadership & Ethics", "Systems Thinking", "Flexibility", "Life Mastery"
                    ][Math.ceil(levelNumber / 3) - 1] }
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                 <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest">Cognitive Style</h4>
                 <div className="text-lg font-bold text-white leading-tight">
                   {profile.thinkingStyle}
                 </div>
              </div>
              
              <div className="pt-8">
                <button 
                  onClick={() => {
                    localStorage.removeItem('iq360_state');
                    window.location.reload();
                  }}
                  className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-bold rounded-xl border border-red-500/20 transition-all"
                >
                  RESET COGNITIVE JOURNEY
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-24 h-24 mb-6">
            <div className="absolute inset-0 border-4 border-zinc-800 rounded-full" />
            <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin" />
          </div>
          <p className="text-zinc-400 font-medium tracking-widest animate-pulse uppercase">Synchronizing Neural Patterns</p>
        </div>
      )}
    </div>
  );
};

const FeedbackCard: React.FC<{ title: string; content: string; icon: string }> = ({ title, content, icon }) => (
  <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-3 transition-all hover:border-zinc-700">
    <div className="flex items-center gap-2">
      <span className="text-xl">{icon}</span>
      <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest">{title}</h3>
    </div>
    <p className="text-zinc-200 leading-relaxed">{content}</p>
  </div>
);

export default App;
