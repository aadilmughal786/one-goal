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

const WaterTracker: React.FC<WaterTrackerProps> = ({
  currentUser,
  appState,
  showMessage,
  onAppStateUpdate,
}) => {
  const initialSettings = appState?.routineSettings?.water;
  const [waterGoal, setWaterGoal] = useState(initialSettings?.waterGoalGlasses ?? 8);
  const [currentWater, setCurrentWater] = useState(initialSettings?.currentWaterGlasses ?? 0);

  // Sync local state with the appState prop
  useEffect(() => {
    const newSettings = appState?.routineSettings?.water;
    setWaterGoal(newSettings?.waterGoalGlasses ?? 8);
    setCurrentWater(newSettings?.currentWaterGlasses ?? 0);
  }, [appState]);

  // Debounced save function for water settings
  const saveWaterSettings = useCallback(async () => {
    if (!currentUser) return;
    const newSettings: WaterRoutineSettings = {
      waterGoalGlasses: waterGoal,
      currentWaterGlasses: currentWater,
    };
    try {
      await firebaseService.updateWaterRoutineSettings(currentUser.uid, newSettings);
      // Success message can be omitted for a smoother UX, as saving is frequent.
    } catch {
      showMessage('Failed to save water settings.', 'error');
    }
  }, [currentUser, waterGoal, currentWater, showMessage]);

  // Trigger save on state change with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      saveWaterSettings();
    }, 1000); // 1-second debounce
    return () => clearTimeout(handler);
  }, [waterGoal, currentWater, saveWaterSettings]);

  const handleWaterChange = (increment: number) => {
    setCurrentWater(prev => {
      const newValue = prev + increment;
      if (newValue < 0) return 0;
      // Allow exceeding the goal, but cap it at a reasonable limit, e.g., goal + 10
      if (newValue > waterGoal + 10) return waterGoal + 10;
      return newValue;
    });
  };

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

        {/* New Glass UI replaces the progress bar */}
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
        showMessage={showMessage}
        onAppStateUpdate={onAppStateUpdate}
        routineType={RoutineType.WATER}
        title="Water Intake Log"
        icon={MdOutlineWaterDrop}
      />
    </div>
  );
};

export default WaterTracker;
