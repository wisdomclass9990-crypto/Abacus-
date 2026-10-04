import React, { useState, useEffect } from 'react';
import { TUTORIAL_STEPS } from '../../data/tutorials';
import { TutorialStep, RodState, AppTheme } from '../../types';
import { AbacusView } from '../Abacus/AbacusView';
import { numberToRods, rodsToNumber, createEmptyRods } from '../../utils/abacus';
import { soundEngine } from '../../utils/audio';
import { markTutorialCompleted } from '../../utils/storage';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  HelpCircle,
  Play,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  BookOpen,
  ChevronRight,
  Lightbulb,
} from 'lucide-react';

interface TutorialModeProps {
  theme: AppTheme;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onCompleteTutorial?: (id: string) => void;
}

export const TutorialMode: React.FC<TutorialModeProps> = ({
  theme,
  soundEnabled,
  onToggleSound,
  onCompleteTutorial,
}) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [rods, setRods] = useState<RodState[]>(() => createEmptyRods(7));
  const [isSuccess, setIsSuccess] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const step: TutorialStep = TUTORIAL_STEPS[currentStepIdx];
  const ROD_COUNT = 7;
  const UNIT_ROD_IDX = 6;

  // Initialize or reset abacus when changing tutorial step
  useEffect(() => {
    setIsSuccess(false);
    setShowHint(false);
    const startVal = step.startingNumber || 0;
    setRods(numberToRods(startVal, ROD_COUNT, UNIT_ROD_IDX));
  }, [currentStepIdx]);

  // Check if current abacus matches target
  const currentValue = rodsToNumber(rods, UNIT_ROD_IDX);
  const targetReached = step.targetNumber !== undefined && currentValue === step.targetNumber;

  useEffect(() => {
    if (targetReached && !isSuccess) {
      setIsSuccess(true);
      soundEngine.playSuccessTone();
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {
        // ignore
      }
      markTutorialCompleted(step.id);
      if (!completedSteps.includes(step.id)) {
        setCompletedSteps((prev) => [...prev, step.id]);
      }
      if (onCompleteTutorial) onCompleteTutorial(step.id);
    }
  }, [currentValue, targetReached, isSuccess, step.id]);

  const handleNextStep = () => {
    if (currentStepIdx < TUTORIAL_STEPS.length - 1) {
      setCurrentStepIdx(currentStepIdx + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(currentStepIdx - 1);
    }
  };

  const handleAutoDemo = () => {
    if (step.targetNumber !== undefined) {
      soundEngine.playBeadClick(1.1);
      setRods(numberToRods(step.targetNumber, ROD_COUNT, UNIT_ROD_IDX));
    }
  };

  const handleResetCurrent = () => {
    soundEngine.playClearSweep();
    const startVal = step.startingNumber || 0;
    setRods(numberToRods(startVal, ROD_COUNT, UNIT_ROD_IDX));
    setIsSuccess(false);
  };

  // Construct highlight map for rods specified in the step
  const highlightedRods: Record<number, 'amber' | 'blue' | 'emerald'> = {};
  if (step.highlightRods) {
    step.highlightRods.forEach((rIdx) => {
      highlightedRods[rIdx] = 'amber';
    });
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 w-full max-w-6xl mx-auto">
      {/* Sidebar: Steps Navigation & Curriculum */}
      <div className="w-full lg:w-72 shrink-0 bg-slate-900/70 backdrop-blur-sm border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <BookOpen className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Beginner Curriculum
          </h2>
        </div>

        <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-y-auto max-h-48 lg:max-h-[520px] custom-scrollbar pb-2 lg:pb-0">
          {TUTORIAL_STEPS.map((s, idx) => {
            const isActive = idx === currentStepIdx;
            const isDone = completedSteps.includes(s.id);
            return (
              <button
                key={s.id}
                onClick={() => setCurrentStepIdx(idx)}
                className={`flex items-center justify-between text-left p-2.5 rounded-xl text-xs transition min-w-[190px] lg:min-w-0 ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-mono ${
                      isActive
                        ? 'bg-slate-950 text-amber-400 font-bold'
                        : isDone
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="truncate">{s.title.replace(/^\d+\.\s*/, '')}</span>
                </div>
                {isDone && !isActive && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Lesson Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div>
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest">
                Lesson {currentStepIdx + 1} of {TUTORIAL_STEPS.length}
              </span>
              <h1 className="text-lg sm:text-xl font-extrabold text-white mt-0.5">
                {step.title}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              {step.expectedOperation && (
                <span className="font-mono text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                  Formula: {step.expectedOperation.formula}
                </span>
              )}

              {isSuccess ? (
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold animate-pulse">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Step Mastered!</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium">
                  <span>Target:</span>
                  <span className="font-mono font-bold text-amber-400">{step.targetNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* Lesson Content */}
          <div className="mt-4 text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
            {step.content}
          </div>

          {/* Tips / Complement Helper */}
          {step.tips && step.tips.length > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <button
                onClick={() => setShowHint(!showHint)}
                className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>{showHint ? 'Hide Instructor Hint' : 'Show Instructor Hint'}</span>
              </button>

              {showHint && (
                <ul className="mt-2 space-y-1 text-xs text-slate-400 list-disc list-inside">
                  {step.tips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Control Actions */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/80">
            <div className="flex items-center gap-2">
              <button
                onClick={handleAutoDemo}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold transition"
                title="Automatically demonstrate correct bead placement"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Show Me How</span>
              </button>
              <button
                onClick={handleResetCurrent}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Step</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevStep}
                disabled={currentStepIdx === 0}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition"
                title="Previous step"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextStep}
                disabled={currentStepIdx === TUTORIAL_STEPS.length - 1}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  isSuccess
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/25'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <span>Next Lesson</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Live Interactive Abacus for Lesson */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 shadow-xl">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300">
              Interactive Practice Abacus (Move beads to reach target: {step.targetNumber})
            </span>
            <span className="font-mono text-amber-400">
              Current: {currentValue}
            </span>
          </div>

          <AbacusView
            rods={rods}
            onChange={setRods}
            unitRodIndex={UNIT_ROD_IDX}
            highlightedRods={highlightedRods}
            showValues={true}
            soundEnabled={soundEnabled}
            onToggleSound={onToggleSound}
            theme={theme}
          />
        </div>
      </div>
    </div>
  );
};
