import React, { useState, useEffect, useRef } from 'react';
import { PracticeProblem, PracticeSession, AppTheme, RodState } from '../../types';
import { AbacusView } from '../Abacus/AbacusView';
import { numberToRods, rodsToNumber, createEmptyRods } from '../../utils/abacus';
import { soundEngine } from '../../utils/audio';
import { recordSession } from '../../utils/storage';
import confetti from 'canvas-confetti';
import {
  Zap,
  Clock,
  Target,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  Flame,
  ArrowRight,
  HelpCircle,
  Calculator,
} from 'lucide-react';

interface PracticeModeProps {
  theme: AppTheme;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onSessionComplete?: (session: PracticeSession) => void;
}

type PracticeType = 'addition' | 'subtraction' | 'multiplication' | 'division' | 'mixed';
type ChallengeMode = 'precision' | 'timed' | 'free';
type DifficultyLevel = 'easy' | 'medium' | 'hard';

export const PracticeMode: React.FC<PracticeModeProps> = ({
  theme,
  soundEnabled,
  onToggleSound,
  onSessionComplete,
}) => {
  const [operation, setOperation] = useState<PracticeType>('addition');
  const [mode, setMode] = useState<ChallengeMode>('precision');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('easy');

  const [isActive, setIsActive] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [currentProblemIndex, setCurrentProblemIndex] = useState<number>(0);
  const [problems, setProblems] = useState<PracticeProblem[]>([]);
  const [userAnswerInput, setUserAnswerInput] = useState<string>('');
  const [userRemainderInput, setUserRemainderInput] = useState<string>('');
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);

  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [score, setScore] = useState<number>(0);

  // Live abacus state for calculations
  const ROD_COUNT = 9;
  const UNIT_ROD_IDX = 8;
  const [rods, setRods] = useState<RodState[]>(() => createEmptyRods(ROD_COUNT));

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Generate a random problem
  const generateSingleProblem = (opType: PracticeType, diff: DifficultyLevel): PracticeProblem => {
    let resolvedOp = opType;
    if (opType === 'mixed') {
      const ops: Array<'addition' | 'subtraction' | 'multiplication' | 'division'> = [
        'addition',
        'subtraction',
        'multiplication',
        'division',
      ];
      resolvedOp = ops[Math.floor(Math.random() * ops.length)];
    }

    let a = 1;
    let b = 1;
    let expected = 2;
    let remainder = 0;

    if (resolvedOp === 'addition') {
      if (diff === 'easy') {
        a = Math.floor(Math.random() * 8) + 1;
        b = Math.floor(Math.random() * (9 - a)) + 1; // single digit without complex carry
      } else if (diff === 'medium') {
        a = Math.floor(Math.random() * 50) + 10;
        b = Math.floor(Math.random() * 50) + 5;
      } else {
        a = Math.floor(Math.random() * 450) + 50;
        b = Math.floor(Math.random() * 450) + 50;
      }
      expected = a + b;
    } else if (resolvedOp === 'subtraction') {
      if (diff === 'easy') {
        a = Math.floor(Math.random() * 8) + 2;
        b = Math.floor(Math.random() * a) + 1;
      } else if (diff === 'medium') {
        a = Math.floor(Math.random() * 60) + 20;
        b = Math.floor(Math.random() * (a - 5)) + 1;
      } else {
        a = Math.floor(Math.random() * 500) + 100;
        b = Math.floor(Math.random() * (a - 20)) + 10;
      }
      expected = a - b;
    } else if (resolvedOp === 'multiplication') {
      if (diff === 'easy') {
        a = Math.floor(Math.random() * 9) + 1;
        b = Math.floor(Math.random() * 9) + 1;
      } else if (diff === 'medium') {
        a = Math.floor(Math.random() * 30) + 10;
        b = Math.floor(Math.random() * 8) + 2;
      } else {
        a = Math.floor(Math.random() * 80) + 15;
        b = Math.floor(Math.random() * 40) + 10;
      }
      expected = a * b;
    } else {
      // Division
      if (diff === 'easy') {
        b = Math.floor(Math.random() * 8) + 2;
        const q = Math.floor(Math.random() * 9) + 1;
        a = b * q; // clean division
        expected = q;
        remainder = 0;
      } else if (diff === 'medium') {
        b = Math.floor(Math.random() * 7) + 3;
        const q = Math.floor(Math.random() * 40) + 10;
        remainder = Math.floor(Math.random() * b);
        a = b * q + remainder;
        expected = q;
      } else {
        b = Math.floor(Math.random() * 18) + 4;
        const q = Math.floor(Math.random() * 80) + 12;
        remainder = Math.floor(Math.random() * b);
        a = b * q + remainder;
        expected = q;
      }
    }

    return {
      id: `prob_${Date.now()}_${Math.random()}`,
      operation: resolvedOp as 'addition' | 'subtraction' | 'multiplication' | 'division',
      operand1: a,
      operand2: b,
      expectedAnswer: expected,
      expectedRemainder: remainder,
    };
  };

  const startPractice = () => {
    const initialCount = mode === 'precision' ? 10 : 30;
    const generated: PracticeProblem[] = Array.from({ length: initialCount }, () =>
      generateSingleProblem(operation, difficulty)
    );

    setProblems(generated);
    setCurrentProblemIndex(0);
    setUserAnswerInput('');
    setUserRemainderInput('');
    setFeedback(null);
    setScore(0);
    setStreak(0);
    setIsActive(true);
    setIsCompleted(false);
    setElapsedSeconds(0);
    setTimeLeft(60);
    setRods(createEmptyRods(ROD_COUNT));

    soundEngine.playClearSweep();
  };

  // Timer logic for timed sprint and tracking elapsed time
  useEffect(() => {
    if (isActive && !isCompleted) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
        if (mode === 'timed') {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              finishSession();
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isCompleted, mode]);

  const finishSession = () => {
    setIsActive(false);
    setIsCompleted(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const answeredProblems = problems.slice(0, currentProblemIndex + (feedback ? 1 : 0));
    const correctCount = answeredProblems.filter((p) => p.isCorrect).length;
    const totalCount = Math.max(1, answeredProblems.length);
    const accuracy = Math.round((correctCount / totalCount) * 100);

    soundEngine.playSuccessTone();
    try {
      confetti({
        particleCount: 75,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    const session: PracticeSession = {
      id: `sess_${Date.now()}`,
      date: new Date().toISOString(),
      mode,
      operation,
      difficulty,
      totalProblems: totalCount,
      correctProblems: correctCount,
      accuracy,
      durationSeconds: Math.max(1, elapsedSeconds),
      problems: answeredProblems,
    };

    recordSession(session);
    if (onSessionComplete) onSessionComplete(session);
  };

  const currentProblem = problems[currentProblemIndex];

  // Helper to sync abacus reckoning value into the input field!
  const syncAbacusToInput = () => {
    const abacusVal = rodsToNumber(rods, UNIT_ROD_IDX);
    setUserAnswerInput(abacusVal.toString());
    soundEngine.playBeadClick(1.05);
  };

  const handleSubmitAnswer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentProblem || feedback) return;

    const parsedAnswer = parseInt(userAnswerInput.trim(), 10);
    const parsedRemainder = userRemainderInput.trim() ? parseInt(userRemainderInput.trim(), 10) : 0;

    const answerCorrect = parsedAnswer === currentProblem.expectedAnswer;
    const remainderCorrect =
      currentProblem.operation === 'division' && (currentProblem.expectedRemainder || 0) > 0
        ? parsedRemainder === currentProblem.expectedRemainder
        : true;

    const isProblemCorrect = answerCorrect && remainderCorrect;

    // Update problem object
    const updated = [...problems];
    updated[currentProblemIndex] = {
      ...currentProblem,
      userAnswer: parsedAnswer,
      userRemainder: parsedRemainder,
      isCorrect: isProblemCorrect,
    };
    setProblems(updated);

    if (isProblemCorrect) {
      soundEngine.playSuccessTone();
      setScore((prev) => prev + 1);
      setStreak((prev) => prev + 1);
      setFeedback({
        isCorrect: true,
        message: 'Splendid! Exactly correct.',
      });
    } else {
      soundEngine.playErrorTone();
      setStreak(0);
      const expectedStr =
        currentProblem.operation === 'division' && (currentProblem.expectedRemainder || 0) > 0
          ? `${currentProblem.expectedAnswer} R${currentProblem.expectedRemainder}`
          : `${currentProblem.expectedAnswer}`;
      setFeedback({
        isCorrect: false,
        message: `Answer was ${expectedStr}. Check bead placement!`,
      });
    }

    // Advance to next problem after short delay
    setTimeout(() => {
      setFeedback(null);
      setUserAnswerInput('');
      setUserRemainderInput('');
      setRods(createEmptyRods(ROD_COUNT));

      if (mode === 'precision' && currentProblemIndex >= 9) {
        finishSession();
      } else {
        setCurrentProblemIndex((prev) => prev + 1);
      }
    }, 1400);
  };

  const getOpSymbol = (op: string) => {
    switch (op) {
      case 'addition':
        return '+';
      case 'subtraction':
        return '−';
      case 'multiplication':
        return '×';
      case 'division':
        return '÷';
      default:
        return '+';
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
      {/* Configuration Bar (When not active) */}
      {!isActive && !isCompleted && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-400" />
                Practice Sessions & Speed Drills
              </h2>
              <p className="text-xs text-slate-400">
                Train arithmetic accuracy and Soroban finger dexterity with instant visual feedback.
              </p>
            </div>
          </div>

          {/* Operation selection */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              Select Operation
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'addition', label: 'Addition (+)' },
                { id: 'subtraction', label: 'Subtraction (−)' },
                { id: 'multiplication', label: 'Multiplication (×)' },
                { id: 'division', label: 'Long Division (÷)' },
                { id: 'mixed', label: 'Mixed Operations' },
              ].map((op) => (
                <button
                  key={op.id}
                  onClick={() => setOperation(op.id as PracticeType)}
                  className={`p-2.5 rounded-xl text-xs font-semibold transition text-center ${
                    operation === op.id
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  {op.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mode & Difficulty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                Drill Format
              </label>
              <div className="flex gap-2">
                {[
                  { id: 'precision', label: '10 Problems' },
                  { id: 'timed', label: '60s Blitz' },
                  { id: 'free', label: 'Free Flow' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id as ChallengeMode)}
                    className={`flex-1 p-2 rounded-xl text-xs font-semibold transition ${
                      mode === m.id
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                        : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                Difficulty Level
              </label>
              <div className="flex gap-2">
                {[
                  { id: 'easy', label: 'Beginner' },
                  { id: 'medium', label: 'Intermediate' },
                  { id: 'hard', label: 'Advanced' },
                ].map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDifficulty(d.id as DifficultyLevel)}
                    className={`flex-1 p-2 rounded-xl text-xs font-semibold transition ${
                      difficulty === d.id
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25'
                        : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={startPractice}
            className="w-full sm:w-auto self-end mt-2 px-8 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/25 transition flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 fill-slate-950" />
            <span>Begin Practice Drill</span>
          </button>
        </div>
      )}

      {/* Completion Summary Card */}
      {isCompleted && (
        <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center flex flex-col items-center max-w-xl mx-auto animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 mb-3 shadow-[0_0_24px_rgba(245,158,11,0.3)]">
            <Sparkles className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-black text-white">Session Completed!</h2>
          <p className="text-xs text-slate-400 mt-1">
            Great practice session. Your metrics have been logged to visual analytics.
          </p>

          <div className="grid grid-cols-3 gap-3 w-full my-6">
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Solved</span>
              <div className="text-xl font-mono font-bold text-white mt-1">
                {score} / {currentProblemIndex + 1}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Accuracy</span>
              <div className="text-xl font-mono font-bold text-amber-400 mt-1">
                {Math.round((score / Math.max(1, currentProblemIndex + 1)) * 100)}%
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Time</span>
              <div className="text-xl font-mono font-bold text-blue-400 mt-1">
                {elapsedSeconds}s
              </div>
            </div>
          </div>

          <div className="flex gap-3 w-full">
            <button
              onClick={() => {
                setIsCompleted(false);
                setIsActive(false);
              }}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition"
            >
              Back to Options
            </button>
            <button
              onClick={startPractice}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-extrabold text-slate-950 transition shadow-md shadow-amber-500/20"
            >
              Practice Again
            </button>
          </div>
        </div>
      )}

      {/* Active Practice Interface */}
      {isActive && currentProblem && (
        <div className="flex flex-col gap-5">
          {/* Header Stats Bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400">Question:</span>
                <span className="font-mono font-bold text-white">
                  {currentProblemIndex + 1} {mode === 'precision' ? '/ 10' : ''}
                </span>
              </div>

              {streak > 1 && (
                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold animate-bounce">
                  <Flame className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{streak} Streak!</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              {mode === 'timed' && (
                <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-rose-400">
                  <Clock className="w-4 h-4" />
                  <span>{timeLeft}s</span>
                </div>
              )}

              <div className="flex items-center gap-1.5 font-mono text-xs">
                <span className="text-slate-400">Score:</span>
                <span className="font-bold text-emerald-400">{score}</span>
              </div>

              <button
                onClick={finishSession}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition"
              >
                End Session
              </button>
            </div>
          </div>

          {/* Problem Display Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden">
            <div className="text-3xl sm:text-5xl font-mono font-extrabold text-white tracking-wider flex items-center gap-4">
              <span>{currentProblem.operand1}</span>
              <span className="text-amber-400">{getOpSymbol(currentProblem.operation)}</span>
              <span>{currentProblem.operand2}</span>
              <span className="text-slate-500">=</span>
              <span className="text-amber-400 underline decoration-amber-500/50 underline-offset-8">
                {userAnswerInput || '?'}
              </span>
            </div>

            {/* Answer Input and Form */}
            <form
              onSubmit={handleSubmitAnswer}
              className="mt-6 flex flex-wrap items-center justify-center gap-3"
            >
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Enter Answer"
                  value={userAnswerInput}
                  onChange={(e) => setUserAnswerInput(e.target.value)}
                  disabled={feedback !== null}
                  autoFocus
                  className="w-40 sm:w-48 px-4 py-2.5 rounded-xl bg-slate-950 border-2 border-slate-700 focus:border-amber-400 text-white font-mono font-extrabold text-lg text-center shadow-inner focus:outline-none"
                />

                {currentProblem.operation === 'division' && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400 font-bold">Rem:</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={userRemainderInput}
                      onChange={(e) => setUserRemainderInput(e.target.value)}
                      disabled={feedback !== null}
                      className="w-16 px-2.5 py-2.5 rounded-xl bg-slate-950 border-2 border-slate-700 focus:border-amber-400 text-white font-mono font-bold text-center text-base focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!userAnswerInput.trim() || feedback !== null}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 transition flex items-center gap-1.5"
              >
                <span>Submit</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={syncAbacusToInput}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-semibold text-xs transition flex items-center gap-1.5"
                title="Use value currently on the Abacus"
              >
                <Calculator className="w-3.5 h-3.5 text-amber-400" />
                <span>Use Abacus Value</span>
              </button>
            </form>

            {/* Instant Feedback Banner */}
            {feedback && (
              <div
                className={`mt-4 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150 ${
                  feedback.isCorrect
                    ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
                    : 'bg-rose-500/20 border border-rose-500/50 text-rose-400'
                }`}
              >
                {feedback.isCorrect ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}
          </div>

          {/* Interactive Scratchpad Abacus */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300">
                Calculator Abacus (Calculate directly on the beads, then tap "Use Abacus Value")
              </span>
              <span className="font-mono text-amber-400">
                Rods Value: {rodsToNumber(rods, UNIT_ROD_IDX)}
              </span>
            </div>

            <AbacusView
              rods={rods}
              onChange={setRods}
              unitRodIndex={UNIT_ROD_IDX}
              showValues={true}
              soundEnabled={soundEnabled}
              onToggleSound={onToggleSound}
              theme={theme}
            />
          </div>
        </div>
      )}
    </div>
  );
};
