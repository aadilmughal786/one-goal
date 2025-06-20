// app/components/routine/WaterTracker.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MdOutlineWaterDrop, MdAdd, MdRemove } from 'react-icons/md';
import { AppState, RoutineType, WaterRoutineSettings } from '@/types';
import { firebaseService } from '@/services/firebaseService';
import { User } from 'firebase/auth';

// Import the reusable calendar
import RoutineCalendar from '@/components/routine/RoutineCalendar';

interface WaterTrackerProps {
  currentUser: User | null;
  appState: AppState | null;
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
  onAppStateUpdate: (newAppState: AppState) => void;
}

/**
 * WaterTracker Component
 *
 * Manages the user's daily water intake goal and tracks current consumption.
 * It integrates with Firebase to store and retrieve water routine settings.
 *
 * Uses:
 * - A custom UI for displaying water glasses and interactive buttons to adjust intake.
 * - A range slider to set the daily water goal.
 * - RoutineCalendar to provide a calendar view for logging daily water routine completion.
 */
const WaterTracker: React.FC<WaterTrackerProps> = ({
  currentUser,
  appState,
  showMessage,
  onAppStateUpdate,
}) => {
  // Derive the active goal ID from the appState
  const activeGoalId = appState?.activeGoalId;
  // Get water routine settings for the active goal, or null if no active goal/settings
  const activeGoalWaterSettings = appState?.goals[activeGoalId || '']?.routineSettings?.water;

  // Local state for water goal and current consumption.
  // Initialized from active goal's settings or default values.
  const [waterGoal, setWaterGoal] = useState(activeGoalWaterSettings?.goal ?? 8);
  const [currentWater, setCurrentWater] = useState(activeGoalWaterSettings?.current ?? 0);

  // Effect to synchronize local state with the `appState` prop.
  // Ensures component re-renders with the latest data from Firebase.
  useEffect(() => {
    if (activeGoalId && appState?.goals[activeGoalId]?.routineSettings?.water) {
      const newSettings = appState.goals[activeGoalId].routineSettings.water;
      setWaterGoal(newSettings.goal); // Corrected to 'goal'
      setCurrentWater(newSettings.current); // Corrected to 'current'
    } else {
      // Reset to defaults if no active goal or water settings
      setWaterGoal(8);
      setCurrentWater(0);
    }
  }, [appState, activeGoalId]); // Dependencies: re-run if appState or activeGoalId changes

  /**
   * Debounced function to save water settings (goal and current consumption) to Firebase.
   * Prevents excessive writes during rapid changes (e.g., slider drag).
   */
  const saveWaterSettings = useCallback(async () => {
    if (!currentUser || !activeGoalId) {
      console.warn('Attempted to save water settings without user or active goal.');
      showMessage('Authentication or active goal required to save water settings.', 'error');
      return;
    }

    // Construct the WaterRoutineSettings object using the correct property names ('goal', 'current')
    const newSettings: WaterRoutineSettings = {
      goal: waterGoal,
      current: currentWater,
    };
    try {
      // Call Firebase service to update water routine settings for the active goal
      await firebaseService.updateWaterRoutineSettings(activeGoalId, currentUser.uid, newSettings);
      // Re-fetch entire appState to ensure data consistency across the app, including calendar logs
      const updatedAppState = await firebaseService.getUserData(currentUser.uid);
      onAppStateUpdate(updatedAppState);
      // Success message can be omitted for a smoother UX, as saving is frequent.
      // showMessage('Water settings saved!', 'success'); // Optional success message
    } catch (error) {
      console.error('Failed to save water settings:', error);
      showMessage('Failed to save water settings.', 'error');
      // No explicit revert of local state here, as `useEffect` syncs with `appState` anyway
    }
  }, [currentUser, activeGoalId, waterGoal, currentWater, showMessage, onAppStateUpdate]);

  // Effect to trigger `saveWaterSettings` with a debounce.
  // The settings will be saved 1 second after `waterGoal` or `currentWater` stops changing.
  useEffect(() => {
    const handler = setTimeout(() => {
      saveWaterSettings();
    }, 1000); // 1-second debounce
    return () => clearTimeout(handler); // Clear timeout on re-render or component unmount
  }, [waterGoal, currentWater, saveWaterSettings]); // Dependencies for debounce

  /**
   * Handles incrementing or decrementing the current water consumption.
   * Caps the value to prevent going below zero and allows a reasonable overshoot above goal.
   * @param increment The amount to add or subtract (e.g., 1 or -1).
   */
  const handleWaterChange = (increment: number) => {
    setCurrentWater(prev => {
      const newValue = prev + increment;
      if (newValue < 0) return 0; // Prevent negative consumption
      // Allow exceeding the goal, but cap it at a reasonable limit (e.g., goal + 10 glasses)
      // This prevents the number from getting excessively large if user keeps clicking.
      if (newValue > waterGoal + 10) return waterGoal + 10;
      return newValue;
    });
  };

  // If there's no active goal selected, display a placeholder message.
  if (!activeGoalId || !appState?.goals[activeGoalId]) {
    return (
      <div className="p-10 text-center text-white/60">
        <MdOutlineWaterDrop className="mx-auto mb-4 text-4xl" />
        <p>Set an active goal to configure your water intake goal and track your hydration.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Water Intake Main Card */}
      <div className="p-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl shadow-2xl">
        <h2 className="flex gap-3 items-center mb-6 text-2xl font-bold text-white">
          <MdOutlineWaterDrop size={28} />
          Daily Water Intake
        </h2>

        {/* Current Water / Goal Summary */}
        <div className="mb-6 text-center">
          <div className="text-4xl font-bold text-blue-400">
            {currentWater}
            <span className="text-2xl text-white/50">/{waterGoal}</span>
          </div>
          <div className="text-sm text-white/70">Glasses Consumed Today</div>
        </div>

        {/* Visual representation of water glasses (filled/empty) */}
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

        {/* Add/Remove Water Buttons */}
        <div className="flex gap-4 justify-center items-center mb-8">
          <button
            onClick={() => handleWaterChange(-1)}
            className="flex justify-center items-center w-14 h-14 text-3xl text-red-400 rounded-full transition-colors bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50"
            aria-label="Remove one glass"
            disabled={currentWater <= 0} // Disable if no water has been consumed
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

        {/* Adjust Daily Goal Slider */}
        <div className="p-6 rounded-xl border bg-black/20 border-white/10">
          <h3 className="mb-4 font-semibold text-white">Adjust Daily Goal</h3>
          <div className="mb-2 text-center">
            <span className="text-3xl font-bold text-blue-400">{waterGoal}</span>
            <span className="ml-2 text-white/70">glasses/day</span>
          </div>
          <input
            type="range"
            min="4" // Minimum goal of 4 glasses
            max="20" // Maximum goal of 20 glasses
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

      {/* Routine Calendar for Water Intake Logging */}
      <RoutineCalendar
        appState={appState}
        currentUser={currentUser}
        showMessage={showMessage}
        onAppStateUpdate={onAppStateUpdate}
        routineType={RoutineType.WATER} // Specify the routine type for this calendar instance
        title="Water Intake Log"
        icon={MdOutlineWaterDrop} // Default icon for the calendar header
      />
    </div>
  );
};

export default WaterTracker;
