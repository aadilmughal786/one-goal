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
import { format } from 'date-fns';
import { AppState, ScheduledRoutineBase } from '@/types';
import { firebaseService } from '@/services/firebaseService';
import { User } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';

// Import the reusable RoutineSectionCard
import RoutineSectionCard from '@/components/routine/RoutineSectionCard';

interface ExerciseTrackerProps {
  currentUser: User | null;
  appState: AppState | null;
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
}

// Define the IconComponents map for ExerciseTracker
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
}) => {
  // `schedules` is guaranteed to be an array or null from AppState, init to empty array if null
  const [schedules, setSchedules] = useState<ScheduledRoutineBase[]>(
    appState?.routineSettings?.exercise || []
  );

  // States for new exercise input fields (passed to RoutineSectionCard)
  const [newExerciseLabel, setNewExerciseLabel] = useState('');
  const [newExerciseScheduledTime, setNewExerciseScheduledTime] = useState(
    format(new Date(), 'HH:mm')
  );
  const [newExerciseDurationMinutes, setNewExerciseDurationMinutes] = useState(30);
  const [newExerciseIcon, setNewExerciseIcon] = useState(exerciseIcons[0]);

  // Sync local state with appState from Firebase
  useEffect(() => {
    // `appState.routineSettings.exercise` is guaranteed to be an array or null
    setSchedules(appState?.routineSettings?.exercise || []);
  }, [appState]);

  const toggleExerciseCompletion = useCallback(
    async (index: number) => {
      if (!currentUser) {
        showMessage('You must be logged in to update schedules.', 'error');
        return;
      }
      // Create a new array to ensure immutability before updating Firestore
      const updatedSchedules = schedules.map((schedule, i) => {
        if (i === index) {
          return { ...schedule, completed: !schedule.completed, updatedAt: Timestamp.now() };
        }
        return schedule;
      });
      setSchedules(updatedSchedules); // Update local state immediately

      try {
        // Use the dedicated update function for exercise schedules
        await firebaseService.updateExerciseRoutineSchedules(currentUser.uid, updatedSchedules);
        showMessage('Exercise schedule updated!', 'success');
      } catch (error: unknown) {
        console.error('Failed to save exercise settings:', error);
        showMessage('Failed to save exercise settings.', 'error');
      }
    },
    [currentUser, schedules, showMessage]
  );

  const addExerciseSchedule = useCallback(async () => {
    const sessionDuration = parseInt(String(newExerciseDurationMinutes));
    if (
      !newExerciseLabel.trim() ||
      !newExerciseScheduledTime ||
      isNaN(sessionDuration) ||
      sessionDuration < 1
    ) {
      // Min 1 minute
      showMessage('Please provide a valid label, time, and duration (min 1 min).', 'error');
      return;
    }
    if (!currentUser) {
      showMessage('You must be logged in to add schedules.', 'error');
      return;
    }

    const newSchedule: ScheduledRoutineBase = {
      scheduledTime: newExerciseScheduledTime,
      durationMinutes: sessionDuration,
      label: newExerciseLabel.trim(),
      icon: newExerciseIcon,
      completed: null, // New schedule starts as not completed (null)
      updatedAt: Timestamp.now(),
    };

    const updatedSchedules = [...schedules, newSchedule];
    setSchedules(updatedSchedules); // Update local state immediately

    try {
      // Use the dedicated update function for exercise schedules
      await firebaseService.updateExerciseRoutineSchedules(currentUser.uid, updatedSchedules);
      showMessage('Exercise schedule added!', 'success');
      // Reset form fields
      setNewExerciseLabel('');
      setNewExerciseScheduledTime(format(new Date(), 'HH:mm'));
      setNewExerciseDurationMinutes(30);
      setNewExerciseIcon(exerciseIcons[0]); // Reset to first icon
    } catch (error: unknown) {
      console.error('Failed to add exercise schedule:', error);
      showMessage('Failed to add exercise schedule.', 'error');
    }
  }, [
    currentUser,
    schedules,
    newExerciseLabel,
    newExerciseScheduledTime,
    newExerciseDurationMinutes,
    newExerciseIcon,
    showMessage,
  ]);

  const removeExerciseSchedule = useCallback(
    async (indexToRemove: number) => {
      if (!currentUser) {
        showMessage('You must be logged in to remove schedules.', 'error');
        return;
      }
      const updatedSchedules = schedules.filter((_, index) => index !== indexToRemove);
      setSchedules(updatedSchedules); // Update local state immediately

      try {
        // Use the dedicated update function for exercise schedules
        await firebaseService.updateExerciseRoutineSchedules(currentUser.uid, updatedSchedules);
        showMessage('Exercise schedule removed!', 'info');
      } catch (error: unknown) {
        console.error('Failed to remove exercise schedule:', error);
        showMessage('Failed to remove exercise schedule.', 'error');
      }
    },
    [currentUser, schedules, showMessage]
  );

  const completedSchedulesCount = schedules.filter(s => s.completed).length;

  // Prevent scroll for number inputs
  const handleWheel = useCallback((e: React.WheelEvent<HTMLInputElement>) => {
    if (e.currentTarget instanceof HTMLInputElement) {
      e.currentTarget.blur();
    }
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <RoutineSectionCard
      sectionTitle="Exercise Routine"
      summaryCount={`${completedSchedulesCount}/${schedules.length}`}
      summaryLabel="Sessions Completed Today"
      progressPercentage={
        schedules.length > 0 ? (completedSchedulesCount / schedules.length) * 100 : 0
      }
      listTitle="Your Exercise Schedules"
      listEmptyMessage="No exercise times scheduled. Add one below!"
      schedules={schedules}
      onToggleCompletion={toggleExerciseCompletion}
      onRemoveSchedule={removeExerciseSchedule}
      // Removed getTimeUntilSchedule prop as it's now internal to RoutineSectionCard
      newInputLabelPlaceholder="Workout Label"
      newInputValue={newExerciseLabel}
      onNewInputChange={setNewExerciseLabel}
      newTimeValue={newExerciseScheduledTime}
      onNewTimeChange={setNewExerciseScheduledTime}
      newDurationPlaceholder="Duration (min)"
      newDurationValue={newExerciseDurationMinutes === 0 ? '' : String(newExerciseDurationMinutes)}
      onNewDurationChange={value => {
        const val = parseInt(value);
        setNewExerciseDurationMinutes(isNaN(val) ? 0 : val);
      }}
      onNewDurationWheel={handleWheel}
      newCurrentIcon={newExerciseIcon}
      newIconOptions={exerciseIcons}
      onNewSelectIcon={setNewExerciseIcon}
      iconComponentsMap={IconComponents} // Pass the IconComponents map
      buttonLabel="Add & Save Workout"
      onAddSchedule={addExerciseSchedule}
    />
  );
};

export default ExerciseTracker;
