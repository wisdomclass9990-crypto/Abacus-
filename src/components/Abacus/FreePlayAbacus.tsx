import React, { useState } from 'react';
import { RodState, AppTheme, AbacusConfig } from '../../types';
import { AbacusView } from './AbacusView';
import { createEmptyRods, numberToRods, rodsToNumber } from '../../utils/abacus';
import { soundEngine } from '../../utils/audio';
import {
  Sparkles,
  Sliders,
  Palette,
  Hash,
  Eye,
  EyeOff,
  RotateCcw,
  Zap,
  Check,
} from 'lucide-react';

interface FreePlayAbacusProps {
  theme: AppTheme;
  onChangeTheme: (theme: AppTheme) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const FreePlayAbacus: React.FC<FreePlayAbacusProps> = ({
  theme,
  onChangeTheme,
  soundEnabled,
  onToggleSound,
}) => {
  const [rodCount, setRodCount] = useState<number>(9);
  const [unitRodIndex, setUnitRodIndex] = useState<number>(8);
  const [rods, setRods] = useState<RodState[]>(() => createEmptyRods(9));
  const [showValues, setShowValues] = useState<boolean>(true);
  const [directNumberInput, setDirectNumberInput] = useState<string>('');

  const currentTotal = rodsToNumber(rods, unitRodIndex);

  const handleRodCountChange = (count: number) => {
    setRodCount(count);
    const newUnitIdx = count - 1;
    setUnitRodIndex(newUnitIdx);
    setRods(numberToRods(currentTotal, count, newUnitIdx));
  };

  const handleSetDirectNumber = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(directNumberInput.trim(), 10);
    if (!isNaN(val)) {
      soundEngine.playBeadClick(1.1);
      setRods(numberToRods(val, rodCount, unitRodIndex));
      setDirectNumberInput('');
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full max-w-6xl mx-auto">
      {/* Top Banner / Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Soroban Free Reckoning Sandbox
          </h2>
          <p className="text-xs text-slate-400">
            Interactive multi-rod abacus playground with customizable rod sizes and themes.
          </p>
        </div>

        {/* Rod count selector & Theme selector */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Rod Count */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-xl p-1 text-xs">
            <span className="text-slate-400 px-2 font-medium">Rods:</span>
            {[7, 9, 11, 13].map((c) => (
              <button
                key={c}
                onClick={() => handleRodCountChange(c)}
                className={`px-2.5 py-1 rounded-lg font-mono font-bold transition ${
                  rodCount === c
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Theme Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-xl p-1 text-xs">
            <Palette className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            {[
              { id: 'traditional', label: 'Classic Wood' },
              { id: 'modern', label: 'Slate' },
              { id: 'bamboo', label: 'Bamboo' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => onChangeTheme(t.id as AppTheme)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  theme === t.id
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Abacus Display */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl">
        <AbacusView
          rods={rods}
          onChange={setRods}
          unitRodIndex={unitRodIndex}
          showValues={showValues}
          onToggleShowValues={() => setShowValues(!showValues)}
          soundEnabled={soundEnabled}
          onToggleSound={onToggleSound}
          theme={theme}
        />
      </div>

      {/* Helper Tools: Direct Number Setter & Mental Math Switch */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Direct Number Input */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Hash className="w-4 h-4 text-amber-400" />
              Direct Number Setter
            </h3>
            <p className="text-xs text-slate-400">
              Type any number to automatically arrange the beads and study its Soroban representation.
            </p>
          </div>

          <form onSubmit={handleSetDirectNumber} className="mt-3 flex gap-2">
            <input
              type="number"
              placeholder="e.g. 1984"
              value={directNumberInput}
              onChange={(e) => setDirectNumberInput(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
            >
              Set Beads
            </button>
          </form>
        </div>

        {/* Mental Math Mode / Bead Reading Guide */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-blue-400" />
              Mental Abacus Training
            </h3>
            <p className="text-xs text-slate-400">
              Toggle numerical values off to test your ability to read the beads visually (Flash Anzan skill).
            </p>
          </div>

          <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800">
            <span className="text-xs font-mono text-slate-300">
              Numbers display: <strong className={showValues ? 'text-amber-400' : 'text-slate-500'}>{showValues ? 'Visible' : 'Hidden'}</strong>
            </span>

            <button
              onClick={() => setShowValues(!showValues)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition"
            >
              {showValues ? 'Hide Values' : 'Show Values'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
