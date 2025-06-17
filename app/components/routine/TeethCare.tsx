// app/components/routine/TeethCare.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  MdOutlineCleaningServices,
  MdOutlineHealthAndSafety,
  MdOutlineSentimentSatisfied,
} from 'react-icons/md';
import { FaTeeth, FaTooth } from 'react-icons/fa6';
import { PiToothFill } from 'react-icons/pi';
import { AppState, RoutineType, ScheduledRoutineBase } from '@/types';
import { firebaseService } from '@/services/firebaseService';
import { User } from 'firebase/auth';

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

// Define the IconComponents map for TeethCare
const IconComponents: { [key: string]: React.ElementType } = {
  MdOutlineSentimentSatisfied,
  MdOutlineCleaningServices,
  MdOutlineHealthAndSafety,
  FaTeeth,
  FaTooth,
  PiToothFill,
};

const teethIcons: string[] = [
  'MdOutlineCleaningServices',
  'MdOutlineHealthAndSafety',
  'MdOutlineSentimentSatisfied',
  'FaTeeth',
  'FaTooth',
  'PiToothFill',
];

const TeethCare: React.FC<TeethCareProps> = ({
  currentUser,
  appState,
  showMessage,
  onAppStateUpdate, // Destructure the new prop
}) => {
  // Local state for the list of schedules, synced from appState
  const [sessions, setSessions] = useState<ScheduledRoutineBase[]>(
    appState?.routineSettings?.teeth || []
  );

  // Effect to keep local state in sync with the main appState prop
  useEffect(() => {
    setSessions(appState?.routineSettings?.teeth || []);
  }, [appState]);

  // Callback to handle toggling the completion status of a session in the card view
  const toggleTeethCompletion = useCallback(
    async (index: number) => {
      if (!currentUser) {
        showMessage('You must be logged in to update schedules.', 'error');
        return;
      }
      const updatedSessions = sessions.map((session, i) =>
        i === index ? { ...session, completed: !session.completed } : session
      );
      setSessions(updatedSessions); // Optimistic UI update for the card

      try {
        await firebaseService.updateTeethRoutineSchedules(currentUser.uid, updatedSessions);
        // Refetch the entire app state to ensure UI consistency everywhere
        const newAppState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(newAppState);
        showMessage('Dental care schedule updated!', 'success');
      } catch {
        showMessage('Failed to save dental care settings.', 'error');
        // Optional: Revert UI on error by refetching old state
        const oldState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(oldState);
      }
    },
    [currentUser, sessions, showMessage, onAppStateUpdate]
  );

  // Callback to handle adding a new schedule or saving an edited one
  const handleSaveSchedule = useCallback(
    async (schedule: ScheduledRoutineBase, index: number | null) => {
      if (!currentUser) return;
      let updatedSchedules: ScheduledRoutineBase[];
      if (index !== null) {
        updatedSchedules = sessions.map((s, i) => (i === index ? schedule : s));
      } else {
        updatedSchedules = [...sessions, schedule];
      }
      setSessions(updatedSchedules); // Optimistic update

      try {
        await firebaseService.updateTeethRoutineSchedules(currentUser.uid, updatedSchedules);
        showMessage(index !== null ? 'Schedule updated!' : 'Schedule added!', 'success');
        const newAppState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(newAppState);
      } catch {
        showMessage('Failed to save schedule.', 'error');
        const oldState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(oldState);
      }
    },
    [currentUser, sessions, showMessage, onAppStateUpdate]
  );

  // Callback to handle removing a schedule from the list
  const handleRemoveSchedule = useCallback(
    async (indexToRemove: number) => {
      if (!currentUser) return;
      const updatedSchedules = sessions.filter((_, index) => index !== indexToRemove);
      setSessions(updatedSchedules); // Optimistic update

      try {
        await firebaseService.updateTeethRoutineSchedules(currentUser.uid, updatedSchedules);
        showMessage('Schedule removed.', 'info');
        const newAppState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(newAppState);
      } catch {
        showMessage('Failed to remove schedule.', 'error');
        const oldState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(oldState);
      }
    },
    [currentUser, sessions, showMessage, onAppStateUpdate]
  );

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
        routineType={RoutineType.TEETH}
        title="Dental Care Log"
        icon={MdOutlineCleaningServices}
      />
    </div>
  );
};

export default TeethCare;
