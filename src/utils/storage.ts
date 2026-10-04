import { UserStats, PracticeSession, Badge } from '../types';

const STATS_STORAGE_KEY = 'abacus_user_stats_v1';
const PREFS_STORAGE_KEY = 'abacus_user_prefs_v1';

export const INITIAL_BADGES: Badge[] = [
  {
    id: 'first_calculation',
    title: 'First Reckoning',
    description: 'Complete your first abacus practice problem.',
    icon: 'Sparkles',
    unlocked: false,
  },
  {
    id: 'five_friends',
    title: 'Five Friends Master',
    description: 'Master 5-complement arithmetic tutorials.',
    icon: 'HandMetal',
    unlocked: false,
  },
  {
    id: 'ten_friends',
    title: 'Ten Friends Hero',
    description: 'Master 10-complement carry and borrow techniques.',
    icon: 'Award',
    unlocked: false,
  },
  {
    id: 'division_dynamo',
    title: 'Division Dynamo',
    description: 'Complete an interactive Long Division walkthrough.',
    icon: 'Divide',
    unlocked: false,
  },
  {
    id: 'streak_3',
    title: '3-Day Math Streak',
    description: 'Practice 3 consecutive days on the abacus.',
    icon: 'Flame',
    unlocked: false,
  },
  {
    id: 'accuracy_90',
    title: 'Sharpshooter',
    description: 'Achieve 90%+ accuracy in a 10-problem session.',
    icon: 'Target',
    unlocked: false,
  },
  {
    id: 'speed_demon',
    title: 'Speed Soroban',
    description: 'Solve 5 problems with average time under 8 seconds.',
    icon: 'Zap',
    unlocked: false,
  },
  {
    id: 'century_club',
    title: '100 Problems Club',
    description: 'Solve 100 total math problems on the abacus.',
    icon: 'Trophy',
    unlocked: false,
  },
];

const DEFAULT_STATS: UserStats = {
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

export function loadUserStats(): UserStats {
  if (typeof window === 'undefined') return DEFAULT_STATS;
  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (!raw) return DEFAULT_STATS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STATS,
      ...parsed,
      operationBreakdown: {
        ...DEFAULT_STATS.operationBreakdown,
        ...(parsed.operationBreakdown || {}),
      },
    };
  } catch {
    return DEFAULT_STATS;
  }
}

export function saveUserStats(stats: UserStats): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save user stats', e);
  }
}

export function recordSession(session: PracticeSession): UserStats {
  const current = loadUserStats();
  const today = new Date().toISOString().split('T')[0];

  // Streak calculation
  let streak = current.streakDays;
  if (current.lastActiveDate) {
    const lastDate = new Date(current.lastActiveDate);
    const currentDate = new Date(today);
    const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      streak += 1;
    } else if (diffDays > 1) {
      streak = 1;
    }
  }

  const updatedSessions = [session, ...(current.sessions || [])].slice(0, 100); // keep last 100 sessions
  const newTotalProblems = current.totalProblemsSolved + session.totalProblems;
  const newCorrectProblems = current.correctProblemsSolved + session.correctProblems;
  const newOverallAccuracy = newTotalProblems > 0 ? Math.round((newCorrectProblems / newTotalProblems) * 100) : 0;

  // Recalculate average time per problem
  const totalDuration = updatedSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const totalSolvedInSessions = updatedSessions.reduce((acc, s) => acc + s.totalProblems, 0);
  const avgTime = totalSolvedInSessions > 0 ? Math.round((totalDuration / totalSolvedInSessions) * 10) / 10 : 0;

  // Operation breakdown update
  const opBreakdown = { ...current.operationBreakdown };
  session.problems.forEach((p) => {
    const op = p.operation;
    if (opBreakdown[op]) {
      opBreakdown[op].total += 1;
      if (p.isCorrect) {
        opBreakdown[op].correct += 1;
      }
    }
  });

  const updated: UserStats = {
    ...current,
    totalSessions: current.totalSessions + 1,
    totalProblemsSolved: newTotalProblems,
    correctProblemsSolved: newCorrectProblems,
    overallAccuracy: newOverallAccuracy,
    averageTimePerProblemSec: avgTime,
    streakDays: streak,
    lastActiveDate: today,
    operationBreakdown: opBreakdown,
    sessions: updatedSessions,
  };

  saveUserStats(updated);
  return updated;
}

export function markTutorialCompleted(tutorialId: string): UserStats {
  const current = loadUserStats();
  if (!current.completedTutorialIds.includes(tutorialId)) {
    const updated: UserStats = {
      ...current,
      completedTutorialIds: [...current.completedTutorialIds, tutorialId],
    };
    saveUserStats(updated);
    return updated;
  }
  return current;
}

export function evaluateBadges(stats: UserStats): Badge[] {
  return INITIAL_BADGES.map((badge) => {
    let unlocked = false;
    switch (badge.id) {
      case 'first_calculation':
        unlocked = stats.totalProblemsSolved >= 1;
        break;
      case 'five_friends':
        unlocked = stats.completedTutorialIds.some((id) => id.startsWith('five_'));
        break;
      case 'ten_friends':
        unlocked = stats.completedTutorialIds.some((id) => id.startsWith('ten_'));
        break;
      case 'division_dynamo':
        unlocked = stats.completedTutorialIds.includes('division_soroban') ||
          (stats.operationBreakdown.division?.correct || 0) >= 1;
        break;
      case 'streak_3':
        unlocked = stats.streakDays >= 3;
        break;
      case 'accuracy_90':
        unlocked = stats.sessions.some((s) => s.totalProblems >= 5 && s.accuracy >= 90);
        break;
      case 'speed_demon':
        unlocked = stats.sessions.some(
          (s) => s.totalProblems >= 5 && s.durationSeconds / s.totalProblems <= 8
        );
        break;
      case 'century_club':
        unlocked = stats.totalProblemsSolved >= 100;
        break;
    }
    return {
      ...badge,
      unlocked,
    };
  });
}

export function exportDataAsJSON(): string {
  const stats = loadUserStats();
  return JSON.stringify(stats, null, 2);
}

export function importDataFromJSON(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed && typeof parsed.totalProblemsSolved === 'number') {
      saveUserStats(parsed);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
