// app/components/routine/WaterTracker.tsx
'use client';

import { AppState, RoutineType, WaterRoutineSettings } from '@/types';
import { User } from 'firebase/auth';
import React, { useCallback, useEffect, useState } from 'react';
import { MdAdd, MdOutlineWaterDrop, MdRemove } from 'react-icons/md';

// --- REFLECTING THE REFACTOR ---
// We now import specific functions from our new, focused service modules.
import { updateRoutineSettings } from '@/services/routineService';
// NEW: Import useNotificationStore to use showToast
import { useNotificationStore } from '@/store/useNotificationStore';

// Import the reusable calendar
import RoutineCalendar from '@/components/routine/RoutineCalendar';
import NoActiveGoalMessage from '../common/NoActiveGoalMessage';

interface WaterTrackerProps {
  currentUser: User | null;
  appState: AppState | null;
  // REMOVED: showMessage is now handled internally via useNotificationStore, so it's removed from props
  onAppStateUpdate: (newAppState: AppState) => void;
}

/**
 * WaterTracker Component
 *
 * Manages the user's daily water intake goal and tracks current consumption.
 * This component has been refactored to use the new dedicated services.
 */
const WaterTracker: React.FC<WaterTrackerProps> = ({ currentUser, appState, onAppStateUpdate }) => {
  const activeGoalId = appState?.activeGoalId;

  // NEW: Access showToast from the global notification store
  const showToast = useNotificationStore(state => state.showToast);

  const activeGoalWaterSettings = appState?.goals[activeGoalId || '']?.routineSettings?.water;

  const [waterGoal, setWaterGoal] = useState(activeGoalWaterSettings?.goal ?? 8);
  const [currentWater, setCurrentWater] = useState(activeGoalWaterSettings?.current ?? 0);

  useEffect(() => {
    if (activeGoalId && appState?.goals[activeGoalId]?.routineSettings?.water) {
      const newSettings = appState.goals[activeGoalId].routineSettings.water;
      setWaterGoal(newSettings.goal);
      setCurrentWater(newSettings.current);
    } else {
      setWaterGoal(8);
      setCurrentWater(0);
    }
  }, [appState, activeGoalId]);

  /**
   * Debounced function to save water settings to Firebase.
   * This is wrapped in useCallback to memoize the function.
   */
  const saveWaterSettings = useCallback(async () => {
    if (!currentUser || !activeGoalId || !appState) {
      console.warn('Attempted to save water settings without user or active goal.');
      return;
    }

    const currentSettings = appState.goals[activeGoalId]?.routineSettings;
    if (!currentSettings) {
      showToast('Could not find routine settings for the active goal.', 'error'); // Use global showToast
      return;
    }

    const newWaterSettings: WaterRoutineSettings = {
      goal: waterGoal,
      current: currentWater,
    };

    const newSettings = { ...currentSettings, water: newWaterSettings };

    try {
      // Use the generic routine service to update the settings object.
      await updateRoutineSettings(currentUser.uid, activeGoalId, newSettings);
      // Optional: A success message can be shown, but it's often omitted for debounced
      // saves to avoid spamming the user with notifications.
    } catch (error) {
      console.error('Failed to save water settings:', error);
      showToast('Failed to save water settings.', 'error'); // Use global showToast
    }
  }, [currentUser, activeGoalId, waterGoal, currentWater, showToast, appState]); // Dependency on global showToast

  // Effect to trigger `saveWaterSettings` with a debounce.
  // This saves data automatically 1 second after the user stops making changes.
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
      if (newValue < 0) return 0; // Prevent negative consumption
      if (newValue > waterGoal + 10) return waterGoal + 10; // Cap at a reasonable limit
      return newValue;
    });
  };

  if (!activeGoalId || !appState?.goals[activeGoalId]) {
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
        appState={appState}
        currentUser={currentUser}
        onAppStateUpdate={onAppStateUpdate}
        routineType={RoutineType.WATER}
        title="Water Intake Log"
        icon={MdOutlineWaterDrop}
      />
    </div>
  );
};

export default WaterTracker;
