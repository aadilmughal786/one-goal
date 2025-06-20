// app/components/routine/BathSchedule.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MdOutlineShower, MdOutlineHotTub, MdOutlinePool, MdOutlineWash } from 'react-icons/md';
import { AppState, RoutineType, ScheduledRoutineBase } from '@/types';
import { firebaseService } from '@/services/firebaseService';
import { User } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore'; // Import Timestamp

// Import the reusable components
import RoutineSectionCard from '@/components/routine/RoutineSectionCard';
import RoutineCalendar from '@/components/routine/RoutineCalendar';

interface BathScheduleProps {
  currentUser: User | null;
  appState: AppState | null;
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
  onAppStateUpdate: (newAppState: AppState) => void;
}

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
 * It integrates with Firebase to store and retrieve scheduled routines and their completion status.
 *
 * Uses:
 * - RoutineSectionCard to display the list of scheduled bath times and their progress.
 * - RoutineCalendar to provide a calendar view for logging daily bath routine completion.
 */
const BathSchedule: React.FC<BathScheduleProps> = ({
  currentUser,
  appState,
  showMessage,
  onAppStateUpdate,
}) => {
  // Derive the active goal ID from the appState
  const activeGoalId = appState?.activeGoalId;

  // State to hold the bath schedules for the currently active goal
  const [schedules, setSchedules] = useState<ScheduledRoutineBase[]>(
    appState?.goals[activeGoalId || '']?.routineSettings?.bath || []
  );

  // Effect to update local schedules state whenever appState changes,
  // specifically when the active goal's bath settings are updated from Firebase.
  useEffect(() => {
    if (activeGoalId && appState?.goals[activeGoalId]?.routineSettings) {
      setSchedules(appState.goals[activeGoalId].routineSettings.bath || []);
    } else {
      setSchedules([]); // Clear schedules if no active goal or settings
    }
  }, [appState, activeGoalId]);

  /**
   * Toggles the 'completed' status of a specific bath schedule.
   * Updates the local state and then persists the change to Firebase.
   * @param index The index of the schedule in the current `schedules` array to toggle.
   */
  const toggleBathCompletion = useCallback(
    async (index: number) => {
      if (!currentUser || !activeGoalId) {
        showMessage('You must be logged in and have an active goal to update schedules.', 'error');
        return;
      }

      // Create a new array with the toggled schedule's completion status and updated timestamp
      const updatedSchedules = schedules.map((schedule, i) =>
        i === index
          ? {
              ...schedule,
              completed: !schedule.completed,
              updatedAt: Timestamp.now(), // Update timestamp on modification
              completedAt: !schedule.completed ? Timestamp.now() : null, // Set/clear completedAt
            }
          : schedule
      );

      // Optimistically update local state for immediate UI feedback
      setSchedules(updatedSchedules);

      try {
        // Persist the updated schedules to Firebase for the active goal
        await firebaseService.updateBathRoutineSchedules(
          activeGoalId,
          currentUser.uid,
          updatedSchedules
        );
        // Re-fetch the entire appState to ensure all contexts are updated consistently
        const newAppState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(newAppState);
        showMessage('Bath schedule updated!', 'success');
      } catch (error) {
        console.error('Failed to save bath settings:', error);
        showMessage('Failed to save bath settings.', 'error');
        // Revert to old state if save fails by re-fetching from Firebase
        const oldState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(oldState);
      }
    },
    [currentUser, activeGoalId, schedules, showMessage, onAppStateUpdate]
  );

  /**
   * Handles saving a new or updated bath schedule.
   * This function is passed to and called by the ScheduleEditModal.
   * @param schedule The ScheduledRoutineBase object to save/update.
   * @param index The original index if updating an existing schedule, or null if adding a new one.
   */
  const handleSaveSchedule = useCallback(
    async (schedule: ScheduledRoutineBase, index: number | null) => {
      if (!currentUser || !activeGoalId) {
        showMessage('You must be logged in and have an active goal to save schedules.', 'error');
        return;
      }

      let updatedSchedules: ScheduledRoutineBase[];
      let messageType: 'added' | 'updated';

      if (index !== null) {
        // If index is provided, it's an update operation
        updatedSchedules = schedules.map((s, i) => (i === index ? schedule : s));
        messageType = 'updated';
      } else {
        // If no index, it's a new schedule
        updatedSchedules = [...schedules, schedule];
        messageType = 'added';
      }

      // Optimistically update local state
      setSchedules(updatedSchedules);

      try {
        // Persist the updated schedules to Firebase for the active goal
        await firebaseService.updateBathRoutineSchedules(
          activeGoalId,
          currentUser.uid,
          updatedSchedules
        );
        showMessage(
          messageType === 'updated' ? 'Bath time updated!' : 'Bath time added!',
          'success'
        );
        // Re-fetch appState after successful save to ensure data consistency across the app
        const newAppState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(newAppState);
      } catch (error) {
        console.error('Failed to save bath schedule:', error);
        showMessage('Failed to save bath schedule.', 'error');
        // Revert local state by re-fetching original data from Firebase
        const oldState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(oldState);
      }
    },
    [currentUser, activeGoalId, schedules, showMessage, onAppStateUpdate]
  );

  /**
   * Handles removing a specific bath schedule.
   * Updates the local state and then persists the change to Firebase.
   * @param indexToRemove The index of the schedule to remove from the current `schedules` array.
   */
  const handleRemoveSchedule = useCallback(
    async (indexToRemove: number) => {
      if (!currentUser || !activeGoalId) {
        showMessage('You must be logged in and have an active goal to remove schedules.', 'error');
        return;
      }

      // Filter out the schedule to be removed
      const updatedSchedules = schedules.filter((_, index) => index !== indexToRemove);

      // Optimistically update local state
      setSchedules(updatedSchedules);

      try {
        // Persist the updated schedules to Firebase for the active goal
        await firebaseService.updateBathRoutineSchedules(
          activeGoalId,
          currentUser.uid,
          updatedSchedules
        );
        showMessage('Bath schedule removed.', 'info');
        // Re-fetch appState after successful removal
        const newAppState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(newAppState);
      } catch (error) {
        console.error('Failed to remove bath schedule:', error);
        showMessage('Failed to remove bath schedule.', 'error');
        // Revert local state by re-fetching original data from Firebase
        const oldState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(oldState);
      }
    },
    [currentUser, activeGoalId, schedules, showMessage, onAppStateUpdate]
  );

  // Calculate the number of completed schedules for the summary card
  const completedSchedulesCount = schedules.filter(s => s.completed).length;

  return (
    <div className="space-y-8">
      {/* Routine Section Card for Bath Schedules */}
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
        onSaveSchedule={handleSaveSchedule} // Pass the save handler
        showMessage={showMessage} // Pass the showMessage handler
        newInputLabelPlaceholder="e.g., Evening Shower"
        newIconOptions={bathIcons}
        iconComponentsMap={IconComponents}
      />
      {/* Routine Calendar for Bath Routine Logging */}
      <RoutineCalendar
        appState={appState}
        currentUser={currentUser}
        showMessage={showMessage}
        onAppStateUpdate={onAppStateUpdate}
        routineType={RoutineType.BATH} // Specify this calendar instance is for BATH routines
        title="Bath & Hygiene Log"
        icon={MdOutlineShower} // Default icon for the calendar header
      />
    </div>
  );
};

export default BathSchedule;
