// app/components/routine/SleepSchedule.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  MdOutlineWbSunny,
  MdOutlineNightlight,
  MdOutlineAccessTime,
  MdOutlineNotificationsActive,
} from 'react-icons/md';
import { format, addMinutes } from 'date-fns';
import { AppState, SleepRoutineSettings, ScheduledRoutineBase } from '@/types';
import { firebaseService } from '@/services/firebaseService';
import { User } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';

// Import the reusable RoutineSectionCard and SleepCalendar
import RoutineSectionCard from '@/components/routine/RoutineSectionCard';
import SleepCalendar from '@/components/routine/SleepCalendar'; // Import SleepCalendar

interface SleepScheduleProps {
  currentUser: User | null;
  appState: AppState | null;
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
  // This prop is now received from RoutinePage and passed down, and it is REQUIRED.
  onAppStateUpdate: (newAppState: AppState) => void;
}

// Define the IconComponents map for SleepSchedule to pass to RoutineSectionCard
const IconComponents: { [key: string]: React.ElementType } = {
  MdOutlineWbSunny,
  MdOutlineNightlight,
  MdOutlineAccessTime,
  MdOutlineNotificationsActive, // Keep this if used in RoutineSectionCard directly
};

const napIcons: string[] = ['MdOutlineAccessTime', 'MdOutlineWbSunny', 'MdOutlineNightlight'];

const SleepSchedule: React.FC<SleepScheduleProps> = ({
  currentUser,
  appState,
  showMessage,
  onAppStateUpdate, // Receive this prop from parent
}) => {
  // Initialize state based on existing appState or defaults
  const initialSleepSettings = appState?.routineSettings?.sleep;

  const [mainSleepScheduledTime, setMainSleepScheduledTime] = useState(
    initialSleepSettings?.scheduledTime || '22:00'
  );
  const [mainWakeTime, setMainWakeTime] = useState(() => {
    if (initialSleepSettings) {
      const bedtimeDate = new Date();
      const [h, m] = initialSleepSettings.scheduledTime.split(':').map(Number);
      bedtimeDate.setHours(h, m, 0, 0);
      const wakeDate = addMinutes(bedtimeDate, initialSleepSettings.durationMinutes);
      return format(wakeDate, 'HH:mm');
    }
    return '06:00'; // Default wake time
  });
  // napSchedule is guaranteed to be an array or null from AppState, init to empty array if null
  const [napSchedule, setNapSchedule] = useState<ScheduledRoutineBase[]>(
    initialSleepSettings?.napSchedule || []
  );

  // States for new nap input fields
  const [newNapLabel, setNewNapLabel] = useState('');
  const [newNapScheduledTime, setNewNapScheduledTime] = useState(format(new Date(), 'HH:mm'));
  const [newNapDurationMinutes, setNewNapDurationMinutes] = useState(30);
  const [newNapIcon, setNewNapIcon] = useState(napIcons[0]); // Default nap icon

  const [, setCurrentTime] = useState(new Date());

  // Effect to update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update local state if appState changes (e.g., after loading or external update)
  useEffect(() => {
    if (appState?.routineSettings?.sleep) {
      const sleepSettings = appState.routineSettings.sleep;
      setMainSleepScheduledTime(sleepSettings.scheduledTime);
      const bedtimeDate = new Date();
      const [h, m] = sleepSettings.scheduledTime.split(':').map(Number);
      bedtimeDate.setHours(h, m, 0, 0);
      const wakeDate = addMinutes(bedtimeDate, sleepSettings.durationMinutes);
      setMainWakeTime(format(wakeDate, 'HH:mm'));

      setNapSchedule(sleepSettings.napSchedule); // Directly assign, napSchedule is guaranteed array
    } else {
      setMainSleepScheduledTime('22:00');
      setMainWakeTime('06:00');
      setNapSchedule([]);
    }
  }, [appState]);

  // Derived: Calculate main sleep durationMinutes from bedtime and wakeTime
  const calculateMainSleepDuration = useCallback((): number => {
    const [bedH, bedM] = mainSleepScheduledTime.split(':').map(Number);
    const [wakeH, wakeM] = mainWakeTime.split(':').map(Number);

    const bedtimeDate = new Date();
    bedtimeDate.setHours(bedH, bedM, 0, 0);

    let wakeTimeDate = new Date();
    wakeTimeDate.setHours(wakeH, wakeM, 0, 0);

    if (wakeTimeDate <= bedtimeDate) {
      wakeTimeDate = addMinutes(wakeTimeDate, 24 * 60); // Add 24 hours
    }

    const diffMs = wakeTimeDate.getTime() - bedtimeDate.getTime();
    return Math.round(diffMs / (1000 * 60)); // Convert to minutes
  }, [mainSleepScheduledTime, mainWakeTime]);

  const mainSleepDurationMinutes = calculateMainSleepDuration();

  // Derived: Calculate time until any scheduled event
  const calculateTimeUntil = useCallback(
    (
      targetTimeStr: string
    ): { hours: number; minutes: number; total: number; isPastToday: boolean } => {
      const now = new Date();
      const [targetH, targetM] = targetTimeStr.split(':').map(Number);
      const targetDate = new Date();
      targetDate.setHours(targetH, targetM, 0, 0);

      let isPastToday = false;
      if (targetDate <= now) {
        isPastToday = true;
        targetDate.setDate(targetDate.getDate() + 1); // Set for tomorrow
      }

      const diff = targetDate.getTime() - now.getTime();
      const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
      const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      return { hours: hoursLeft, minutes: minutesLeft, total: diff, isPastToday: isPastToday };
    },
    []
  );

  const timeUntilBedtime = calculateTimeUntil(mainSleepScheduledTime);
  const timeUntilWakeTime = calculateTimeUntil(mainWakeTime);

  // Dynamic saving for main sleep settings
  const handleMainSleepSettingChange = useCallback(
    async (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
      setter(value);
      // Create a temporary object with the updated main sleep time
      const updatedMainSleep: SleepRoutineSettings = {
        scheduledTime: setter === setMainSleepScheduledTime ? value : mainSleepScheduledTime,
        durationMinutes: calculateMainSleepDuration(),
        label: 'Main Sleep',
        icon: 'MdOutlineNightlight',
        completed: null,
        updatedAt: Timestamp.now(),
        napSchedule: napSchedule, // Always send the current nap schedule to prevent it from being lost
      };

      try {
        await firebaseService.updateSleepRoutineSettings(currentUser!.uid, updatedMainSleep);
      } catch (error) {
        console.error('Failed to update main sleep setting:', error);
        showMessage('Failed to update main sleep setting.', 'error');
      }
    },
    [currentUser, mainSleepScheduledTime, calculateMainSleepDuration, napSchedule, showMessage]
  );

  // Handle adding a new nap schedule
  const addNapSchedule = useCallback(async () => {
    const napDuration = parseInt(String(newNapDurationMinutes));
    if (
      !newNapLabel.trim() ||
      !newNapScheduledTime ||
      isNaN(napDuration) ||
      napDuration < 10 ||
      napDuration > 120
    ) {
      // Max 2 hours (120 minutes) for nap
      showMessage(
        'Please provide a valid nap label, start time, and duration (10 min to 2 hours).',
        'error'
      );
      return;
    }
    if (!currentUser) {
      showMessage('You must be logged in to save settings.', 'error');
      return;
    }

    const newNap: ScheduledRoutineBase = {
      scheduledTime: newNapScheduledTime,
      durationMinutes: napDuration,
      label: newNapLabel.trim(),
      icon: newNapIcon, // Use selected icon
      completed: null, // Naps are not completed individually in this UI
      updatedAt: Timestamp.now(),
    };

    const updatedNapSchedule = [...napSchedule, newNap];
    setNapSchedule(updatedNapSchedule); // Update local state immediately

    // Now, send the complete SleepRoutineSettings object with the updated napSchedule
    const updatedSleepSettings: SleepRoutineSettings = {
      scheduledTime: mainSleepScheduledTime,
      durationMinutes: mainSleepDurationMinutes,
      label: 'Main Sleep',
      icon: 'MdOutlineNightlight',
      completed: null,
      updatedAt: Timestamp.now(),
      napSchedule: updatedNapSchedule,
    };

    try {
      await firebaseService.updateSleepRoutineSettings(currentUser.uid, updatedSleepSettings);
      showMessage('Nap schedule added!', 'success');
      setNewNapLabel('');
      setNewNapScheduledTime(format(new Date(), 'HH:mm')); // Reset to current time after adding
      setNewNapDurationMinutes(30); // Reset to default after adding
      setNewNapIcon('MdOutlineAccessTime'); // Reset icon to default
    } catch (error) {
      console.error('Failed to add nap schedule:', error);
      showMessage('Failed to add nap schedule.', 'error');
    }
  }, [
    currentUser,
    napSchedule,
    newNapLabel,
    newNapScheduledTime,
    newNapDurationMinutes,
    newNapIcon,
    mainSleepScheduledTime,
    mainSleepDurationMinutes,
    showMessage,
  ]);

  // Handle removing a nap schedule
  const removeNapSchedule = useCallback(
    async (indexToRemove: number) => {
      if (!currentUser) {
        showMessage('You must be logged in to remove schedules.', 'error');
        return;
      }
      const updatedNapSchedule = napSchedule.filter((_, index) => index !== indexToRemove);
      setNapSchedule(updatedNapSchedule); // Update local state immediately

      // Send the complete SleepRoutineSettings object with the updated napSchedule
      const updatedSleepSettings: SleepRoutineSettings = {
        scheduledTime: mainSleepScheduledTime,
        durationMinutes: mainSleepDurationMinutes,
        label: 'Main Sleep',
        icon: 'MdOutlineNightlight',
        completed: null,
        updatedAt: Timestamp.now(),
        napSchedule: updatedNapSchedule,
      };

      try {
        await firebaseService.updateSleepRoutineSettings(currentUser.uid, updatedSleepSettings);
        showMessage('Nap schedule removed!', 'info');
      } catch (error) {
        console.error('Failed to remove nap schedule:', error);
        showMessage('Failed to remove nap schedule.', 'error');
      }
    },
    [currentUser, napSchedule, mainSleepScheduledTime, mainSleepDurationMinutes, showMessage]
  );

  // Prevent scroll when using number input arrows
  const handleWheel = useCallback((e: React.WheelEvent<HTMLInputElement>) => {
    if (e.currentTarget instanceof HTMLInputElement) {
      e.currentTarget.blur();
    }
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <>
      <div className="p-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl shadow-2xl">
        {/* Header and current status (specific to SleepSchedule) */}
        <h2 className="flex gap-3 items-center mb-6 text-2xl font-bold text-white">
          <MdOutlineNightlight size={28} />
          Sleep Schedule{' '}
          <span className="text-white/70">
            ({(mainSleepDurationMinutes / 60).toFixed(1)} hours)
          </span>
        </h2>

        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Bedtime Card */}
          <div className="p-6 rounded-xl backdrop-blur bg-white/10">
            <div className="flex gap-3 items-center mb-4">
              <MdOutlineNightlight size={24} className="text-white" />
              <span className="font-medium text-white">Bedtime</span>
            </div>
            <div className="mb-2 text-3xl font-bold text-white">{mainSleepScheduledTime}</div>
            <div className="text-sm opacity-75 text-white/70">
              {timeUntilBedtime.hours}h {timeUntilBedtime.minutes}m remaining
            </div>
            <div className="mt-4 h-2 rounded-full bg-white/20">
              <div
                className="h-2 bg-yellow-400 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.max(0, 100 - (timeUntilBedtime.total / (24 * 60 * 60 * 1000)) * 100)}%`,
                }}
              ></div>
            </div>
          </div>

          {/* Calculated Wake Up Time Card */}
          <div className="p-6 rounded-xl backdrop-blur bg-white/10">
            <div className="flex gap-3 items-center mb-4">
              <MdOutlineWbSunny size={24} className="text-white" />
              <span className="font-medium text-white">Calculated Wake Up</span>
            </div>
            <div className="mb-2 text-3xl font-bold text-white">{mainWakeTime}</div>
            <div className="text-sm opacity-75 text-white/70">
              {timeUntilWakeTime.hours}h {timeUntilWakeTime.minutes}m remaining
            </div>
            <div className="mt-4 h-2 rounded-full bg-white/20">
              <div
                className="h-2 bg-orange-400 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.max(0, 100 - (timeUntilWakeTime.total / (24 * 60 * 60 * 1000)) * 100)}%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Main Sleep Settings Section (direct inputs) */}
        <div className="bg-white/[0.02] rounded-xl p-6 shadow-lg border border-white/10 mb-8">
          <h3 className="mb-4 font-semibold text-white">Main Sleep Settings</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block mb-2 text-sm font-medium text-white/70">Bedtime</label>
              <input
                type="time"
                value={mainSleepScheduledTime}
                onChange={e =>
                  handleMainSleepSettingChange(setMainSleepScheduledTime, e.target.value)
                }
                className="p-3 w-full text-white rounded-lg border cursor-pointer focus:ring-2 focus:ring-purple-500 bg-black/20 border-white/10"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-white/70">Wake Up Time</label>
              <input
                type="time"
                value={mainWakeTime}
                onChange={e => handleMainSleepSettingChange(setMainWakeTime, e.target.value)}
                className="p-3 w-full text-white rounded-lg border cursor-pointer focus:ring-2 focus:ring-purple-500 bg-black/20 border-white/10"
              />
            </div>
          </div>

          {/* Suggestion Box */}
          <div className="flex flex-col mt-8">
            <div className="flex gap-2 items-center">
              <MdOutlineNotificationsActive size={24} className="mb-2 text-purple-300" />
              <h3 className="mb-2 text-lg font-semibold text-white">Unwind Before Bed</h3>
            </div>
            <p className="text-base leading-relaxed text-white/80">
              Dedicate 30 minutes before bedtime. Step away from screens. Read, stretch, or
              meditate. This helps calm your mind for better sleep.
            </p>
          </div>
        </div>
      </div>

      {/* Nap Schedule Section - now using RoutineSectionCard */}
      <RoutineSectionCard
        sectionTitle="Nap Schedule"
        summaryCount={`${napSchedule.filter(n => n.completed).length}/${napSchedule.length}`} // Summary based on naps
        summaryLabel="Naps Completed Today"
        progressPercentage={
          napSchedule.length > 0
            ? (napSchedule.filter(n => n.completed).length / napSchedule.length) * 100
            : 0
        }
        listTitle="Your Nap Schedules"
        listEmptyMessage="No naps scheduled. Add one below!"
        schedules={napSchedule}
        onToggleCompletion={() => {
          /* Naps are not toggled for completion in this UI, but RoutineSectionCard expects this prop */
        }}
        onRemoveSchedule={removeNapSchedule}
        // Removed getTimeUntilSchedule prop as it's now internal to RoutineSectionCard
        newInputLabelPlaceholder="Nap Label"
        newInputValue={newNapLabel}
        onNewInputChange={setNewNapLabel}
        newTimeValue={newNapScheduledTime}
        onNewTimeChange={setNewNapScheduledTime}
        newDurationPlaceholder="Duration (min)"
        newDurationValue={newNapDurationMinutes === 0 ? '' : String(newNapDurationMinutes)}
        onNewDurationChange={value => {
          const val = parseInt(value);
          setNewNapDurationMinutes(isNaN(val) ? 0 : val);
        }}
        onNewDurationWheel={handleWheel}
        newCurrentIcon={newNapIcon}
        newIconOptions={napIcons} // Pass nap specific icons
        onNewSelectIcon={setNewNapIcon}
        iconComponentsMap={IconComponents} // Pass the main IconComponents map
        buttonLabel="Add & Save Nap"
        onAddSchedule={addNapSchedule}
      />

      {/* Integrate SleepCalendar component here */}
      <div className="mt-8">
        <SleepCalendar
          appState={appState}
          currentUser={currentUser}
          showMessage={showMessage}
          onAppStateUpdate={onAppStateUpdate} // Pass the parent's update function
        />
      </div>
    </>
  );
};

export default SleepSchedule;
