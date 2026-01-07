
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { CognitiveProfile, HistoryEntry } from '../types';

interface DashboardProps {
  profile: CognitiveProfile;
  history: HistoryEntry[];
}

const Dashboard: React.FC<DashboardProps> = ({ profile, history }) => {
  const radarData = [
    { subject: 'Logic', A: profile.scores.logicalReasoning, fullMark: 100 },
    { subject: 'Executive', A: profile.scores.executiveFunction, fullMark: 100 },
    { subject: 'Innovation', A: profile.scores.innovationIndex, fullMark: 100 },
    { subject: 'Emotion', A: profile.scores.emotionalRegulation, fullMark: 100 },
    { subject: 'Strategy', A: profile.scores.strategicThinking, fullMark: 100 },
    { subject: 'Consistency', A: profile.scores.decisionConsistency, fullMark: 100 },
  ];

  const barData = Object.entries(profile.scores).map(([key, value]) => ({
    name: key.replace(/([A-Z])/g, ' $1').trim(),
    score: value,
  }));

  const trendData = history.map(entry => ({
    level: `L${entry.levelNumber}`,
    cii: entry.cii,
  }));

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Stats */}
        <div className="lg:col-span-1 p-8 bg-zinc-900 rounded-3xl border border-zinc-800 shadow-2xl space-y-8">
          <div>
            <h2 className="text-zinc-500 text-xs uppercase tracking-widest font-bold mb-2">Composite Index</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-7xl font-black text-white tracking-tighter">{profile.cii}</span>
              <span className="text-indigo-500 font-mono font-bold">CII</span>
            </div>
          </div>

          <div>
            <h2 className="text-zinc-500 text-xs uppercase tracking-widest font-bold mb-3">Thinking Archetype</h2>
            <div className="px-4 py-3 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-indigo-400 font-bold text-lg">
              {profile.thinkingStyle}
            </div>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#27272a" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }} />
                <Radar
                  name="Performance"
                  dataKey="A"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bar chart for domains */}
          <div className="p-8 bg-zinc-900 rounded-3xl border border-zinc-800 shadow-2xl h-[300px]">
            <h2 className="text-zinc-500 text-xs uppercase tracking-widest font-bold mb-6">Cognitive Domain Distribution</h2>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ left: 40 }}>
                <XAxis type="number" hide domain={[0, 100]} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 11 }} width={120} />
                <Tooltip 
                  cursor={{ fill: '#18181b' }}
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={24}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Trend line for progress */}
          <div className="p-8 bg-zinc-900 rounded-3xl border border-zinc-800 shadow-2xl h-[300px]">
            <h2 className="text-zinc-500 text-xs uppercase tracking-widest font-bold mb-6">CII Evolution Trend</h2>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                  <XAxis dataKey="level" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis domain={['dataMin - 5', 'dataMax + 5']} hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cii" 
                    stroke="#6366f1" 
                    strokeWidth={4} 
                    dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }} 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-600 text-sm">
                No history data available yet. Complete a level to see your trend.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
