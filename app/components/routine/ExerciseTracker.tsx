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

// Import the reusable RoutineSectionCard and IconOption
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
  const [schedules, setSchedules] = useState<ScheduledRoutineBase[]>([]);

  // States for new exercise input fields (passed to RoutineSectionCard)
  const [newExerciseLabel, setNewExerciseLabel] = useState('');
  const [newExerciseScheduledTime, setNewExerciseScheduledTime] = useState(
    format(new Date(), 'HH:mm')
  );
  const [newExerciseDurationMinutes, setNewExerciseDurationMinutes] = useState(30);
  const [newExerciseIcon, setNewExerciseIcon] = useState(exerciseIcons[0]);

  // Sync local state with appState from Firebase
  useEffect(() => {
    if (appState?.routineSettings?.exercise) {
      setSchedules(appState.routineSettings.exercise);
    } else {
      setSchedules([]);
    }
  }, [appState]);

  // Helper to calculate time until a scheduled event
  const getTimeUntilSchedule = useCallback(
    (
      scheduledTime: string
    ): {
      hours: number;
      minutes: number;
      total: number;
      isPast: boolean;
      shouldStart?: boolean;
    } => {
      const now = new Date();
      const [targetH, targetM] = scheduledTime.split(':').map(Number);
      const targetDate = new Date();
      targetDate.setHours(targetH, targetM, 0, 0);

      let isPastToday = false;
      if (targetDate <= now) {
        isPastToday = true;
        targetDate.setDate(targetDate.getDate() + 1); // Set for next day if already passed
      }

      const diff = targetDate.getTime() - now.getTime();
      const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
      const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      // Logic for 'shouldStart' (within 5 minutes)
      const shouldStart = diff <= 5 * 60 * 1000 && diff > 0;

      return {
        hours: hoursLeft,
        minutes: minutesLeft,
        total: diff,
        isPast: isPastToday,
        shouldStart: shouldStart,
      };
    },
    []
  );

  const saveExerciseSettings = useCallback(async () => {
    if (!currentUser) {
      showMessage('You must be logged in to save settings.', 'error');
      return;
    }
    try {
      await firebaseService.updateSpecificRoutineSetting(currentUser.uid, 'exercise', schedules);
    } catch (error: unknown) {
      console.error('Failed to save exercise settings:', error);
      showMessage('Failed to save exercise settings.', 'error');
    }
  }, [currentUser, schedules, showMessage]);

  const toggleExerciseCompletion = useCallback(
    (index: number) => {
      setSchedules(prevSchedules => {
        const newSchedules = [...prevSchedules];
        const scheduleToUpdate = { ...newSchedules[index] };
        scheduleToUpdate.completed = !scheduleToUpdate.completed;
        scheduleToUpdate.updatedAt = Timestamp.now();
        newSchedules[index] = scheduleToUpdate;
        return newSchedules;
      });
      setTimeout(saveExerciseSettings, 0); // Save after state update
    },
    [saveExerciseSettings]
  );

  const addExerciseSchedule = useCallback(() => {
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

    const newSchedule: ScheduledRoutineBase = {
      scheduledTime: newExerciseScheduledTime,
      durationMinutes: sessionDuration,
      label: newExerciseLabel.trim(),
      icon: newExerciseIcon,
      completed: false,
      updatedAt: Timestamp.now(),
    };

    const updatedSchedules = [...schedules, newSchedule];
    setSchedules(updatedSchedules);
    setNewExerciseLabel('');
    setNewExerciseScheduledTime(format(new Date(), 'HH:mm'));
    setNewExerciseDurationMinutes(30);
    setNewExerciseIcon('MdOutlineFlashOn');
    saveExerciseSettings(); // Save updated schedule list
  }, [
    schedules,
    newExerciseLabel,
    newExerciseScheduledTime,
    newExerciseDurationMinutes,
    newExerciseIcon,
    saveExerciseSettings,
    showMessage,
  ]);

  const removeExerciseSchedule = useCallback(
    (indexToRemove: number) => {
      const updatedSchedules = schedules.filter((_, index) => index !== indexToRemove);
      setSchedules(updatedSchedules);

      saveExerciseSettings(); // Save updated schedule list
    },
    [schedules, saveExerciseSettings]
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
      getTimeUntilSchedule={getTimeUntilSchedule}
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
