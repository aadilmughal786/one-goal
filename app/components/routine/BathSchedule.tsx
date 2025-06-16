// app/components/routine/BathSchedule.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MdOutlineShower, MdOutlineHotTub, MdOutlinePool, MdOutlineWash } from 'react-icons/md';
import { format } from 'date-fns';
import { AppState, ScheduledRoutineBase } from '@/types';
import { firebaseService } from '@/services/firebaseService';
import { User } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';

// Import the reusable RoutineSectionCard
import RoutineSectionCard from '@/components/routine/RoutineSectionCard';

interface BathScheduleProps {
  currentUser: User | null;
  appState: AppState | null;
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
}

// Define the IconComponents map for BathSchedule
const IconComponents: { [key: string]: React.ElementType } = {
  MdOutlineShower,
  MdOutlineHotTub,
  MdOutlinePool,
  MdOutlineWash,
};

const bathIcons: string[] = [
  'MdOutlineHotTub',
  'MdOutlineShower',
  'MdOutlinePool',
  'MdOutlineWash',
];

const BathSchedule: React.FC<BathScheduleProps> = ({ currentUser, appState, showMessage }) => {
  // `schedules` is guaranteed to be an array or null from AppState, init to empty array if null
  const [schedules, setSchedules] = useState<ScheduledRoutineBase[]>(
    appState?.routineSettings?.bath || []
  );
  const [, setCurrentTime] = useState(new Date()); // Used for getTimeUntilSchedule, kept for dependency

  // States for new bath input fields (passed to RoutineSectionCard)
  const [newBathLabel, setNewBathLabel] = useState('');
  const [newBathScheduledTime, setNewBathScheduledTime] = useState(format(new Date(), 'HH:mm'));
  const [newBathDurationMinutes, setNewBathDurationMinutes] = useState(15);
  const [newBathIcon, setNewBathIcon] = useState(bathIcons[0]);

  // Effect to update current time every second (dependency for getTimeUntilSchedule)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync local state with appState from Firebase
  useEffect(() => {
    // `appState.routineSettings.bath` is guaranteed to be an array or null
    setSchedules(appState?.routineSettings?.bath || []);
  }, [appState]);

  const toggleBathCompletion = useCallback(
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
        // Use the dedicated update function for bath schedules
        await firebaseService.updateBathRoutineSchedules(currentUser.uid, updatedSchedules);
        showMessage('Bath schedule updated!', 'success');
      } catch (error: unknown) {
        console.error('Failed to save bath settings:', error);
        showMessage('Failed to save bath settings.', 'error');
      }
    },
    [currentUser, schedules, showMessage]
  );

  const addBathSchedule = useCallback(async () => {
    const bathDuration = parseInt(String(newBathDurationMinutes));
    if (!newBathLabel.trim() || !newBathScheduledTime || isNaN(bathDuration) || bathDuration < 5) {
      showMessage('Please provide a valid label, time, and duration (min 5 min).', 'error');
      return;
    }
    if (!currentUser) {
      showMessage('You must be logged in to add schedules.', 'error');
      return;
    }

    const newSchedule: ScheduledRoutineBase = {
      scheduledTime: newBathScheduledTime,
      durationMinutes: bathDuration,
      label: newBathLabel.trim(),
      icon: newBathIcon,
      completed: null, // New schedule starts as not completed (null)
      updatedAt: Timestamp.now(),
    };

    const updatedSchedules = [...schedules, newSchedule];
    setSchedules(updatedSchedules); // Update local state immediately

    try {
      // Use the dedicated update function for bath schedules
      await firebaseService.updateBathRoutineSchedules(currentUser.uid, updatedSchedules);
      showMessage('Bath schedule added!', 'success');
      // Reset form fields
      setNewBathLabel('');
      setNewBathScheduledTime(format(new Date(), 'HH:mm'));
      setNewBathDurationMinutes(15);
      setNewBathIcon(bathIcons[0]); // Reset to first icon
    } catch (error: unknown) {
      console.error('Failed to add bath schedule:', error);
      showMessage('Failed to add bath schedule.', 'error');
    }
  }, [
    currentUser,
    schedules,
    newBathLabel,
    newBathScheduledTime,
    newBathDurationMinutes,
    newBathIcon,
    showMessage,
  ]);

  const removeBathSchedule = useCallback(
    async (indexToRemove: number) => {
      if (!currentUser) {
        showMessage('You must be logged in to remove schedules.', 'error');
        return;
      }
      const updatedSchedules = schedules.filter((_, index) => index !== indexToRemove);
      setSchedules(updatedSchedules); // Update local state immediately

      try {
        // Use the dedicated update function for bath schedules
        await firebaseService.updateBathRoutineSchedules(currentUser.uid, updatedSchedules);
        showMessage('Bath schedule removed!', 'info');
      } catch (error: unknown) {
        console.error('Failed to remove bath schedule:', error);
        showMessage('Failed to remove bath schedule.', 'error');
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
      sectionTitle="Bath Routine"
      summaryCount={`${completedSchedulesCount}/${schedules.length}`}
      summaryLabel="Baths Completed Today"
      progressPercentage={
        schedules.length > 0 ? (completedSchedulesCount / schedules.length) * 100 : 0
      }
      listTitle="Your Bath Schedules"
      listEmptyMessage="No bath times scheduled. Add one below!"
      schedules={schedules}
      onToggleCompletion={toggleBathCompletion}
      onRemoveSchedule={removeBathSchedule}
      // Removed getTimeUntilSchedule prop as it's now internal to RoutineSectionCard
      newInputLabelPlaceholder="Bath Label"
      newInputValue={newBathLabel}
      onNewInputChange={setNewBathLabel}
      newTimeValue={newBathScheduledTime}
      onNewTimeChange={setNewBathScheduledTime}
      newDurationPlaceholder="Duration (min)"
      newDurationValue={newBathDurationMinutes === 0 ? '' : String(newBathDurationMinutes)}
      onNewDurationChange={value => {
        const val = parseInt(value);
        setNewBathDurationMinutes(isNaN(val) ? 0 : val);
      }}
      onNewDurationWheel={handleWheel}
      newCurrentIcon={newBathIcon}
      newIconOptions={bathIcons}
      onNewSelectIcon={setNewBathIcon}
      iconComponentsMap={IconComponents}
      buttonLabel="Add & Save Bath Schedule"
      onAddSchedule={addBathSchedule}
    />
  );
};

export default BathSchedule;
