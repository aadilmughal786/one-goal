// app/components/routine/ExerciseTracker.tsx
'use client';

import { AppState, RoutineType, ScheduledRoutineBase } from '@/types';
import { User } from 'firebase/auth';
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

// --- REFLECTING THE REFACTOR ---
// We now import specific functions from our new, focused service modules.
import { getUserData } from '@/services/goalService';
import { updateRoutineSettings } from '@/services/routineService';
// NEW: Import useNotificationStore to use showToast
import { useNotificationStore } from '@/store/useNotificationStore';

// Import the reusable components
import RoutineCalendar from '@/components/routine/RoutineCalendar';
import RoutineSectionCard from '@/components/routine/RoutineSectionCard';

interface ExerciseTrackerProps {
  currentUser: User | null;
  appState: AppState | null;
  // REMOVED: showMessage is now handled internally via useNotificationStore, so it's removed from props
  onAppStateUpdate: (newAppState: AppState) => void;
}

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
 * This component has been refactored to use the new dedicated services.
 */
const ExerciseTracker: React.FC<ExerciseTrackerProps> = ({
  currentUser,
  appState,
  onAppStateUpdate,
}) => {
  const activeGoalId = appState?.activeGoalId;

  // NEW: Access showToast from the global notification store
  const showToast = useNotificationStore(state => state.showToast);

  const [schedules, setSchedules] = useState<ScheduledRoutineBase[]>(
    appState?.goals[activeGoalId || '']?.routineSettings?.exercise || []
  );

  useEffect(() => {
    if (activeGoalId && appState?.goals[activeGoalId]?.routineSettings) {
      setSchedules(appState.goals[activeGoalId].routineSettings.exercise || []);
    } else {
      setSchedules([]);
    }
  }, [appState, activeGoalId]);

  /**
   * A helper function to construct the new settings object and call the update service.
   * This avoids repeating logic in every handler.
   */
  const callUpdateRoutineSettings = useCallback(
    async (updatedSchedules: ScheduledRoutineBase[]) => {
      if (!currentUser || !activeGoalId || !appState) {
        throw new Error('User or goal not available for updating settings.');
      }
      const currentSettings = appState.goals[activeGoalId]?.routineSettings;
      if (!currentSettings) {
        throw new Error('Routine settings not found for the active goal.');
      }

      const newSettings = {
        ...currentSettings,
        exercise: updatedSchedules,
      };

      await updateRoutineSettings(currentUser.uid, activeGoalId, newSettings);
      const newAppState = await getUserData(currentUser.uid);
      onAppStateUpdate(newAppState);
    },
    [appState, currentUser, activeGoalId, onAppStateUpdate]
  );

  const toggleExerciseCompletion = useCallback(
    async (index: number) => {
      if (!currentUser || !activeGoalId) {
        showToast('You must be logged in and have an active goal to update schedules.', 'error');
        return;
      }
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
      setSchedules(updatedSchedules); // Optimistic UI update

      try {
        await callUpdateRoutineSettings(updatedSchedules);
        showToast('Exercise schedule updated!', 'success'); // Use global showToast
      } catch (error) {
        console.error('Failed to save exercise settings:', error);
        showToast('Failed to save exercise settings.', 'error'); // Use global showToast
        const oldState = await getUserData(currentUser!.uid);
        onAppStateUpdate(oldState);
      }
    },
    [currentUser, activeGoalId, schedules, showToast, onAppStateUpdate, callUpdateRoutineSettings] // Dependency on global showToast
  );

  const handleSaveSchedule = useCallback(
    async (schedule: ScheduledRoutineBase, index: number | null) => {
      if (!currentUser || !activeGoalId) {
        showToast('You must be logged in and have an active goal to save schedules.', 'error');
        return;
      }
      let updatedSchedules: ScheduledRoutineBase[];
      const messageType = index !== null ? 'updated' : 'added';

      if (index !== null) {
        updatedSchedules = schedules.map((s, i) => (i === index ? schedule : s));
      } else {
        updatedSchedules = [...schedules, schedule];
      }
      setSchedules(updatedSchedules); // Optimistic update

      try {
        await callUpdateRoutineSettings(updatedSchedules);
        showToast(messageType === 'updated' ? 'Workout updated!' : 'Workout added!', 'success'); // Use global showToast
      } catch (error) {
        console.error('Failed to save workout schedule:', error);
        showToast('Failed to save workout schedule.', 'error'); // Use global showToast
        const oldState = await getUserData(currentUser!.uid);
        onAppStateUpdate(oldState);
      }
    },
    [currentUser, activeGoalId, schedules, showToast, onAppStateUpdate, callUpdateRoutineSettings] // Dependency on global showToast
  );

  const handleRemoveSchedule = useCallback(
    async (indexToRemove: number) => {
      if (!currentUser || !activeGoalId) {
        showToast('You must be logged in and have an active goal to remove schedules.', 'error');
        return;
      }
      const updatedSchedules = schedules.filter((_, index) => index !== indexToRemove);
      setSchedules(updatedSchedules); // Optimistic update

      try {
        await callUpdateRoutineSettings(updatedSchedules);
        showToast('Workout schedule removed.', 'info'); // Use global showToast
      } catch (error) {
        console.error('Failed to remove workout schedule:', error);
        showToast('Failed to remove workout schedule.', 'error'); // Use global showToast
        const oldState = await getUserData(currentUser!.uid);
        onAppStateUpdate(oldState);
      }
    },
    [currentUser, activeGoalId, schedules, showToast, onAppStateUpdate, callUpdateRoutineSettings] // Dependency on global showToast
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
        // REMOVED: showToast prop is no longer needed, RoutineSectionCard gets it directly
        newInputLabelPlaceholder="e.g., Morning Run"
        newIconOptions={exerciseIcons}
        iconComponentsMap={IconComponents}
      />
      <RoutineCalendar
        appState={appState}
        currentUser={currentUser}
        onAppStateUpdate={onAppStateUpdate}
        routineType={RoutineType.EXERCISE}
        title="Exercise Log"
        icon={MdOutlineDirectionsRun}
      />
    </div>
  );
};

export default ExerciseTracker;
