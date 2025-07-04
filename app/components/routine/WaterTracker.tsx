// app/components/routine/WaterTracker.tsx
'use client';

import NoActiveGoalMessage from '@/components/common/NoActiveGoalMessage';
import RoutineCalendar from '@/components/routine/RoutineCalendar';
import { useGoalStore } from '@/store/useGoalStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useRoutineStore } from '@/store/useRoutineStore';
import { RoutineType, WaterRoutineSettings } from '@/types';
import React from 'react';
import { MdAdd, MdOutlineWaterDrop, MdRemove } from 'react-icons/md';

const WaterTracker: React.FC = () => {
  const { appState } = useGoalStore();
  const { updateRoutineSettings } = useRoutineStore();
  const { showToast } = useNotificationStore();

  const activeGoal = appState?.goals[appState?.activeGoalId || ''];
  const waterSettings = activeGoal?.routineSettings?.water;
  const waterGoal = waterSettings?.goal ?? 8;
  const currentWater = waterSettings?.current ?? 0;

  const handleWaterSettingsChange = async (newValues: Partial<WaterRoutineSettings>) => {
    if (!activeGoal?.routineSettings) {
      showToast('Cannot update water settings: no active goal found.', 'error');
      return;
    }

    const currentWaterSettings = activeGoal.routineSettings.water || { goal: 8, current: 0 };
    const newWaterSettings = { ...currentWaterSettings, ...newValues };

    const newSettings = { ...activeGoal.routineSettings, water: newWaterSettings };

    try {
      await updateRoutineSettings(newSettings);
    } catch (error) {
      console.error('Failed to save water settings:', error);
    }
  };

  const handleWaterChange = (increment: number) => {
    const newValue = currentWater + increment;
    if (newValue < 0) return;
    if (newValue > waterGoal + 10) return;
    handleWaterSettingsChange({ current: newValue });
  };

  const handleGoalChange = (newGoal: number) => {
    handleWaterSettingsChange({ goal: newGoal });
  };

  if (!activeGoal) {
    return <NoActiveGoalMessage />;
  }

  return (
    <div className="space-y-8">
      <div className="card">
        <h2 className="flex gap-3 items-center mb-6 text-2xl font-bold text-text-primary">
          <MdOutlineWaterDrop size={28} />
          Daily Water Intake
        </h2>

        <div className="mb-6 text-center">
          <div className="text-4xl font-bold text-blue-400">
            {currentWater}
            <span className="text-2xl text-text-muted">/{waterGoal}</span>
          </div>
          <div className="text-sm text-text-secondary">Glasses Consumed Today</div>
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {Array.from({ length: waterGoal }, (_, i) => (
            <div
              key={i}
              className={`relative flex items-end justify-center w-10 h-16 rounded-t-lg rounded-b-md border-2 transition-all duration-300
                ${
                  i < currentWater
                    ? 'bg-blue-500/50 border-blue-400'
                    : 'bg-bg-tertiary border-border-secondary'
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
            className="flex justify-center items-center w-14 h-14 text-3xl text-red-400 rounded-full transition-colors cursor-pointer bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50"
            aria-label="Remove one glass"
            disabled={currentWater <= 0}
          >
            <MdRemove size={32} />
          </button>
          <button
            onClick={() => handleWaterChange(1)}
            className="flex justify-center items-center w-14 h-14 text-3xl text-blue-400 rounded-full transition-colors cursor-pointer bg-blue-500/20 hover:bg-blue-500/30"
            aria-label="Add one glass"
          >
            <MdAdd size={32} />
          </button>
        </div>

        <div className="p-6 rounded-xl border bg-bg-tertiary border-border-primary">
          <h3 className="mb-4 font-semibold text-text-primary">Adjust Daily Goal</h3>
          <div className="mb-2 text-center">
            <span className="text-3xl font-bold text-blue-400">{waterGoal}</span>
            <span className="ml-2 text-text-secondary">glasses/day</span>
          </div>
          <input
            type="range"
            min="4"
            max="20"
            value={waterGoal}
            onChange={e => handleGoalChange(parseInt(e.target.value, 10))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-bg-primary accent-blue-500"
            aria-label="Daily water goal in glasses"
          />
          <div className="flex justify-between mt-1 text-xs text-text-muted">
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
