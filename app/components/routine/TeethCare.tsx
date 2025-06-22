// app/components/routine/TeethCare.tsx
'use client';

import { AppState, RoutineType, ScheduledRoutineBase } from '@/types';
import { User } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { FaTeeth, FaTooth } from 'react-icons/fa6';
import {
  MdOutlineCleaningServices,
  MdOutlineHealthAndSafety,
  MdOutlineSentimentSatisfied,
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

interface TeethCareProps {
  currentUser: User | null;
  appState: AppState | null;
  // REMOVED: showMessage is now handled internally via useNotificationStore, so it's removed from props
  onAppStateUpdate: (newAppState: AppState) => void;
}

const IconComponents: { [key: string]: React.ElementType } = {
  MdOutlineSentimentSatisfied,
  MdOutlineCleaningServices,
  MdOutlineHealthAndSafety,
  FaTeeth,
  FaTooth,
};

const teethIcons: string[] = Object.keys(IconComponents);

/**
 * TeethCare Component
 *
 * Manages the user's dental care routines.
 * This component has been refactored to use the new dedicated services.
 */
const TeethCare: React.FC<TeethCareProps> = ({ currentUser, appState, onAppStateUpdate }) => {
  const activeGoalId = appState?.activeGoalId;

  // NEW: Access showToast from the global notification store
  const showToast = useNotificationStore(state => state.showToast);

  const [sessions, setSessions] = useState<ScheduledRoutineBase[]>(
    appState?.goals[activeGoalId || '']?.routineSettings?.teeth || []
  );

  useEffect(() => {
    if (activeGoalId && appState?.goals[activeGoalId]?.routineSettings) {
      setSessions(appState.goals[activeGoalId].routineSettings.teeth || []);
    } else {
      setSessions([]);
    }
  }, [appState, activeGoalId]);

  /**
   * A helper function to construct the new settings object and call the update service.
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
        teeth: updatedSchedules,
      };

      await updateRoutineSettings(currentUser.uid, activeGoalId, newSettings);
      const newAppState = await getUserData(currentUser.uid);
      onAppStateUpdate(newAppState);
    },
    [appState, currentUser, activeGoalId, onAppStateUpdate]
  );

  const toggleTeethCompletion = useCallback(
    async (index: number) => {
      if (!currentUser || !activeGoalId) {
        showToast('You must be logged in and have an active goal to update schedules.', 'error');
        return;
      }
      const updatedSessions = sessions.map((session, i) =>
        i === index
          ? {
              ...session,
              completed: !session.completed,
              updatedAt: Timestamp.now(),
              completedAt: !session.completed ? Timestamp.now() : null,
            }
          : session
      );
      setSessions(updatedSessions); // Optimistic UI update

      try {
        await callUpdateRoutineSettings(updatedSessions);
        showToast('Dental care schedule updated!', 'success'); // Use global showToast
      } catch (error) {
        console.error('Failed to save dental care settings:', error);
        showToast('Failed to save dental care settings.', 'error'); // Use global showToast
        const oldState = await getUserData(currentUser!.uid);
        onAppStateUpdate(oldState);
      }
    },
    [currentUser, activeGoalId, sessions, showToast, callUpdateRoutineSettings, onAppStateUpdate] // Dependency on global showToast
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
        updatedSchedules = sessions.map((s, i) => (i === index ? schedule : s));
      } else {
        updatedSchedules = [...sessions, schedule];
      }
      setSessions(updatedSchedules); // Optimistic update

      try {
        await callUpdateRoutineSettings(updatedSchedules);
        showToast(messageType === 'updated' ? 'Schedule updated!' : 'Schedule added!', 'success'); // Use global showToast
      } catch (error) {
        console.error('Failed to save schedule:', error);
        showToast('Failed to save schedule.', 'error'); // Use global showToast
        const oldState = await getUserData(currentUser!.uid);
        onAppStateUpdate(oldState);
      }
    },
    [currentUser, activeGoalId, sessions, showToast, callUpdateRoutineSettings, onAppStateUpdate] // Dependency on global showToast
  );

  const handleRemoveSchedule = useCallback(
    async (indexToRemove: number) => {
      if (!currentUser || !activeGoalId) {
        showToast('You must be logged in and have an active goal to remove schedules.', 'error');
        return;
      }
      const updatedSchedules = sessions.filter((_, index) => index !== indexToRemove);
      setSessions(updatedSchedules); // Optimistic update

      try {
        await callUpdateRoutineSettings(updatedSchedules);
        showToast('Schedule removed.', 'info'); // Use global showToast
      } catch (error) {
        console.error('Failed to remove schedule:', error);
        showToast('Failed to remove schedule.', 'error'); // Use global showToast
        const oldState = await getUserData(currentUser!.uid);
        onAppStateUpdate(oldState);
      }
    },
    [currentUser, activeGoalId, sessions, showToast, callUpdateRoutineSettings, onAppStateUpdate] // Dependency on global showToast
  );

  const completedSchedulesCount = sessions.filter(s => s.completed).length;

  return (
    <div className="space-y-8">
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
        // REMOVED: showToast prop is no longer needed, RoutineSectionCard gets it directly
        newInputLabelPlaceholder="e.g., Morning Brush"
        newIconOptions={teethIcons}
        iconComponentsMap={IconComponents}
      />

      <RoutineCalendar
        appState={appState}
        currentUser={currentUser}
        onAppStateUpdate={onAppStateUpdate}
        routineType={RoutineType.TEETH}
        title="Dental Care Log"
        icon={MdOutlineCleaningServices}
      />
    </div>
  );
};

export default TeethCare;
