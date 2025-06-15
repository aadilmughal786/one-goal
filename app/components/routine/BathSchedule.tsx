// app/components/routine/BathSchedule.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MdOutlineShower, MdOutlineHotTub, MdOutlinePool, MdOutlineWash } from 'react-icons/md';
import { format } from 'date-fns';
import { AppState, ScheduledRoutineBase } from '@/types';
import { firebaseService } from '@/services/firebaseService';
import { User } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';

// Import the reusable RoutineSectionCard and IconOption
import RoutineSectionCard from '@/components/routine/RoutineSectionCard';

interface BathScheduleProps {
  currentUser: User | null;
  appState: AppState | null;
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
}

// Define the IconComponents map for BathSchedule
const IconComponents: { [key: string]: React.ElementType } = {
  // Specific icons for Bathing
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
  const [schedules, setSchedules] = useState<ScheduledRoutineBase[]>([]);
  const [, setCurrentTime] = useState(new Date());

  // States for new bath input fields (passed to RoutineSectionCard)
  const [newBathLabel, setNewBathLabel] = useState('');
  const [newBathScheduledTime, setNewBathScheduledTime] = useState(format(new Date(), 'HH:mm'));
  const [newBathDurationMinutes, setNewBathDurationMinutes] = useState(15);
  const [newBathIcon, setNewBathIcon] = useState(bathIcons[0]);

  // Effect to update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync local state with appState from Firebase
  useEffect(() => {
    if (appState?.routineSettings?.bath) {
      setSchedules(appState.routineSettings.bath);
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

  const saveBathSettings = useCallback(async () => {
    if (!currentUser) {
      showMessage('You must be logged in to save settings.', 'error');
      return;
    }
    try {
      await firebaseService.updateSpecificRoutineSetting(currentUser.uid, 'bath', schedules);
    } catch (error: unknown) {
      console.error('Failed to save bath settings:', error);
      showMessage('Failed to save bath settings.', 'error');
    }
  }, [currentUser, schedules, showMessage]);

  const toggleBathCompletion = useCallback(
    (index: number) => {
      setSchedules(prevSchedules => {
        const newSchedules = [...prevSchedules];
        const scheduleToUpdate = { ...newSchedules[index] };
        scheduleToUpdate.completed = !scheduleToUpdate.completed;
        scheduleToUpdate.updatedAt = Timestamp.now();
        newSchedules[index] = scheduleToUpdate;
        return newSchedules;
      });
      setTimeout(saveBathSettings, 0); // Save after state update
    },
    [saveBathSettings]
  );

  const addBathSchedule = useCallback(() => {
    const bathDuration = parseInt(String(newBathDurationMinutes));
    if (!newBathLabel.trim() || !newBathScheduledTime || isNaN(bathDuration) || bathDuration < 5) {
      showMessage('Please provide a valid label, time, and duration (min 5 min).', 'error');
      return;
    }

    const newSchedule: ScheduledRoutineBase = {
      scheduledTime: newBathScheduledTime,
      durationMinutes: bathDuration,
      label: newBathLabel.trim(),
      icon: newBathIcon,
      completed: false,
      updatedAt: Timestamp.now(),
    };

    const updatedSchedules = [...schedules, newSchedule];
    setSchedules(updatedSchedules);
    setNewBathLabel('');
    setNewBathScheduledTime(format(new Date(), 'HH:mm'));
    setNewBathDurationMinutes(15);
    setNewBathIcon('MdOutlineShower');
    saveBathSettings(); // Save updated schedule list
  }, [
    schedules,
    newBathLabel,
    newBathScheduledTime,
    newBathDurationMinutes,
    newBathIcon,
    saveBathSettings,
    showMessage,
  ]);

  const removeBathSchedule = useCallback(
    (indexToRemove: number) => {
      const updatedSchedules = schedules.filter((_, index) => index !== indexToRemove);
      setSchedules(updatedSchedules);

      saveBathSettings(); // Save updated schedule list
    },
    [schedules, saveBathSettings]
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
      getTimeUntilSchedule={getTimeUntilSchedule}
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
