import React from 'react';
import { RodState, AppTheme } from '../../types';
import { AbacusBead } from './AbacusBead';
import { soundEngine } from '../../utils/audio';

interface AbacusRodProps {
  index: number;
  rodState: RodState;
  onChange: (newState: RodState) => void;
  isUnitRod?: boolean;
  hasReckoningDot?: boolean;
  placeLabel?: string;
  showValue?: boolean;
  isHighlighted?: boolean;
  highlightColor?: 'amber' | 'blue' | 'emerald' | 'purple';
  theme?: AppTheme;
  disabled?: boolean;
  compact?: boolean;
}

export const AbacusRod: React.FC<AbacusRodProps> = ({
  index,
  rodState,
  onChange,
  isUnitRod = false,
  hasReckoningDot = false,
  placeLabel,
  showValue = true,
  isHighlighted = false,
  highlightColor = 'amber',
  theme = 'traditional',
  disabled = false,
  compact = false,
}) => {
  const rodValue = (rodState.upper ? 5 : 0) + rodState.lowerCount;

  const handleUpperClick = () => {
    if (disabled) return;
    const newUpper = !rodState.upper;
    soundEngine.playBeadClick(1.05 + (index % 5) * 0.04);
    onChange({
      ...rodState,
      upper: newUpper,
    });
  };

  const handleLowerClick = (beadIdx: number) => {
    if (disabled) return;
    let newLowerCount = rodState.lowerCount;

    if (beadIdx < rodState.lowerCount) {
      // Clicking an already active bead: push it and beads below it down
      newLowerCount = beadIdx;
    } else {
      // Clicking an inactive bead: push it and beads above it up
      newLowerCount = beadIdx + 1;
    }

    soundEngine.playBeadClick(0.92 + (index % 5) * 0.03);
    onChange({
      ...rodState,
      lowerCount: newLowerCount,
    });
  };

  // Border and accent styling for highlighted rods
  const getHighlightClass = () => {
    if (!isHighlighted) return 'bg-transparent';
    if (highlightColor === 'blue') return 'bg-blue-500/10 border-x border-blue-500/40';
    if (highlightColor === 'emerald') return 'bg-emerald-500/10 border-x border-emerald-500/40';
    return 'bg-amber-500/10 border-x border-amber-500/40';
  };

  return (
    <div
      className={`relative flex flex-col items-center flex-1 min-w-[34px] sm:min-w-[42px] max-w-[56px] transition-colors rounded-sm ${getHighlightClass()}`}
    >
      {/* Place value indicator header (e.g. 100, 10, 1 or Q1, Q2) */}
      <div className="h-5 flex items-center justify-center text-[10px] sm:text-[11px] font-mono font-medium text-slate-400 select-none">
        {placeLabel || ''}
      </div>

      {/* UPPER DECK (Heaven: 1 bead) */}
      <div className="relative w-full h-[64px] flex justify-center py-1">
        {/* Metal rod wire running through */}
        <div className="absolute top-0 bottom-0 w-[3px] bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 rounded-full shadow-inner pointer-events-none" />

        <AbacusBead
          type="upper"
          isActive={rodState.upper}
          onClick={handleUpperClick}
          disabled={disabled}
          theme={theme}
          beadColor={isHighlighted ? highlightColor : 'amber'}
        />
      </div>

      {/* RECKONING BEAM (Separator Bar) */}
      <div className="relative w-full h-5 flex items-center justify-center bg-gradient-to-b from-amber-950 via-amber-900 to-stone-950 border-y border-amber-800/80 shadow-inner z-10">
        {/* Metal rod segment inside beam */}
        <div className="absolute top-0 bottom-0 w-[3px] bg-slate-400 opacity-60" />

        {/* Reckoning unit dot (white/gold inlay on beam) */}
        {hasReckoningDot && (
          <div
            className={`w-2 h-2 rounded-full shadow-sm z-20 ${
              isUnitRod
                ? 'bg-amber-300 ring-2 ring-amber-400/60 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                : 'bg-white shadow-[0_0_4px_rgba(255,255,255,0.7)]'
            }`}
            title={isUnitRod ? 'Unit Rod Point (Units)' : 'Reckoning Point'}
          />
        )}
      </div>

      {/* LOWER DECK (Earth: 4 beads) */}
      <div className="relative w-full h-[162px] flex justify-center py-1">
        {/* Metal rod wire running through */}
        <div className="absolute top-0 bottom-0 w-[3px] bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 rounded-full shadow-inner pointer-events-none" />

        {/* 4 Lower beads */}
        {[0, 1, 2, 3].map((bIdx) => {
          const isActive = bIdx < rodState.lowerCount;
          return (
            <AbacusBead
              key={bIdx}
              type="lower"
              isActive={isActive}
              onClick={() => handleLowerClick(bIdx)}
              disabled={disabled}
              theme={theme}
              beadColor={isHighlighted ? highlightColor : 'amber'}
              indexInDeck={bIdx}
              activeCount={rodState.lowerCount}
            />
          );
        })}
      </div>

      {/* NUMERICAL VALUE BADGE */}
      {showValue && (
        <div className="mt-1 h-7 flex items-center justify-center">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-xs select-none transition-all ${
              rodValue > 0
                ? isHighlighted
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 ring-1 ring-amber-300'
                  : 'bg-slate-700 text-amber-300 border border-slate-600'
                : 'bg-slate-900/60 text-slate-500'
            }`}
          >
            {rodValue}
          </div>
        </div>
      )}
    </div>
  );
};
