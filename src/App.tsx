/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppTab, AppTheme, UserStats } from './types';
import { Navbar } from './components/Navbar';
import { FreePlayAbacus } from './components/Abacus/FreePlayAbacus';
import { TutorialMode } from './components/Tutorial/TutorialMode';
import { LongDivisionTutor } from './components/Division/LongDivisionTutor';
import { PracticeMode } from './components/Practice/PracticeMode';
import { VisualAnalytics } from './components/Analytics/VisualAnalytics';
import { soundEngine } from './utils/audio';
import { loadUserStats } from './utils/storage';

export default function App() {
  const [currentTab, setCurrentTab] = useState<AppTab>('abacus');
  const [theme, setTheme] = useState<AppTheme>('traditional');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [stats, setStats] = useState<UserStats>(() => loadUserStats());

  useEffect(() => {
    soundEngine.setSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  const handleToggleSound = () => {
    setSoundEnabled((prev) => !prev);
  };

  const handleStatsUpdated = (newStats: UserStats) => {
    setStats(newStats);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Navigation Header */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-3 sm:p-6 lg:p-8 flex flex-col">
        <AnimatePresence mode="wait">
          {currentTab === 'abacus' && (
            <motion.div
              key="abacus"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="w-full"
            >
              <FreePlayAbacus
                theme={theme}
                onChangeTheme={setTheme}
                soundEnabled={soundEnabled}
                onToggleSound={handleToggleSound}
              />
            </motion.div>
          )}

          {currentTab === 'tutorials' && (
            <motion.div
              key="tutorials"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="w-full"
            >
              <TutorialMode
                theme={theme}
                soundEnabled={soundEnabled}
                onToggleSound={handleToggleSound}
                onCompleteTutorial={() => setStats(loadUserStats())}
              />
            </motion.div>
          )}

          {currentTab === 'division' && (
            <motion.div
              key="division"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="w-full"
            >
              <LongDivisionTutor
                theme={theme}
                soundEnabled={soundEnabled}
                onToggleSound={handleToggleSound}
              />
            </motion.div>
          )}

          {currentTab === 'practice' && (
            <motion.div
              key="practice"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="w-full"
            >
              <PracticeMode
                theme={theme}
                soundEnabled={soundEnabled}
                onToggleSound={handleToggleSound}
                onSessionComplete={() => setStats(loadUserStats())}
              />
            </motion.div>
          )}

          {currentTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="w-full"
            >
              <VisualAnalytics stats={stats} onStatsUpdated={handleStatsUpdated} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Subtle Accessible Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950/80 py-3 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <span>Soroban (4+1 Abacus) • Designed for Touch & Desktop</span>
          <span className="font-mono text-[11px] text-amber-500/70">
            PWA Offline Ready • Instant Tactile Audio
          </span>
        </div>
      </footer>
    </div>
  );
}
