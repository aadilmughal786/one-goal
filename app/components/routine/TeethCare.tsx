// app/components/routine/TeethCare.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  MdOutlineCleaningServices,
  MdOutlineHealthAndSafety,
  MdOutlineSentimentSatisfied,
} from 'react-icons/md';
import { format } from 'date-fns';
import { AppState, ScheduledRoutineBase } from '@/types';
import { firebaseService } from '@/services/firebaseService';
import { User } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';

// Import the reusable RoutineSectionCard and IconOption
import RoutineSectionCard from '@/components/routine/RoutineSectionCard';
import { FaTeeth, FaTooth } from 'react-icons/fa6';
import { PiToothFill } from 'react-icons/pi';

interface TeethCareProps {
  currentUser: User | null;
  appState: AppState | null;
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
}

// Define the IconComponents map for TeethCare
const IconComponents: { [key: string]: React.ElementType } = {
  MdOutlineSentimentSatisfied, // Main icon for this section
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

const TeethCare: React.FC<TeethCareProps> = ({ currentUser, appState, showMessage }) => {
  const [sessions, setSessions] = useState<ScheduledRoutineBase[]>([]);

  // States for new session input fields (passed to RoutineSectionCard)
  const [newTeethLabel, setNewTeethLabel] = useState('');
  const [newTeethScheduledTime, setNewTeethScheduledTime] = useState(format(new Date(), 'HH:mm'));
  const [newTeethDurationMinutes, setNewTeethDurationMinutes] = useState(2);
  const [newTeethIcon, setNewTeethIcon] = useState(teethIcons[0]);

  // Sync local state with appState from Firebase
  useEffect(() => {
    if (appState?.routineSettings?.teeth) {
      setSessions(appState.routineSettings.teeth);
    } else {
      setSessions([]);
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

  const saveTeethSettings = useCallback(async () => {
    if (!currentUser) {
      showMessage('You must be logged in to save settings.', 'error');
      return;
    }
    try {
      await firebaseService.updateSpecificRoutineSetting(currentUser.uid, 'teeth', sessions);
    } catch (error: unknown) {
      console.error('Failed to save dental care settings:', error);
      showMessage('Failed to save dental care settings.', 'error');
    }
  }, [currentUser, sessions, showMessage]);

  const toggleTeethCompletion = useCallback(
    (index: number) => {
      setSessions(prevSessions => {
        const newSessions = [...prevSessions];
        const sessionToUpdate = { ...newSessions[index] };
        sessionToUpdate.completed = !sessionToUpdate.completed;
        sessionToUpdate.updatedAt = Timestamp.now();
        newSessions[index] = sessionToUpdate;
        return newSessions;
      });
      setTimeout(saveTeethSettings, 0); // Save after state update
    },
    [saveTeethSettings]
  );

  const addTeethSchedule = useCallback(() => {
    const sessionDuration = parseInt(String(newTeethDurationMinutes));
    if (
      !newTeethLabel.trim() ||
      !newTeethScheduledTime ||
      isNaN(sessionDuration) ||
      sessionDuration < 1
    ) {
      // Min 1 minute
      showMessage('Please provide a valid label, time, and duration (min 1 min).', 'error');
      return;
    }

    const newSchedule: ScheduledRoutineBase = {
      scheduledTime: newTeethScheduledTime,
      durationMinutes: sessionDuration,
      label: newTeethLabel.trim(),
      icon: newTeethIcon,
      completed: false,
      updatedAt: Timestamp.now(),
    };

    const updatedSchedules = [...sessions, newSchedule];
    setSessions(updatedSchedules);
    setNewTeethLabel('');
    setNewTeethScheduledTime(format(new Date(), 'HH:mm'));
    setNewTeethDurationMinutes(2);
    setNewTeethIcon('MdOutlineBrush');
    saveTeethSettings(); // Save updated schedule list
  }, [
    sessions,
    newTeethLabel,
    newTeethScheduledTime,
    newTeethDurationMinutes,
    newTeethIcon,
    saveTeethSettings,
    showMessage,
  ]);

  const removeTeethSchedule = useCallback(
    (indexToRemove: number) => {
      const updatedSchedules = sessions.filter((_, index) => index !== indexToRemove);
      setSessions(updatedSchedules);

      saveTeethSettings(); // Save updated schedule list
    },
    [sessions, saveTeethSettings]
  );

  const completedSchedulesCount = sessions.filter(s => s.completed).length;

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
      onRemoveSchedule={removeTeethSchedule}
      getTimeUntilSchedule={getTimeUntilSchedule}
      newInputLabelPlaceholder="Session Label"
      newInputValue={newTeethLabel}
      onNewInputChange={setNewTeethLabel}
      newTimeValue={newTeethScheduledTime}
      onNewTimeChange={setNewTeethScheduledTime}
      newDurationPlaceholder="Duration (min)"
      newDurationValue={newTeethDurationMinutes === 0 ? '' : String(newTeethDurationMinutes)}
      onNewDurationChange={value => {
        const val = parseInt(value);
        setNewTeethDurationMinutes(isNaN(val) ? 0 : val);
      }}
      onNewDurationWheel={handleWheel}
      newCurrentIcon={newTeethIcon}
      newIconOptions={teethIcons}
      onNewSelectIcon={setNewTeethIcon}
      iconComponentsMap={IconComponents} // Pass the IconComponents map
      buttonLabel="Add & Save Session"
      onAddSchedule={addTeethSchedule}
    />
  );
};

export default TeethCare;
