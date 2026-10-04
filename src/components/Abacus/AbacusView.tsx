import React from 'react';
import { RodState, AppTheme } from '../../types';
import { AbacusRod } from './AbacusRod';
import { soundEngine } from '../../utils/audio';
import { rodsToNumber, createEmptyRods } from '../../utils/abacus';
import { RotateCcw, Eye, EyeOff, Volume2, VolumeX, Sparkles } from 'lucide-react';

interface AbacusViewProps {
  rods: RodState[];
  onChange: (newRods: RodState[]) => void;
  unitRodIndex?: number;
  highlightedRods?: Record<number, 'amber' | 'blue' | 'emerald' | 'purple'>;
  rodLabels?: Record<number, string>;
  showValues?: boolean;
  onToggleShowValues?: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  theme?: AppTheme;
  title?: string;
  subtitle?: string;
  disabled?: boolean;
  className?: string;
  onClear?: () => void;
  extraControls?: React.ReactNode;
}

export const AbacusView: React.FC<AbacusViewProps> = ({
  rods,
  onChange,
  unitRodIndex = rods.length - 1,
  highlightedRods = {},
  rodLabels = {},
  showValues = true,
  onToggleShowValues,
  soundEnabled = true,
  onToggleSound,
  theme = 'traditional',
  title,
  subtitle,
  disabled = false,
  className = '',
  onClear,
  extraControls,
}) => {
  const totalValue = rodsToNumber(rods, unitRodIndex);

  const handleRodChange = (index: number, newRodState: RodState) => {
    if (disabled) return;
    const newRods = [...rods];
    newRods[index] = newRodState;
    onChange(newRods);
  };

  const handleClearSweep = () => {
    soundEngine.playClearSweep();
    const cleared = createEmptyRods(rods.length);
    onChange(cleared);
    if (onClear) onClear();
  };

  // Determine reckoning dots (typically placed at units rod and every 3 rods to the left)
  const isDotRod = (idx: number) => {
    if (idx === unitRodIndex) return true;
    const diff = unitRodIndex - idx;
    return diff > 0 && diff % 3 === 0;
  };

  // Place labels if none provided: 1000s, 100s, 10s, 1s
  const getPlaceLabel = (idx: number) => {
    if (rodLabels[idx]) return rodLabels[idx];
    const diff = unitRodIndex - idx;
    if (diff === 0) return '1';
    if (diff === 1) return '10';
    if (diff === 2) return '100';
    if (diff === 3) return '1k';
    if (diff === 4) return '10k';
    if (diff === 5) return '100k';
    if (diff === 6) return '1M';
    if (diff < 0) return `.${Math.abs(diff)}`;
    return '';
  };

  return (
    <div className={`flex flex-col w-full select-none ${className}`}>
      {/* Top Header Controls / Total Bar */}
      <div className="flex items-center justify-between gap-2 mb-2 px-1">
        <div className="flex items-center gap-2">
          {title ? (
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-1.5">
                <span>{title}</span>
              </h3>
              {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Reckoning Value:</span>
              <span className="font-mono font-extrabold text-lg sm:text-xl text-amber-400 bg-slate-900/90 border border-slate-700/60 px-3 py-0.5 rounded-lg shadow-inner">
                {showValues ? totalValue.toLocaleString() : '••••'}
              </span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {extraControls}

          {onToggleShowValues && (
            <button
              onClick={onToggleShowValues}
              className="p-1.5 sm:p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700/60 text-xs flex items-center gap-1"
              title={showValues ? 'Hide numbers (Mental math)' : 'Show numbers'}
            >
              {showValues ? <Eye className="w-3.5 h-3.5 text-amber-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
              <span className="hidden md:inline text-[11px]">{showValues ? 'Hide' : 'Show'}</span>
            </button>
          )}

          {onToggleSound && (
            <button
              onClick={onToggleSound}
              className="p-1.5 sm:p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700/60 text-xs"
              title={soundEnabled ? 'Mute bead clicks' : 'Enable bead clicks'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
            </button>
          )}

          <button
            onClick={handleClearSweep}
            disabled={disabled}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 text-amber-300 border border-amber-500/30 text-xs font-semibold transition"
            title="Clear all beads (Soroban Sweep)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Sweep</span>
          </button>
        </div>
      </div>

      {/* Main Soroban Physical Wooden Frame */}
      <div className="relative w-full rounded-2xl p-2.5 sm:p-4 bg-gradient-to-b from-stone-900 via-amber-950/80 to-stone-950 border-4 border-amber-900/70 shadow-[0_12px_36px_rgba(0,0,0,0.6)] ring-1 ring-amber-700/30 overflow-hidden">
        {/* Brass corner bracket inlays */}
        <div className="absolute top-1.5 left-1.5 w-4 h-4 border-t-2 border-l-2 border-amber-400/70 pointer-events-none" />
        <div className="absolute top-1.5 right-1.5 w-4 h-4 border-t-2 border-r-2 border-amber-400/70 pointer-events-none" />
        <div className="absolute bottom-1.5 left-1.5 w-4 h-4 border-b-2 border-l-2 border-amber-400/70 pointer-events-none" />
        <div className="absolute bottom-1.5 right-1.5 w-4 h-4 border-b-2 border-r-2 border-amber-400/70 pointer-events-none" />

        {/* Inner felt / slate background */}
        <div className="relative w-full bg-slate-950/85 rounded-xl border border-amber-900/40 p-1.5 sm:p-2 shadow-inner overflow-x-auto custom-scrollbar">
          <div className="flex justify-between items-stretch min-w-[320px] mx-auto">
            {rods.map((rod, idx) => (
              <AbacusRod
                key={idx}
                index={idx}
                rodState={rod}
                onChange={(newState) => handleRodChange(idx, newState)}
                isUnitRod={idx === unitRodIndex}
                hasReckoningDot={isDotRod(idx)}
                placeLabel={getPlaceLabel(idx)}
                showValue={showValues}
                isHighlighted={Boolean(highlightedRods[idx])}
                highlightColor={highlightedRods[idx]}
                theme={theme}
                disabled={disabled}
              />
            ))}
          </div>
        </div>

        {/* Bottom wood inlay trim */}
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-amber-400/60 font-mono px-2">
          <span>SOROBAN • 4+1 STANDARD</span>
          <span>DOT = RECKONING UNIT</span>
        </div>
      </div>
    </div>
  );
};
