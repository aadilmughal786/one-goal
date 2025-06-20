// app/components/routine/TeethCare.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  MdOutlineCleaningServices,
  MdOutlineHealthAndSafety,
  MdOutlineSentimentSatisfied,
} from 'react-icons/md';
import { FaTeeth, FaTooth } from 'react-icons/fa6'; // Correct import for fa6 icons
import { PiToothFill } from 'react-icons/pi';
import { AppState, RoutineType, ScheduledRoutineBase } from '@/types';
import { firebaseService } from '@/services/firebaseService';
import { User } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore'; // Import Timestamp for setting dates

// Import the reusable components
import RoutineSectionCard from '@/components/routine/RoutineSectionCard';
import RoutineCalendar from '@/components/routine/RoutineCalendar'; // Import the calendar

interface TeethCareProps {
  currentUser: User | null;
  appState: AppState | null;
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
  // This prop is now required to update the parent's state when the calendar logs an event
  onAppStateUpdate: (newAppState: AppState) => void;
}

// Helper for generating UUIDs for new item IDs
const generateUUID = () => crypto.randomUUID();

// Define the IconComponents map for TeethCare
const IconComponents: { [key: string]: React.ElementType } = {
  MdOutlineSentimentSatisfied,
  MdOutlineCleaningServices,
  MdOutlineHealthAndSafety,
  FaTeeth, // Ensure this is correctly mapped to the imported component
  FaTooth, // Ensure this is correctly mapped to the imported component
  PiToothFill,
};

// Array of icon names (strings) to be passed as options for teeth care schedules
const teethIcons: string[] = [
  'MdOutlineCleaningServices',
  'MdOutlineHealthAndSafety',
  'MdOutlineSentimentSatisfied',
  'FaTeeth',
  'FaTooth',
  'PiToothFill',
];

/**
 * TeethCare Component
 *
 * Manages the display and functionality for user's dental care routines.
 * It integrates with Firebase to store and retrieve scheduled routines and their completion status.
 *
 * Uses:
 * - RoutineSectionCard to display the list of scheduled dental care times and their progress.
 * - RoutineCalendar to provide a calendar view for logging daily dental care routine completion.
 */
const TeethCare: React.FC<TeethCareProps> = ({
  currentUser,
  appState,
  showMessage,
  onAppStateUpdate,
}) => {
  // Derive the active goal ID from the appState
  const activeGoalId = appState?.activeGoalId;

  // Local state for the list of schedules, synced from appState.
  // Initializes from the active goal's routine settings or an empty array.
  const [sessions, setSessions] = useState<ScheduledRoutineBase[]>(
    appState?.goals[activeGoalId || '']?.routineSettings?.teeth || []
  );

  // Effect to keep local state in sync with the main appState prop.
  // Ensures component re-renders with the latest data from Firebase.
  useEffect(() => {
    if (activeGoalId && appState?.goals[activeGoalId]?.routineSettings) {
      setSessions(appState.goals[activeGoalId].routineSettings.teeth || []);
    } else {
      setSessions([]); // Clear sessions if no active goal or settings
    }
  }, [appState, activeGoalId]); // Dependencies: re-run if appState or activeGoalId changes

  /**
   * Callback to handle toggling the completion status of a dental care session.
   * Updates the local state optimistically and then persists the change to Firebase.
   * @param index The index of the session in the current `sessions` array to toggle.
   */
  const toggleTeethCompletion = useCallback(
    async (index: number) => {
      if (!currentUser || !activeGoalId) {
        showMessage('You must be logged in and have an active goal to update schedules.', 'error');
        return;
      }

      // Create a new array with the toggled session's completion status and updated timestamp
      const updatedSessions = sessions.map((session, i) =>
        i === index
          ? {
              ...session,
              completed: !session.completed,
              updatedAt: Timestamp.now(), // Update timestamp on modification
              completedAt: !session.completed ? Timestamp.now() : null, // Set/clear completedAt
            }
          : session
      );

      // Optimistic UI update for the card
      setSessions(updatedSessions);

      try {
        // Persist the updated schedules to Firebase for the active goal
        await firebaseService.updateTeethRoutineSchedules(
          activeGoalId,
          currentUser.uid,
          updatedSessions
        );
        // Re-fetch the entire app state to ensure UI consistency everywhere
        const newAppState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(newAppState);
        showMessage('Dental care schedule updated!', 'success');
      } catch (error) {
        console.error('Failed to save dental care settings:', error);
        showMessage('Failed to save dental care settings.', 'error');
        // Revert UI on error by re-fetching old state from Firebase
        const oldState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(oldState);
      }
    },
    [currentUser, activeGoalId, sessions, showMessage, onAppStateUpdate]
  );

  /**
   * Callback to handle adding a new schedule or saving an edited one.
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
      const now = Timestamp.now(); // Current timestamp for new/update operations

      if (index !== null) {
        // If index is provided, it's an update operation
        updatedSchedules = sessions.map(
          (s, i) => (i === index ? { ...schedule, updatedAt: now } : s) // Update timestamp on existing item
        );
        messageType = 'updated';
      } else {
        // If no index, it's a new schedule
        // Ensure all required fields for ScheduledRoutineBase are present for new additions
        updatedSchedules = [
          ...sessions,
          {
            ...schedule,
            id: generateUUID(), // Generate unique ID
            createdAt: now, // Set creation timestamp
            updatedAt: now, // Set update timestamp
            completed: false, // New routines start as not completed
            completedAt: null, // No completion time for new routines
          },
        ];
        messageType = 'added';
      }

      // Optimistic UI update
      setSessions(updatedSchedules);

      try {
        // Persist the updated schedules to Firebase for the active goal
        await firebaseService.updateTeethRoutineSchedules(
          activeGoalId,
          currentUser.uid,
          updatedSchedules
        );
        showMessage(messageType === 'updated' ? 'Schedule updated!' : 'Schedule added!', 'success');
        // Re-fetch full app state to ensure data consistency
        const newAppState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(newAppState);
      } catch (error) {
        console.error('Failed to save schedule:', error);
        showMessage('Failed to save schedule.', 'error');
        // Revert UI on error by re-fetching old state
        const oldState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(oldState);
      }
    },
    [currentUser, activeGoalId, sessions, showMessage, onAppStateUpdate]
  );

  /**
   * Callback to handle removing a schedule from the list.
   * Updates the local state optimistically and then persists the change to Firebase.
   * @param indexToRemove The index of the schedule to remove.
   */
  const handleRemoveSchedule = useCallback(
    async (indexToRemove: number) => {
      if (!currentUser || !activeGoalId) {
        showMessage('You must be logged in and have an active goal to remove schedules.', 'error');
        return;
      }

      // Filter out the schedule to be removed
      const updatedSchedules = sessions.filter((_, index) => index !== indexToRemove);
      // Optimistic UI update
      setSessions(updatedSchedules);

      try {
        // Persist the updated schedules to Firebase for the active goal
        await firebaseService.updateTeethRoutineSchedules(
          activeGoalId,
          currentUser.uid,
          updatedSchedules
        );
        showMessage('Schedule removed.', 'info');
        // Re-fetch full app state to ensure data consistency
        const newAppState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(newAppState);
      } catch (error) {
        console.error('Failed to remove schedule:', error);
        showMessage('Failed to remove schedule.', 'error');
        // Revert UI on error by re-fetching old state
        const oldState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(oldState);
      }
    },
    [currentUser, activeGoalId, sessions, showMessage, onAppStateUpdate]
  );

  // Calculate the number of completed schedules for the summary card
  const completedSchedulesCount = sessions.filter(s => s.completed).length;

  return (
    <div className="space-y-8">
      {/* The existing card for managing today's dental care schedules */}
      <RoutineSectionCard
        sectionTitle="Dental Care Routine"
        summaryCount={`${completedSchedulesCount}/${sessions.length}`}
        summaryLabel="Sessions Completed Today"
        progressPercentage={
          sessions.length > 0 ? (completedSchedulesCount / sessions.length) * 100 : 0
        }
        listTitle="Your Dental Care Sessions"
        listEmptyMessage="No sessions scheduled. Add one below!"
        schedules={sessions}
        onToggleCompletion={toggleTeethCompletion}
        onRemoveSchedule={handleRemoveSchedule}
        onSaveSchedule={handleSaveSchedule}
        showMessage={showMessage}
        newInputLabelPlaceholder="e.g., Morning Brush"
        newIconOptions={teethIcons}
        iconComponentsMap={IconComponents}
      />

      {/* The new calendar for tracking historical dental care completion */}
      <RoutineCalendar
        appState={appState}
        currentUser={currentUser}
        showMessage={showMessage}
        onAppStateUpdate={onAppStateUpdate}
        routineType={RoutineType.TEETH} // Specify the routine type for the calendar
        title="Dental Care Log"
        icon={MdOutlineCleaningServices} // Default icon for the calendar header
      />
    </div>
  );
};

export default TeethCare;
