import React, { useState, useEffect } from 'react';
import { generateLongDivisionSteps } from '../../utils/abacus';
import { LongDivisionProblem, RodState, AppTheme } from '../../types';
import { AbacusView } from '../Abacus/AbacusView';
import { soundEngine } from '../../utils/audio';
import { recordSession } from '../../utils/storage';
import confetti from 'canvas-confetti';
import {
  Divide,
  ChevronRight,
  ChevronLeft,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Hash,
  Sliders,
  ArrowDown,
} from 'lucide-react';

interface LongDivisionTutorProps {
  theme: AppTheme;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

const PRESET_PROBLEMS = [
  { label: '96 ÷ 3', dividend: 96, divisor: 3, desc: 'Introductory 2-digit' },
  { label: '492 ÷ 4', dividend: 492, divisor: 4, desc: 'Clean 3-digit' },
  { label: '847 ÷ 7', dividend: 847, divisor: 7, desc: '3-digit Division' },
  { label: '955 ÷ 5', dividend: 955, divisor: 5, desc: '5-Bead Regrouping' },
  { label: '735 ÷ 6', dividend: 735, divisor: 6, desc: 'With Remainder' },
  { label: '1428 ÷ 12', dividend: 1428, divisor: 12, desc: '2-digit Divisor' },
];

export const LongDivisionTutor: React.FC<LongDivisionTutorProps> = ({
  theme,
  soundEnabled,
  onToggleSound,
}) => {
  const [dividendInput, setDividendInput] = useState<number>(492);
  const [divisorInput, setDivisorInput] = useState<number>(4);
  const [problem, setProblem] = useState<LongDivisionProblem>(() =>
    generateLongDivisionSteps(492, 4, 11)
  );
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [customDivOpen, setCustomDivOpen] = useState<boolean>(false);

  // Auto-generate problem when dividend/divisor changes
  const loadProblem = (d: number, div: number) => {
    const validD = Math.max(1, Math.min(9999, Math.floor(d || 1)));
    const validDiv = Math.max(1, Math.min(99, Math.floor(div || 1)));
    const newProb = generateLongDivisionSteps(validD, validDiv, 11);
    setProblem(newProb);
    setCurrentStepIdx(0);
    setIsPlaying(false);
  };

  const handleSelectPreset = (d: number, div: number) => {
    setDividendInput(d);
    setDivisorInput(div);
    loadProblem(d, div);
  };

  const currentStep = problem.steps[currentStepIdx] || problem.steps[0];
  const rods: RodState[] = currentStep.targetRodsState || [];

  // Auto play stepper
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      if (currentStepIdx < problem.steps.length - 1) {
        timer = setTimeout(() => {
          setCurrentStepIdx((prev) => prev + 1);
          soundEngine.playBeadClick(1.0);
        }, 2200);
      } else {
        setIsPlaying(false);
        soundEngine.playSuccessTone();
      }
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIdx, problem.steps.length]);

  // When reaching final step, trigger celebratory feedback and record practice session
  useEffect(() => {
    if (currentStepIdx === problem.steps.length - 1 && problem.steps.length > 1) {
      soundEngine.playSuccessTone();
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }

      // Record to user practice history
      recordSession({
        id: `div_${Date.now()}`,
        date: new Date().toISOString(),
        mode: 'division_tutor',
        operation: 'division',
        difficulty: problem.divisor > 10 ? 'hard' : problem.dividend > 500 ? 'medium' : 'easy',
        totalProblems: 1,
        correctProblems: 1,
        accuracy: 100,
        durationSeconds: 30,
        problems: [
          {
            id: `p_${Date.now()}`,
            operation: 'division',
            operand1: problem.dividend,
            operand2: problem.divisor,
            expectedAnswer: problem.quotient,
            expectedRemainder: problem.remainder,
            userAnswer: problem.quotient,
            userRemainder: problem.remainder,
            isCorrect: true,
          },
        ],
      });
    }
  }, [currentStepIdx, problem]);

  const handleNext = () => {
    if (currentStepIdx < problem.steps.length - 1) {
      soundEngine.playBeadClick(1.05);
      setCurrentStepIdx(currentStepIdx + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      soundEngine.playBeadClick(0.95);
      setCurrentStepIdx(currentStepIdx - 1);
    }
  };

  const handleReset = () => {
    soundEngine.playClearSweep();
    setCurrentStepIdx(0);
    setIsPlaying(false);
  };

  // Color-coded rod labels & highlights for the abacus
  // Rods 0..3: Quotient (Blue)
  // Rod 4: Blank separator
  // Rods 5..10: Dividend / Remainder (Amber)
  const highlightedRods: Record<number, 'blue' | 'amber' | 'emerald'> = {};
  const rodLabels: Record<number, string> = {
    0: 'Q1k',
    1: 'Q100',
    2: 'Q10',
    3: 'Q1',
    4: '•',
    5: 'D100k',
    6: 'D10k',
    7: 'D1k',
    8: 'D100',
    9: 'D10',
    10: 'D1',
  };

  // Highlight active rods involved in current step
  if (currentStep.quotientRodIndex >= 0) {
    highlightedRods[currentStep.quotientRodIndex] = 'blue';
  }
  if (currentStep.dividendRodIndices) {
    currentStep.dividendRodIndices.forEach((rIdx) => {
      highlightedRods[rIdx] = 'amber';
    });
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
      {/* Top Banner: Presets & Custom Problem Setup */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <Divide className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Interactive Soroban Long Division
              </h2>
              <p className="text-xs text-slate-400">
                Step-by-step masterclass synchronizing traditional long division with Soroban bead reckoning.
              </p>
            </div>
          </div>

          <button
            onClick={() => setCustomDivOpen(!customDivOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>{customDivOpen ? 'Hide Custom Input' : 'Custom Numbers'}</span>
          </button>
        </div>

        {/* Custom Input Form (collapsible) */}
        {customDivOpen && (
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center gap-4 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">Dividend:</span>
              <input
                type="number"
                min="1"
                max="9999"
                value={dividendInput}
                onChange={(e) => setDividendInput(parseInt(e.target.value, 10) || 1)}
                className="w-24 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="text-slate-500 font-bold">÷</div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">Divisor:</span>
              <input
                type="number"
                min="1"
                max="99"
                value={divisorInput}
                onChange={(e) => setDivisorInput(parseInt(e.target.value, 10) || 1)}
                className="w-20 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              onClick={() => loadProblem(dividendInput, divisorInput)}
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
            >
              Start Division
            </button>
          </div>
        )}

        {/* Preset problem quick chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            Quick Practice:
          </span>
          {PRESET_PROBLEMS.map((item, idx) => {
            const isSelected =
              problem.dividend === item.dividend && problem.divisor === item.divisor;
            return (
              <button
                key={idx}
                onClick={() => handleSelectPreset(item.dividend, item.divisor)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-1 ring-blue-400'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <span>{item.label}</span>
                <span className="text-[10px] opacity-70">({item.desc})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Synchronized Twin Stage: Abacus on Top, Traditional Long Division & Steps on Bottom */}
      <div className="flex flex-col gap-4">
        {/* Abacus View with Dual Quotient (Blue) & Dividend (Amber) Zones */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-500 shadow-sm" />
                <span className="text-blue-300">Quotient Section (Result)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm" />
                <span className="text-amber-300">Dividend & Remainder Section</span>
              </div>
            </div>

            {/* Stepper Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={currentStepIdx === 0}
                className="p-1.5 sm:p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition"
                title="Previous step"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  isPlaying
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
                title={isPlaying ? 'Pause auto walkthrough' : 'Auto play all steps'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Pause' : 'Auto-Play'}</span>
              </button>

              <button
                onClick={handleNext}
                disabled={currentStepIdx === problem.steps.length - 1}
                className="p-1.5 sm:p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition"
                title="Next step"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleReset}
                className="p-1.5 sm:p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="Reset to beginning"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <AbacusView
            rods={rods}
            onChange={() => {}} // view-only during division guided replay
            disabled={true}
            highlightedRods={highlightedRods}
            rodLabels={rodLabels}
            showValues={true}
            soundEnabled={soundEnabled}
            onToggleSound={onToggleSound}
            theme={theme}
            title={`${problem.dividend} ÷ ${problem.divisor}`}
            subtitle={`Step ${currentStepIdx + 1} of ${problem.steps.length}: ${currentStep.title}`}
          />
        </div>

        {/* Step Explanation & Traditional Long Division Work Tableau */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Step Narrative Card (2 cols) */}
          <div className="md:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-widest">
                  Step {currentStepIdx + 1} • {currentStep.actionType.replace('_', ' ').toUpperCase()}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {currentStepIdx + 1} / {problem.steps.length}
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-extrabold text-white mt-2">
                {currentStep.title}
              </h3>

              <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                {currentStep.explanation}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3 text-xs font-mono">
                <div>
                  <span className="text-slate-400">Quotient so far: </span>
                  <span className="font-bold text-blue-400">
                    {Math.floor(
                      (problem.dividend - currentStep.dividendSnapshot) / problem.divisor
                    ) || (currentStepIdx === problem.steps.length - 1 ? problem.quotient : 0)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Remaining: </span>
                  <span className="font-bold text-amber-400">
                    {currentStep.dividendSnapshot}
                  </span>
                </div>
              </div>

              <button
                onClick={handleNext}
                disabled={currentStepIdx === problem.steps.length - 1}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold transition"
              >
                <span>{currentStepIdx === problem.steps.length - 1 ? 'Complete!' : 'Next Action'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Traditional Long Division Bracket Tableau (1 col) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col items-center justify-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Traditional Layout
            </span>

            {/* Standard mathematical long division notation */}
            <div className="font-mono text-center p-3 rounded-xl bg-slate-950/80 border border-slate-800 w-full flex flex-col items-center text-sm sm:text-base">
              {/* Quotient line */}
              <div className="text-blue-400 font-extrabold tracking-widest pl-8">
                {currentStepIdx === problem.steps.length - 1
                  ? problem.quotient
                  : problem.steps
                      .slice(0, currentStepIdx + 1)
                      .filter((s) => s.actionType === 'set_quotient')
                      .map((s) => s.quotientDigit)
                      .join('') || '•'}
              </div>

              {/* Division Bracket */}
              <div className="flex items-center justify-center my-1 w-full border-t-2 border-slate-400">
                <span className="text-amber-400 font-bold pr-2 border-r-2 border-slate-400">
                  {problem.divisor}
                </span>
                <span className="text-white font-bold pl-2 tracking-wider">
                  {problem.dividend}
                </span>
              </div>

              {/* Subtrahend and remainder */}
              {currentStep.subtrahend > 0 && (
                <div className="text-xs text-rose-400 mt-1">
                  - {currentStep.subtrahend}
                </div>
              )}
              <div className="text-xs text-amber-300 font-bold border-t border-slate-700 mt-1 pt-0.5">
                Rem: {currentStep.newRemainder}
              </div>
            </div>

            {currentStepIdx === problem.steps.length - 1 && (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Finished: {problem.quotient} R{problem.remainder}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
