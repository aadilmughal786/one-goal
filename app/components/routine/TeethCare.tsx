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

// Import the reusable RoutineSectionCard
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

const TeethCare: React.FC<TeethCareProps> = ({ currentUser, appState, showMessage }) => {
  // `sessions` is guaranteed to be an array or null from AppState, init to empty array if null
  const [sessions, setSessions] = useState<ScheduledRoutineBase[]>(
    appState?.routineSettings?.teeth || []
  );

  // States for new session input fields (passed to RoutineSectionCard)
  const [newTeethLabel, setNewTeethLabel] = useState('');
  const [newTeethScheduledTime, setNewTeethScheduledTime] = useState(format(new Date(), 'HH:mm'));
  const [newTeethDurationMinutes, setNewTeethDurationMinutes] = useState(2);
  const [newTeethIcon, setNewTeethIcon] = useState(teethIcons[0]);

  // Sync local state with appState from Firebase
  useEffect(() => {
    // `appState.routineSettings.teeth` is guaranteed to be an array or null
    setSessions(appState?.routineSettings?.teeth || []);
  }, [appState]);

  const toggleTeethCompletion = useCallback(
    async (index: number) => {
      if (!currentUser) {
        showMessage('You must be logged in to update schedules.', 'error');
        return;
      }
      // Create a new array to ensure immutability before updating Firestore
      const updatedSessions = sessions.map((session, i) => {
        if (i === index) {
          return { ...session, completed: !session.completed, updatedAt: Timestamp.now() };
        }
        return session;
      });
      setSessions(updatedSessions); // Update local state immediately

      try {
        // Use the dedicated update function for teeth care schedules
        await firebaseService.updateTeethRoutineSchedules(currentUser.uid, updatedSessions);
        showMessage('Dental care schedule updated!', 'success');
      } catch (error: unknown) {
        console.error('Failed to save dental care settings:', error);
        showMessage('Failed to save dental care settings.', 'error');
      }
    },
    [currentUser, sessions, showMessage]
  );

  const addTeethSchedule = useCallback(async () => {
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
    if (!currentUser) {
      showMessage('You must be logged in to add schedules.', 'error');
      return;
    }

    const newSchedule: ScheduledRoutineBase = {
      scheduledTime: newTeethScheduledTime,
      durationMinutes: sessionDuration,
      label: newTeethLabel.trim(),
      icon: newTeethIcon,
      completed: null, // New schedule starts as not completed (null)
      updatedAt: Timestamp.now(),
    };

    const updatedSchedules = [...sessions, newSchedule];
    setSessions(updatedSchedules); // Update local state immediately

    try {
      // Use the dedicated update function for teeth care schedules
      await firebaseService.updateTeethRoutineSchedules(currentUser.uid, updatedSchedules);
      showMessage('Dental care schedule added!', 'success');
      // Reset form fields
      setNewTeethLabel('');
      setNewTeethScheduledTime(format(new Date(), 'HH:mm'));
      setNewTeethDurationMinutes(2);
      setNewTeethIcon(teethIcons[0]); // Reset to first icon
    } catch (error: unknown) {
      console.error('Failed to add dental care schedule:', error);
      showMessage('Failed to add dental care schedule.', 'error');
    }
  }, [
    currentUser,
    sessions,
    newTeethLabel,
    newTeethScheduledTime,
    newTeethDurationMinutes,
    newTeethIcon,
    showMessage,
  ]);

  const removeTeethSchedule = useCallback(
    async (indexToRemove: number) => {
      if (!currentUser) {
        showMessage('You must be logged in to remove schedules.', 'error');
        return;
      }
      const updatedSchedules = sessions.filter((_, index) => index !== indexToRemove);
      setSessions(updatedSchedules); // Update local state immediately

      try {
        // Use the dedicated update function for teeth care schedules
        await firebaseService.updateTeethRoutineSchedules(currentUser.uid, updatedSchedules);
        showMessage('Dental care schedule removed!', 'info');
      } catch (error: unknown) {
        console.error('Failed to remove dental care schedule:', error);
        showMessage('Failed to remove dental care schedule.', 'error');
      }
    },
    [currentUser, sessions, showMessage]
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
      // Removed getTimeUntilSchedule prop as it's now internal to RoutineSectionCard
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
