// app/components/routine/WaterTracker.tsx
'use client';

import NoActiveGoalMessage from '@/components/common/NoActiveGoalMessage';
import RoutineCalendar from '@/components/routine/RoutineCalendar';
// --- REFACTOR: Import the global Zustand stores ---
import { useGoalStore } from '@/store/useGoalStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { RoutineType, WaterRoutineSettings } from '@/types';
import React, { useCallback, useEffect, useState } from 'react';
import { MdAdd, MdOutlineWaterDrop, MdRemove } from 'react-icons/md';

/**
 * WaterTracker Component
 *
 * Manages the user's daily water intake goal and tracks current consumption.
 * This component has been refactored to use the new dedicated services and global store.
 */
const WaterTracker: React.FC = () => {
  // --- REFACTOR: Get all necessary state and actions from the stores ---
  // FIX: Select each piece of state individually to prevent infinite loops.
  const appState = useGoalStore(state => state.appState);
  const updateRoutineSettings = useGoalStore(state => state.updateRoutineSettings);
  const showToast = useNotificationStore(state => state.showToast);

  const activeGoal = appState?.goals[appState?.activeGoalId || ''];

  const [waterGoal, setWaterGoal] = useState(8);
  const [currentWater, setCurrentWater] = useState(0);

  useEffect(() => {
    // Update local state when the global store changes
    const settings = activeGoal?.routineSettings?.water;
    setWaterGoal(settings?.goal ?? 8);
    setCurrentWater(settings?.current ?? 0);
  }, [activeGoal]);

  /**
   * Debounced function to save water settings to Firestore.
   */
  const saveWaterSettings = useCallback(async () => {
    if (!activeGoal) return;

    const newWaterSettings: WaterRoutineSettings = {
      goal: waterGoal,
      current: currentWater,
    };

    const newSettings = { ...activeGoal.routineSettings, water: newWaterSettings };

    try {
      await updateRoutineSettings(newSettings);
      // Success toast is omitted for debounced saves to avoid spamming the user.
    } catch (error) {
      console.error('Failed to save water settings:', error);
      showToast('Failed to save water settings.', 'error');
    }
  }, [activeGoal, waterGoal, currentWater, showToast, updateRoutineSettings]);

  // Effect to trigger `saveWaterSettings` with a debounce.
  useEffect(() => {
    const handler = setTimeout(() => {
      saveWaterSettings();
    }, 1000); // 1-second debounce
    return () => clearTimeout(handler);
  }, [waterGoal, currentWater, saveWaterSettings]);

  /**
   * Handles incrementing or decrementing the current water consumption.
   */
  const handleWaterChange = (increment: number) => {
    setCurrentWater(prev => {
      const newValue = prev + increment;
      if (newValue < 0) return 0;
      if (newValue > waterGoal + 10) return waterGoal + 10;
      return newValue;
    });
  };

  if (!activeGoal) {
    return <NoActiveGoalMessage />;
  }

  return (
    <div className="space-y-8">
      <div className="p-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl shadow-2xl">
        <h2 className="flex gap-3 items-center mb-6 text-2xl font-bold text-white">
          <MdOutlineWaterDrop size={28} />
          Daily Water Intake
        </h2>

        <div className="mb-6 text-center">
          <div className="text-4xl font-bold text-blue-400">
            {currentWater}
            <span className="text-2xl text-white/50">/{waterGoal}</span>
          </div>
          <div className="text-sm text-white/70">Glasses Consumed Today</div>
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {Array.from({ length: waterGoal }, (_, i) => (
            <div
              key={i}
              className={`relative flex items-end justify-center w-10 h-16 rounded-t-lg rounded-b-md border-2 transition-all duration-300
                ${
                  i < currentWater
                    ? 'bg-blue-500/50 border-blue-400'
                    : 'bg-white/10 border-white/30'
                }`}
              title={`Glass ${i + 1} ${i < currentWater ? '(Full)' : '(Empty)'}`}
              aria-label={`Glass ${i + 1}, ${i < currentWater ? 'filled' : 'empty'}`}
            >
              {i < currentWater && (
                <MdOutlineWaterDrop size={20} className="absolute bottom-1 text-white opacity-50" />
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-4 justify-center items-center mb-8">
          <button
            onClick={() => handleWaterChange(-1)}
            className="flex justify-center items-center w-14 h-14 text-3xl text-red-400 rounded-full transition-colors bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50"
            aria-label="Remove one glass"
            disabled={currentWater <= 0}
          >
            <MdRemove size={32} />
          </button>
          <button
            onClick={() => handleWaterChange(1)}
            className="flex justify-center items-center w-14 h-14 text-3xl text-blue-400 rounded-full transition-colors bg-blue-500/20 hover:bg-blue-500/30"
            aria-label="Add one glass"
          >
            <MdAdd size={32} />
          </button>
        </div>

        <div className="p-6 rounded-xl border bg-black/20 border-white/10">
          <h3 className="mb-4 font-semibold text-white">Adjust Daily Goal</h3>
          <div className="mb-2 text-center">
            <span className="text-3xl font-bold text-blue-400">{waterGoal}</span>
            <span className="ml-2 text-white/70">glasses/day</span>
          </div>
          <input
            type="range"
            min="4"
            max="20"
            value={waterGoal}
            onChange={e => setWaterGoal(parseInt(e.target.value, 10))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-white/20 accent-blue-500"
            aria-label="Daily water goal in glasses"
          />
          <div className="flex justify-between mt-1 text-xs text-white/50">
            <span>4</span>
            <span>20</span>
          </div>
        </div>
      </div>

      <RoutineCalendar
        routineType={RoutineType.WATER}
        title="Water Intake Log"
        icon={MdOutlineWaterDrop}
      />
    </div>
  );
};

export default WaterTracker;
