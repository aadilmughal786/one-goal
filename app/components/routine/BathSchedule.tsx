// app/components/routine/BathSchedule.tsx
'use client';

import { RoutineType, ScheduledRoutineBase } from '@/types';
import { Timestamp } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { MdOutlineHotTub, MdOutlinePool, MdOutlineShower, MdOutlineWash } from 'react-icons/md';

// --- REFACTOR: Import the global Zustand stores ---
import { useGoalStore } from '@/store/useGoalStore';
import { useNotificationStore } from '@/store/useNotificationStore';

// Import the reusable components
import RoutineCalendar from '@/components/routine/RoutineCalendar';
import RoutineSectionCard from '@/components/routine/RoutineSectionCard';

// Map of icon names (strings) to their actual React component imports
const IconComponents: { [key: string]: React.ElementType } = {
  MdOutlineShower,
  MdOutlineHotTub,
  MdOutlinePool,
  MdOutlineWash,
};

// Array of icon names to be passed as options to the ScheduleEditModal
const bathIcons: string[] = [
  'MdOutlineShower',
  'MdOutlineHotTub',
  'MdOutlinePool',
  'MdOutlineWash',
];

/**
 * BathSchedule Component
 *
 * Manages the display and functionality for user's bath and hygiene routines.
 * This component has been refactored to fetch its own data from the useGoalStore.
 */
const BathSchedule: React.FC = () => {
  // --- REFACTOR: Get all necessary state and actions from the stores ---
  const { appState, updateRoutineSettings } = useGoalStore(state => ({
    currentUser: state.currentUser,
    appState: state.appState,
    updateRoutineSettings: state.updateRoutineSettings,
  }));
  const showToast = useNotificationStore(state => state.showToast);

  const activeGoal = appState?.goals[appState?.activeGoalId || ''];

  const [schedules, setSchedules] = useState<ScheduledRoutineBase[]>([]);

  useEffect(() => {
    // Update local schedules state when the global store changes
    setSchedules(activeGoal?.routineSettings?.bath || []);
  }, [activeGoal]);

  /**
   * Toggles the completion status of a bath schedule.
   * This function now directly calls the `updateRoutineSettings` action from the store.
   */
  const toggleBathCompletion = useCallback(
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
        bath: updatedSchedules,
      };

      try {
        await updateRoutineSettings(newSettings);
        showToast('Bath schedule updated!', 'success');
      } catch (error) {
        // The store handles rollbacks, so we just log the error here.
        console.error('Failed to update bath schedule:', error);
      }
    },
    [schedules, activeGoal, updateRoutineSettings, showToast]
  );

  /**
   * Saves a new or updated bath schedule.
   * This function now directly calls the `updateRoutineSettings` action from the store.
   */
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
        bath: updatedSchedules,
      };

      try {
        await updateRoutineSettings(newSettings);
        showToast(messageType === 'updated' ? 'Bath time updated!' : 'Bath time added!', 'success');
      } catch (error) {
        console.error('Failed to save bath schedule:', error);
      }
    },
    [schedules, activeGoal, updateRoutineSettings, showToast]
  );

  /**
   * Removes a bath schedule from the list.
   * This function now directly calls the `updateRoutineSettings` action from the store.
   */
  const handleRemoveSchedule = useCallback(
    async (indexToRemove: number) => {
      if (!activeGoal) return;
      const updatedSchedules = schedules.filter((_, index) => index !== indexToRemove);
      const newSettings = {
        ...activeGoal.routineSettings,
        bath: updatedSchedules,
      };
      try {
        await updateRoutineSettings(newSettings);
        showToast('Bath schedule removed.', 'info');
      } catch (error) {
        console.error('Failed to remove bath schedule:', error);
      }
    },
    [schedules, activeGoal, updateRoutineSettings, showToast]
  );

  const completedSchedulesCount = schedules.filter(s => s.completed).length;

  return (
    <div className="space-y-8">
      <RoutineSectionCard
        sectionTitle="Bath & Hygiene Routine"
        summaryCount={`${completedSchedulesCount}/${schedules.length}`}
        summaryLabel="Sessions Completed Today"
        progressPercentage={
          schedules.length > 0 ? (completedSchedulesCount / schedules.length) * 100 : 0
        }
        listTitle="Your Bath Schedules"
        listEmptyMessage="No bath times scheduled. Add one to get started!"
        schedules={schedules}
        onToggleCompletion={toggleBathCompletion}
        onRemoveSchedule={handleRemoveSchedule}
        onSaveSchedule={handleSaveSchedule}
        newInputLabelPlaceholder="e.g., Evening Shower"
        newIconOptions={bathIcons}
        iconComponentsMap={IconComponents}
      />
      <RoutineCalendar
        routineType={RoutineType.BATH}
        title="Bath & Hygiene Log"
        icon={MdOutlineShower}
      />
    </div>
  );
};

export default BathSchedule;
