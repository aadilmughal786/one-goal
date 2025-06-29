// app/components/routine/ExerciseTracker.tsx
'use client';

import { RoutineType, ScheduledRoutineBase } from '@/types';
import { Timestamp } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import {
  MdOutlineDirectionsBike,
  MdOutlineDirectionsRun,
  MdOutlineFitnessCenter,
  MdOutlineSportsBasketball,
  MdOutlineSportsHandball,
  MdOutlineSportsSoccer,
} from 'react-icons/md';

// --- REFACTOR: Import the global Zustand stores ---
import { useGoalStore } from '@/store/useGoalStore';
import { useNotificationStore } from '@/store/useNotificationStore';

// Import the reusable components
import RoutineCalendar from '@/components/routine/RoutineCalendar';
import RoutineSectionCard from '@/components/routine/RoutineSectionCard';

// Map of icon names (strings) to their actual React component imports
const IconComponents: { [key: string]: React.ElementType } = {
  MdOutlineDirectionsRun,
  MdOutlineFitnessCenter,
  MdOutlineSportsHandball,
  MdOutlineSportsSoccer,
  MdOutlineSportsBasketball,
  MdOutlineDirectionsBike,
};

// Array of icon names to be passed as options to the ScheduleEditModal
const exerciseIcons: string[] = [
  'MdOutlineDirectionsRun',
  'MdOutlineFitnessCenter',
  'MdOutlineSportsHandball',
  'MdOutlineSportsSoccer',
  'MdOutlineSportsBasketball',
  'MdOutlineDirectionsBike',
];

/**
 * ExerciseTracker Component
 *
 * Manages the display and functionality for user's exercise routines.
 * This component has been refactored to fetch its own data from the useGoalStore.
 */
const ExerciseTracker: React.FC = () => {
  // --- REFACTOR: Get all necessary state and actions from the stores ---
  // FIX: Select each piece of state individually to prevent infinite loops.
  const appState = useGoalStore(state => state.appState);
  const updateRoutineSettings = useGoalStore(state => state.updateRoutineSettings);
  const showToast = useNotificationStore(state => state.showToast);

  const activeGoal = appState?.goals[appState?.activeGoalId || ''];

  const [schedules, setSchedules] = useState<ScheduledRoutineBase[]>([]);

  useEffect(() => {
    // Update local schedules state when the global store changes
    setSchedules(activeGoal?.routineSettings?.exercise || []);
  }, [activeGoal]);

  const toggleExerciseCompletion = useCallback(
    async (index: number) => {
      if (!activeGoal) return;

      const updatedSchedules = schedules.map((schedule, i) =>
        i === index
          ? {
              ...schedule,
              completed: !schedule.completed,
              updatedAt: Timestamp.now(),
              completedAt: !schedule.completed ? Timestamp.now() : null,
            }
          : schedule
      );

      const newSettings = {
        ...activeGoal.routineSettings,
        exercise: updatedSchedules,
      };

      try {
        await updateRoutineSettings(newSettings);
        showToast('Exercise schedule updated!', 'success');
      } catch (error) {
        console.error('Failed to update exercise schedule:', error);
      }
    },
    [schedules, activeGoal, updateRoutineSettings, showToast]
  );

  const handleSaveSchedule = useCallback(
    async (schedule: ScheduledRoutineBase, index: number | null) => {
      if (!activeGoal) return;

      let updatedSchedules: ScheduledRoutineBase[];
      const messageType = index !== null ? 'updated' : 'added';

      if (index !== null) {
        updatedSchedules = schedules.map((s, i) => (i === index ? schedule : s));
      } else {
        updatedSchedules = [...schedules, schedule];
      }

      const newSettings = {
        ...activeGoal.routineSettings,
        exercise: updatedSchedules,
      };

      try {
        await updateRoutineSettings(newSettings);
        showToast(messageType === 'updated' ? 'Workout updated!' : 'Workout added!', 'success');
      } catch (error) {
        console.error('Failed to save workout schedule:', error);
      }
    },
    [schedules, activeGoal, updateRoutineSettings, showToast]
  );

  const handleRemoveSchedule = useCallback(
    async (indexToRemove: number) => {
      if (!activeGoal) return;
      const updatedSchedules = schedules.filter((_, index) => index !== indexToRemove);
      const newSettings = {
        ...activeGoal.routineSettings,
        exercise: updatedSchedules,
      };
      try {
        await updateRoutineSettings(newSettings);
        showToast('Workout schedule removed.', 'info');
      } catch (error) {
        console.error('Failed to remove workout schedule:', error);
      }
    },
    [schedules, activeGoal, updateRoutineSettings, showToast]
  );

  const completedSchedulesCount = schedules.filter(s => s.completed).length;

  return (
    <div className="space-y-8">
      <RoutineSectionCard
        sectionTitle="Exercise Routine"
        summaryCount={`${completedSchedulesCount}/${schedules.length}`}
        summaryLabel="Workouts Completed Today"
        progressPercentage={
          schedules.length > 0 ? (completedSchedulesCount / schedules.length) * 100 : 0
        }
        listTitle="Your Exercise Schedules"
        listEmptyMessage="No workouts scheduled. Add one to get started!"
        schedules={schedules}
        onToggleCompletion={toggleExerciseCompletion}
        onRemoveSchedule={handleRemoveSchedule}
        onSaveSchedule={handleSaveSchedule}
        newInputLabelPlaceholder="e.g., Morning Run"
        newIconOptions={exerciseIcons}
        iconComponentsMap={IconComponents}
      />
      <RoutineCalendar
        routineType={RoutineType.EXERCISE}
        title="Exercise Log"
        icon={MdOutlineDirectionsRun}
      />
    </div>
  );
};

export default ExerciseTracker;
