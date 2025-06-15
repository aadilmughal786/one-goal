// app/components/routine/WaterTracker.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MdOutlineWaterDrop, MdAdd, MdRemove } from 'react-icons/md';
import { AppState, WaterRoutineSettings } from '@/types';
import { firebaseService } from '@/services/firebaseService';
import { User } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';

// Import the reusable RoutineSectionCard and IconOption

interface WaterTrackerProps {
  currentUser: User | null;
  appState: AppState | null;
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
}

const WaterTracker: React.FC<WaterTrackerProps> = ({ currentUser, appState, showMessage }) => {
  // Access initial values correctly, defaulting currentWaterGlasses to 0 if not present
  const initialWaterGoal = appState?.routineSettings?.water?.waterGoalGlasses || 8;
  const initialCurrentWater = appState?.routineSettings?.water?.currentWaterGlasses || 0;

  const [waterGoal, setWaterGoal] = useState(initialWaterGoal);
  const [currentWater, setCurrentWater] = useState(initialCurrentWater);

  // Sync local state with appState from Firebase
  useEffect(() => {
    if (appState?.routineSettings?.water) {
      setWaterGoal(appState.routineSettings.water.waterGoalGlasses);
      setCurrentWater(appState.routineSettings.water.currentWaterGlasses);
    } else {
      setWaterGoal(8);
      setCurrentWater(0);
    }
  }, [appState]);

  // Save water settings dynamically
  const saveWaterSettings = useCallback(async () => {
    if (!currentUser) {
      showMessage('You must be logged in to save settings.', 'error');
      return;
    }

    const newSettings: WaterRoutineSettings = {
      waterGoalGlasses: waterGoal,
      currentWaterGlasses: currentWater,
      updatedAt: Timestamp.now(),
    };

    try {
      await firebaseService.updateSpecificRoutineSetting(currentUser.uid, 'water', newSettings);
      // showMessage('Water settings saved!', 'success'); // Removed dynamic save toast
    } catch (error: unknown) {
      console.error('Failed to save water settings:', error);
      showMessage('Failed to save water settings.', 'error');
    }
  }, [currentUser, waterGoal, currentWater, showMessage]);

  // Effect to trigger save when waterGoal or currentWater changes
  useEffect(() => {
    // Only save if currentUser is available and not during initial load
    if (currentUser) {
      const handler = setTimeout(() => {
        saveWaterSettings();
      }, 500); // Debounce saves to avoid too many writes
      return () => clearTimeout(handler);
    }
  }, [waterGoal, currentWater, currentUser, saveWaterSettings]);

  const addWater = useCallback(() => {
    setCurrentWater(prev => Math.min(prev + 1, waterGoal)); // Don't exceed goal
  }, [waterGoal]);

  const removeWater = useCallback(() => {
    setCurrentWater(prev => Math.max(prev - 1, 0)); // Don't go below zero
  }, []);

  // Handler for goal input change (now a slider)
  const handleWaterGoalChange = useCallback((value: string) => {
    const val = parseInt(value);
    setWaterGoal(isNaN(val) ? 8 : Math.max(8, Math.min(30, val))); // Ensure min 8, max 30 glasses
  }, []);

  // Corrected progress bar calculation: clamped between 0 and 100
  const progressPercentage = waterGoal > 0 ? (currentWater / waterGoal) * 100 : 0;
  const clampedProgressPercentage = Math.max(0, Math.min(100, progressPercentage));

  return (
    <div className="p-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl shadow-2xl">
      {/* Header handled by RoutineSectionCard, but without time display as it's not a scheduled routine */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="flex gap-3 items-center text-2xl font-bold text-white">
          <MdOutlineWaterDrop size={28} />
          Water Intake
        </h2>
      </div>

      {/* Summary handled by RoutineSectionCard */}
      <div className="mb-6 text-center">
        <div className="text-4xl font-bold text-blue-400">
          {currentWater}/{waterGoal}
        </div>
        <div className="text-sm opacity-75 text-white/70">Glasses Consumed Today</div>
      </div>

      <div className="mb-8 h-3 rounded-full bg-white/20">
        <div
          className="h-3 bg-blue-400 rounded-full transition-all duration-500"
          style={{ width: `${clampedProgressPercentage}%` }} // Using clamped value here
        ></div>
      </div>

      {/* Water Intake Controls (unique to this component) - RESTRUCTURED UI */}
      <div className="flex flex-col gap-4 items-center mb-8">
        {' '}
        {/* Changed to flex-col for vertical stacking */}
        <div className="flex flex-wrap gap-2 justify-center max-w-full">
          {' '}
          {/* Container for glasses */}
          {Array.from({ length: waterGoal }, (_, i) => (
            <div
              key={i}
              className={`w-10 h-12 mx-0.5 my-1 rounded-b-full border-2 transition-all duration-300 flex items-end justify-center overflow-hidden relative ${
                i < currentWater ? 'bg-blue-400 border-blue-500' : 'bg-white/10 border-white/30' // Lighter empty glass
              }`}
              title={`${i < currentWater ? 'Filled' : 'Empty'} Glass`}
            >
              {/* Optional: Add a subtle water effect or icon inside */}
              {i < currentWater && (
                <MdOutlineWaterDrop size={20} className="absolute bottom-1 text-blue-700" />
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-4">
          {' '}
          {/* Buttons directly below glasses */}
          <button
            onClick={removeWater}
            className="flex justify-center items-center w-14 h-14 text-3xl text-red-400 rounded-full transition-colors cursor-pointer bg-red-500/20 hover:bg-red-500/30"
            aria-label="Remove one glass of water"
          >
            <MdRemove size={32} />
          </button>
          <button
            onClick={addWater}
            className="flex justify-center items-center w-14 h-14 text-3xl text-blue-400 rounded-full transition-colors cursor-pointer bg-blue-500/20 hover:bg-blue-500/30"
            aria-label="Add one glass of water"
          >
            <MdAdd size={32} />
          </button>
        </div>
      </div>

      {/* Water Goal Settings (custom, using a slider) */}
      <div className="bg-white/[0.02] rounded-xl p-6 shadow-lg border border-white/10">
        <h3 className="mb-4 font-semibold text-white">Water Intake Goal</h3>
        <div className="mb-4 text-center">
          <div className="text-4xl font-bold text-blue-400">{waterGoal}</div>
          <div className="text-sm text-white/70">glasses per day</div>
        </div>
        <input
          type="range"
          min="8"
          max="30"
          value={waterGoal}
          onChange={e => handleWaterGoalChange(e.target.value)}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-white/20 accent-blue-500"
        />
        <div className="flex justify-between mt-2 text-xs text-white/50">
          <span>8 glasses</span>
          <span>30 glasses</span>
        </div>
      </div>

      {/* No explicit save button here as saving is dynamic */}
    </div>
  );
};

export default WaterTracker;
