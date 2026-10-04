export type OperationType = 'addition' | 'subtraction' | 'multiplication' | 'division' | 'freeplay' | 'tutorial';

export type AppTab = 'abacus' | 'tutorials' | 'division' | 'practice' | 'analytics';

export type AppTheme = 'traditional' | 'modern' | 'bamboo';

export interface RodState {
  upper: boolean; // true if upper bead moved DOWN towards beam (value 5)
  lowerCount: number; // 0 to 4 beads moved UP towards beam (value 1 each)
}

export interface AbacusConfig {
  rodCount: number; // 7, 9, 11, 13
  unitRodIndex: number; // which rod is the units rod (typically right-middle)
  showValues: boolean;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  theme: AppTheme;
}

export interface TutorialStep {
  id: string;
  title: string;
  category: 'basics' | 'direct' | 'five_friends' | 'ten_friends' | 'multi_digit' | 'division';
  objective: string;
  content: string;
  tips?: string[];
  targetNumber?: number;
  startingNumber?: number;
  highlightRods?: number[];
  expectedOperation?: {
    from: number;
    delta: number;
    to: number;
    formula?: string;
  };
  demoRods?: RodState[];
}

export interface DivisionStep {
  stepIndex: number;
  title: string;
  explanation: string;
  dividendSnapshot: number;
  divisor: number;
  currentDividendPart: number;
  quotientDigit: number;
  subtrahend: number; // quotientDigit * divisor
  newRemainder: number;
  quotientRodIndex: number;
  dividendRodIndices: number[];
  actionType: 'set_quotient' | 'subtract_product' | 'bring_down' | 'complete';
  targetRodsState?: RodState[];
}

export interface LongDivisionProblem {
  dividend: number;
  divisor: number;
  quotient: number;
  remainder: number;
  steps: DivisionStep[];
}

export interface PracticeProblem {
  id: string;
  operation: 'addition' | 'subtraction' | 'multiplication' | 'division';
  operand1: number;
  operand2: number;
  expectedAnswer: number;
  expectedRemainder?: number;
  userAnswer?: number;
  userRemainder?: number;
  isCorrect?: boolean;
  timeSpentMs?: number;
}

export interface PracticeSession {
  id: string;
  date: string; // ISO string
  mode: 'free' | 'timed' | 'precision' | 'division_tutor';
  operation: 'addition' | 'subtraction' | 'multiplication' | 'division' | 'mixed';
  difficulty: 'easy' | 'medium' | 'hard';
  totalProblems: number;
  correctProblems: number;
  accuracy: number; // 0 to 100
  durationSeconds: number;
  problems: PracticeProblem[];
}

export interface UserStats {
  totalSessions: number;
  totalProblemsSolved: number;
  correctProblemsSolved: number;
  overallAccuracy: number;
  averageTimePerProblemSec: number;
  streakDays: number;
  lastActiveDate: string;
  completedTutorialIds: string[];
  operationBreakdown: {
    addition: { total: number; correct: number };
    subtraction: { total: number; correct: number };
    multiplication: { total: number; correct: number };
    division: { total: number; correct: number };
  };
  sessions: PracticeSession[];
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}
