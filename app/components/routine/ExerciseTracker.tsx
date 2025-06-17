// app/components/routine/ExerciseTracker.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  MdOutlineDirectionsRun,
  MdOutlineFitnessCenter,
  MdOutlineSportsHandball,
  MdOutlineSportsSoccer,
  MdOutlineSportsBasketball,
  MdOutlineDirectionsBike,
} from 'react-icons/md';
import { AppState, RoutineType, ScheduledRoutineBase } from '@/types';
import { firebaseService } from '@/services/firebaseService';
import { User } from 'firebase/auth';

// Import the reusable components
import RoutineSectionCard from '@/components/routine/RoutineSectionCard';
import RoutineCalendar from '@/components/routine/RoutineCalendar';

interface ExerciseTrackerProps {
  currentUser: User | null;
  appState: AppState | null;
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
  onAppStateUpdate: (newAppState: AppState) => void;
}

const IconComponents: { [key: string]: React.ElementType } = {
  MdOutlineDirectionsRun,
  MdOutlineFitnessCenter,
  MdOutlineSportsHandball,
  MdOutlineSportsSoccer,
  MdOutlineSportsBasketball,
  MdOutlineDirectionsBike,
};

const exerciseIcons: string[] = [
  'MdOutlineDirectionsRun',
  'MdOutlineFitnessCenter',
  'MdOutlineSportsHandball',
  'MdOutlineSportsSoccer',
  'MdOutlineSportsBasketball',
  'MdOutlineDirectionsBike',
];

const ExerciseTracker: React.FC<ExerciseTrackerProps> = ({
  currentUser,
  appState,
  showMessage,
  onAppStateUpdate,
}) => {
  const [schedules, setSchedules] = useState<ScheduledRoutineBase[]>(
    appState?.routineSettings?.exercise || []
  );

  useEffect(() => {
    setSchedules(appState?.routineSettings?.exercise || []);
  }, [appState]);

  const toggleExerciseCompletion = useCallback(
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
        await firebaseService.updateExerciseRoutineSchedules(currentUser.uid, updatedSchedules);
        const newAppState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(newAppState);
        showMessage('Exercise schedule updated!', 'success');
      } catch {
        showMessage('Failed to save exercise settings.', 'error');
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
        await firebaseService.updateExerciseRoutineSchedules(currentUser.uid, updatedSchedules);
        showMessage(index !== null ? 'Workout updated!' : 'Workout added!', 'success');
        const newAppState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(newAppState);
      } catch {
        showMessage('Failed to save workout schedule.', 'error');
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
        await firebaseService.updateExerciseRoutineSchedules(currentUser.uid, updatedSchedules);
        showMessage('Workout schedule removed.', 'info');
        const newAppState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(newAppState);
      } catch {
        showMessage('Failed to remove workout schedule.', 'error');
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
        appState={appState}
        currentUser={currentUser}
        showMessage={showMessage}
        onAppStateUpdate={onAppStateUpdate}
        routineType={RoutineType.EXERCISE}
        title="Exercise Log"
        icon={MdOutlineDirectionsRun}
      />
    </div>
  );
};

export default ExerciseTracker;
