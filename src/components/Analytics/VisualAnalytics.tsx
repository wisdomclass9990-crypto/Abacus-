import React, { useState } from 'react';
import { UserStats, Badge, PracticeSession } from '../../types';
import { evaluateBadges, exportDataAsJSON, importDataFromJSON, saveUserStats } from '../../utils/storage';
import {
  TrendingUp,
  Award,
  Clock,
  Target,
  Flame,
  CheckCircle2,
  Calendar,
  Download,
  Upload,
  RotateCcw,
  Zap,
  BarChart2,
  Trophy,
  Sparkles,
} from 'lucide-react';

interface VisualAnalyticsProps {
  stats: UserStats;
  onStatsUpdated: (newStats: UserStats) => void;
}

export const VisualAnalytics: React.FC<VisualAnalyticsProps> = ({
  stats,
  onStatsUpdated,
}) => {
  const [importText, setImportText] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const badges: Badge[] = evaluateBadges(stats);
  const unlockedBadgesCount = badges.filter((b) => b.unlocked).length;

  // Prepare data for Accuracy Trend chart (last 12 sessions, chronologically)
  const recentSessions = [...(stats.sessions || [])].reverse().slice(-12);

  // SVG Chart Dimensions
  const chartWidth = 560;
  const chartHeight = 160;
  const padding = 30;

  // Build points for Accuracy Trend SVG line
  const accuracyPoints = recentSessions.map((s, idx) => {
    const x =
      recentSessions.length > 1
        ? padding + (idx / (recentSessions.length - 1)) * (chartWidth - padding * 2)
        : chartWidth / 2;
    const y = chartHeight - padding - (s.accuracy / 100) * (chartHeight - padding * 2);
    return { x, y, accuracy: s.accuracy, date: s.date };
  });

  const accuracyPathD =
    accuracyPoints.length > 0
      ? accuracyPoints.reduce(
          (acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x},${pt.y}`,
          ''
        )
      : '';

  const accuracyAreaD =
    accuracyPoints.length > 0
      ? `${accuracyPathD} L ${accuracyPoints[accuracyPoints.length - 1].x},${
          chartHeight - padding
        } L ${accuracyPoints[0].x},${chartHeight - padding} Z`
      : '';

  const handleExport = () => {
    const jsonStr = exportDataAsJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `abacus-progress-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Progress data exported successfully!');
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    const success = importDataFromJSON(importText);
    if (success) {
      showToast('Progress data restored!');
      setShowImportModal(false);
      setImportText('');
      window.location.reload();
    } else {
      alert('Invalid JSON data format. Please check and try again.');
    }
  };

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all session statistics? This cannot be undone.')) {
      const resetStats: UserStats = {
        totalSessions: 0,
        totalProblemsSolved: 0,
        correctProblemsSolved: 0,
        overallAccuracy: 0,
        averageTimePerProblemSec: 0,
        streakDays: 1,
        lastActiveDate: new Date().toISOString().split('T')[0],
        completedTutorialIds: [],
        operationBreakdown: {
          addition: { total: 0, correct: 0 },
          subtraction: { total: 0, correct: 0 },
          multiplication: { total: 0, correct: 0 },
          division: { total: 0, correct: 0 },
        },
        sessions: [],
      };
      saveUserStats(resetStats);
      onStatsUpdated(resetStats);
      showToast('All progress statistics reset.');
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-amber-500 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold shadow-xl animate-in fade-in">
          {toastMessage}
        </div>
      )}

      {/* Header & Data Actions */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Student Progress & Visual Analytics
            </h2>
            <p className="text-xs text-slate-400">
              Track accuracy, reckoning speed improvements, and arithmetic mastery offline.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
            title="Export session data as offline JSON backup"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export Backup</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
            title="Restore session data from JSON"
          >
            <Upload className="w-3.5 h-3.5 text-blue-400" />
            <span>Import</span>
          </button>

          <button
            onClick={handleResetData}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700 transition"
            title="Reset statistics"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Solved */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3 shadow-lg">
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Problems Solved
            </span>
            <div className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5">
              {stats.totalProblemsSolved}
            </div>
            <span className="text-[10px] text-slate-400">
              {stats.correctProblemsSolved} correct ({stats.totalSessions} sessions)
            </span>
          </div>
        </div>

        {/* Overall Accuracy */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3 shadow-lg">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Overall Accuracy
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-0.5">
              {stats.overallAccuracy}%
            </div>
            <span className="text-[10px] text-slate-400">
              Cumulative lifetime average
            </span>
          </div>
        </div>

        {/* Average Speed */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3 shadow-lg">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Average Speed
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono mt-0.5">
              {stats.averageTimePerProblemSec > 0 ? `${stats.averageTimePerProblemSec}s` : '—'}
            </div>
            <span className="text-[10px] text-slate-400">
              Per calculated problem
            </span>
          </div>
        </div>

        {/* Streak & Badges */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3 shadow-lg">
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Daily Streak
            </span>
            <div className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5">
              {stats.streakDays} {stats.streakDays === 1 ? 'Day' : 'Days'}
            </div>
            <span className="text-[10px] text-slate-400">
              {unlockedBadgesCount} / {badges.length} badges unlocked
            </span>
          </div>
        </div>
      </div>

      {/* Visual Charts: Accuracy Curve & Operation Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Accuracy Trend SVG Chart (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Accuracy Learning Curve
              </h3>
            </div>
            <span className="text-xs text-slate-400">Last 12 Practice Sessions</span>
          </div>

          <div className="my-4 w-full overflow-hidden flex flex-col items-center">
            {recentSessions.length > 0 ? (
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-44 overflow-visible"
              >
                <defs>
                  <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal reference grid lines (25%, 50%, 75%, 100%) */}
                {[25, 50, 75, 100].map((pct) => {
                  const y = chartHeight - padding - (pct / 100) * (chartHeight - padding * 2);
                  return (
                    <g key={pct}>
                      <line
                        x1={padding}
                        y1={y}
                        x2={chartWidth - padding}
                        y2={y}
                        stroke="#334155"
                        strokeDasharray="4 4"
                        strokeWidth="1"
                      />
                      <text
                        x={padding - 6}
                        y={y + 3}
                        fill="#64748b"
                        fontSize="9"
                        textAnchor="end"
                        fontFamily="monospace"
                      >
                        {pct}%
                      </text>
                    </g>
                  );
                })}

                {/* Filled area */}
                <path d={accuracyAreaD} fill="url(#areaGrad)" />

                {/* Trend line */}
                <path
                  d={accuracyPathD}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data point dots */}
                {accuracyPoints.map((pt, idx) => (
                  <g key={idx}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="4"
                      fill="#0f172a"
                      stroke="#34d399"
                      strokeWidth="2.5"
                    />
                    <title>{`Session ${idx + 1}: ${pt.accuracy}% accuracy`}</title>
                  </g>
                ))}
              </svg>
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-slate-500 text-xs">
                <BarChart2 className="w-8 h-8 opacity-40 mb-2" />
                <span>Complete your first practice session to generate the accuracy curve.</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800 font-mono">
            <span>Past Sessions</span>
            <span>Latest Session</span>
          </div>
        </div>

        {/* Operations Breakdown Progress Bars (1 col) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Skill Mastery
            </h3>
            <span className="text-xs text-slate-400">By Operation</span>
          </div>

          <div className="space-y-4 my-2">
            {[
              { key: 'addition', label: 'Addition', color: 'bg-amber-500' },
              { key: 'subtraction', label: 'Subtraction', color: 'bg-orange-500' },
              { key: 'multiplication', label: 'Multiplication', color: 'bg-emerald-500' },
              { key: 'division', label: 'Long Division', color: 'bg-blue-500' },
            ].map((op) => {
              const opData = stats.operationBreakdown[op.key as keyof typeof stats.operationBreakdown] || {
                total: 0,
                correct: 0,
              };
              const accuracy =
                opData.total > 0 ? Math.round((opData.correct / opData.total) * 100) : 0;
              return (
                <div key={op.key} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">{op.label}</span>
                    <span className="font-mono text-slate-400">
                      {accuracy}% ({opData.correct}/{opData.total})
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full ${op.color} rounded-full transition-all duration-500`}
                      style={{ width: `${accuracy}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
            Tutorials completed: {stats.completedTutorialIds.length} lessons
          </div>
        </div>
      </div>

      {/* Achievement Badges Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Mastery Badges & Milestones
            </h3>
          </div>
          <span className="text-xs font-mono text-amber-400">
            {unlockedBadgesCount} / {badges.length} Achieved
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`p-3 rounded-xl border flex flex-col items-center text-center transition ${
                badge.unlocked
                  ? 'bg-amber-500/10 border-amber-500/40 shadow-sm shadow-amber-500/10'
                  : 'bg-slate-950/60 border-slate-800/80 opacity-60'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  badge.unlocked
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30 ring-2 ring-amber-300'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                <Award className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-white truncate w-full">{badge.title}</h4>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{badge.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Practice Sessions Log Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Session History Log
            </h3>
          </div>
          <span className="text-xs text-slate-400">{stats.sessions.length} Recorded</span>
        </div>

        {stats.sessions && stats.sessions.length > 0 ? (
          <div className="mt-3 overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 font-mono">
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Operation</th>
                  <th className="py-2 px-3">Difficulty</th>
                  <th className="py-2 px-3">Accuracy</th>
                  <th className="py-2 px-3">Solved</th>
                  <th className="py-2 px-3">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {stats.sessions.slice(0, 10).map((sess) => (
                  <tr key={sess.id} className="hover:bg-slate-800/40 transition font-mono">
                    <td className="py-2.5 px-3 text-slate-300">
                      {new Date(sess.date).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 text-amber-300 font-semibold uppercase">
                      {sess.operation}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 capitalize">{sess.difficulty}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`font-bold ${
                          sess.accuracy >= 80 ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {sess.accuracy}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {sess.correctProblems} / {sess.totalProblems}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{sess.durationSeconds}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-500">
            No completed practice sessions yet. Start a drill in the Practice Drills tab!
          </div>
        )}
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl text-slate-100">
            <h3 className="text-base font-bold text-white mb-2">Import Progress Backup</h3>
            <p className="text-xs text-slate-400 mb-3">
              Paste the exported JSON text below to restore your progress metrics and history.
            </p>

            <textarea
              rows={6}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste JSON content here..."
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-400"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold"
              >
                Restore Progress
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
