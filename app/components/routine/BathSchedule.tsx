// app/components/routine/BathSchedule.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MdOutlineShower, MdOutlineHotTub, MdOutlinePool, MdOutlineWash } from 'react-icons/md';
import { AppState, RoutineType, ScheduledRoutineBase } from '@/types';
import { firebaseService } from '@/services/firebaseService';
import { User } from 'firebase/auth';

// Import the reusable components
import RoutineSectionCard from '@/components/routine/RoutineSectionCard';
import RoutineCalendar from '@/components/routine/RoutineCalendar';

interface BathScheduleProps {
  currentUser: User | null;
  appState: AppState | null;
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
  onAppStateUpdate: (newAppState: AppState) => void;
}

const IconComponents: { [key: string]: React.ElementType } = {
  MdOutlineShower,
  MdOutlineHotTub,
  MdOutlinePool,
  MdOutlineWash,
};

const bathIcons: string[] = [
  'MdOutlineShower',
  'MdOutlineHotTub',
  'MdOutlinePool',
  'MdOutlineWash',
];

const BathSchedule: React.FC<BathScheduleProps> = ({
  currentUser,
  appState,
  showMessage,
  onAppStateUpdate,
}) => {
  const [schedules, setSchedules] = useState<ScheduledRoutineBase[]>(
    appState?.routineSettings?.bath || []
  );

  useEffect(() => {
    setSchedules(appState?.routineSettings?.bath || []);
  }, [appState]);

  const toggleBathCompletion = useCallback(
    async (index: number) => {
      if (!currentUser) {
        showMessage('You must be logged in to update schedules.', 'error');
        return;
      }
      const updatedSchedules = schedules.map((schedule, i) =>
        i === index ? { ...schedule, completed: !schedule.completed } : schedule
      );
      setSchedules(updatedSchedules);

      try {
        await firebaseService.updateBathRoutineSchedules(currentUser.uid, updatedSchedules);
        const newAppState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(newAppState);
        showMessage('Bath schedule updated!', 'success');
      } catch {
        showMessage('Failed to save bath settings.', 'error');
        const oldState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(oldState);
      }
    },
    [currentUser, schedules, showMessage, onAppStateUpdate]
  );

  const handleSaveSchedule = useCallback(
    async (schedule: ScheduledRoutineBase, index: number | null) => {
      if (!currentUser) return;
      const updatedSchedules =
        index !== null
          ? schedules.map((s, i) => (i === index ? schedule : s))
          : [...schedules, schedule];
      setSchedules(updatedSchedules);

      try {
        await firebaseService.updateBathRoutineSchedules(currentUser.uid, updatedSchedules);
        showMessage(index !== null ? 'Bath time updated!' : 'Bath time added!', 'success');
        const newAppState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(newAppState);
      } catch {
        showMessage('Failed to save bath schedule.', 'error');
        const oldState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(oldState);
      }
    },
    [currentUser, schedules, showMessage, onAppStateUpdate]
  );

  const handleRemoveSchedule = useCallback(
    async (indexToRemove: number) => {
      if (!currentUser) return;
      const updatedSchedules = schedules.filter((_, index) => index !== indexToRemove);
      setSchedules(updatedSchedules);

      try {
        await firebaseService.updateBathRoutineSchedules(currentUser.uid, updatedSchedules);
        showMessage('Bath schedule removed.', 'info');
        const newAppState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(newAppState);
      } catch {
        showMessage('Failed to remove bath schedule.', 'error');
        const oldState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(oldState);
      }
    },
    [currentUser, schedules, showMessage, onAppStateUpdate]
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
        appState={appState}
        currentUser={currentUser}
        showMessage={showMessage}
        onAppStateUpdate={onAppStateUpdate}
        routineType={RoutineType.BATH}
        title="Bath & Hygiene Log"
        icon={MdOutlineShower}
      />
    </div>
  );
};

export default BathSchedule;
