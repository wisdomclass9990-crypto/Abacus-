import React from 'react';
import { motion } from 'motion/react';
import { AppTheme } from '../../types';

interface AbacusBeadProps {
  type: 'upper' | 'lower';
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
  theme?: AppTheme;
  beadColor?: 'amber' | 'blue' | 'emerald' | 'purple';
  indexInDeck?: number; // for lower beads (0 = closest to beam, 3 = closest to bottom)
  activeCount?: number;
}

export const AbacusBead: React.FC<AbacusBeadProps> = ({
  type,
  isActive,
  onClick,
  disabled = false,
  theme = 'traditional',
  beadColor = 'amber',
  indexInDeck = 0,
  activeCount = 0,
}) => {
  // Theme color definitions for beads
  const getColors = () => {
    if (beadColor === 'blue') {
      return {
        bg: 'from-blue-400 via-blue-600 to-blue-800',
        border: 'border-blue-300/40',
        ring: 'shadow-[0_4px_12px_rgba(37,99,235,0.4)]',
        ridge: 'bg-blue-300/60',
      };
    }
    if (beadColor === 'emerald') {
      return {
        bg: 'from-emerald-400 via-emerald-600 to-emerald-800',
        border: 'border-emerald-300/40',
        ring: 'shadow-[0_4px_12px_rgba(16,185,129,0.4)]',
        ridge: 'bg-emerald-300/60',
      };
    }
    if (theme === 'bamboo') {
      return {
        bg: 'from-amber-200 via-amber-500 to-amber-700',
        border: 'border-amber-200/50',
        ring: 'shadow-[0_4px_10px_rgba(217,119,6,0.35)]',
        ridge: 'bg-amber-100/70',
      };
    }
    if (theme === 'modern') {
      return {
        bg: 'from-amber-400 via-orange-500 to-amber-700',
        border: 'border-amber-300/30',
        ring: 'shadow-[0_4px_12px_rgba(245,158,11,0.35)]',
        ridge: 'bg-amber-200/70',
      };
    }
    // Traditional: Rich warm polished wooden beads
    return {
      bg: 'from-orange-300 via-amber-600 to-orange-900',
      border: 'border-amber-200/40',
      ring: 'shadow-[0_4px_10px_rgba(154,52,18,0.45)]',
      ridge: 'bg-amber-200/60',
    };
  };

  const colors = getColors();

  // Position calculation for animations:
  // Upper bead:
  //   inactive = UP (top: 4px)
  //   active = DOWN against beam (top: 36px)
  // Lower beads (deck height ~150px, each bead ~24px tall):
  //   active beads pushed UP towards beam
  //   inactive beads pushed DOWN away from beam
  let translateY = 0;
  if (type === 'upper') {
    translateY = isActive ? 34 : 0;
  } else {
    // Lower bead
    // If active: pushed UP against beam with index offset
    // If inactive: pushed DOWN against bottom frame with index offset
    if (isActive) {
      translateY = indexInDeck * 24;
    } else {
      // Pushed to bottom: bottom area starts at ~60px
      translateY = 62 + indexInDeck * 24;
    }
  }

  return (
    <motion.div
      className={`absolute w-full px-1 cursor-pointer bead-touch-zone select-none ${
        disabled ? 'cursor-not-allowed opacity-80' : ''
      }`}
      animate={{ y: translateY }}
      transition={{
        type: 'spring',
        stiffness: 420,
        damping: 26,
        mass: 0.8,
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onClick();
      }}
      role="button"
      tabIndex={0}
      aria-label={`${type} bead ${isActive ? 'active' : 'inactive'}`}
    >
      {/* Bi-conical Soroban bead (diamond-like profile with central ridge) */}
      <div
        className={`relative h-6 w-full rounded-sm bg-gradient-to-b ${colors.bg} ${colors.ring} border-t ${colors.border} transition-transform duration-75 active:scale-95 flex items-center justify-center overflow-hidden`}
        style={{
          clipPath: 'polygon(12% 0%, 88% 0%, 100% 50%, 88% 100%, 12% 100%, 0% 50%)',
        }}
      >
        {/* Central sharp ridge reflection line characteristic of Soroban beads */}
        <div className={`absolute top-1/2 left-0 w-full h-[1.5px] -translate-y-1/2 ${colors.ridge}`} />

        {/* Top gloss highlight */}
        <div className="absolute top-0.5 left-2 right-2 h-1 bg-white/30 rounded-full blur-[0.5px]" />
      </div>
    </motion.div>
  );
};
