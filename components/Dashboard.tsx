
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { CognitiveProfile, DomainScores } from '../types';

interface DashboardProps {
  profile: CognitiveProfile;
}

const Dashboard: React.FC<DashboardProps> = ({ profile }) => {
  const data = [
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

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl">
      <div className="space-y-6">
        <div>
          <h2 className="text-zinc-400 text-sm uppercase tracking-widest font-semibold mb-1">Composite Intelligence Index</h2>
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-extrabold text-white tracking-tighter">{profile.cii}</span>
            <span className="text-zinc-500 text-lg">CII</span>
          </div>
        </div>

        <div>
          <h2 className="text-zinc-400 text-sm uppercase tracking-widest font-semibold mb-2">Thinking Style</h2>
          <div className="inline-block px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400 font-bold">
            {profile.thinkingStyle}
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
              <PolarGrid stroke="#27272a" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
              <Radar
                name="Performance"
                dataKey="A"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.4}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-6 flex flex-col justify-center">
        <h2 className="text-zinc-400 text-sm uppercase tracking-widest font-semibold mb-2">Domain Distribution</h2>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical" margin={{ left: 40, right: 20 }}>
              <XAxis type="number" hide domain={[0, 100]} />
              <YAxis 
                type="category" 
                dataKey="name" 
                tick={{ fill: '#a1a1aa', fontSize: 11 }} 
                width={120}
              />
              <Tooltip 
                cursor={{ fill: '#18181b' }}
                contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
              />
              <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
