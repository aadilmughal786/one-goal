// app/components/routine/SleepSchedule.tsx
'use client';

import { firebaseService } from '@/services/firebaseService';
import { AppState, RoutineType, ScheduledRoutineBase, SleepRoutineSettings } from '@/types';
import { addDays, differenceInMinutes, format, isAfter, isBefore, parse } from 'date-fns';
import { User } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore'; // Import Timestamp for setting dates
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaMoon, FaSun } from 'react-icons/fa'; // Ensure FaMoon and FaSun are imported
import { FiLoader, FiRefreshCw } from 'react-icons/fi';
import {
  MdBedtime,
  MdOutlineAccessTime,
  MdOutlineLightbulb,
  MdOutlineNightlight,
  MdOutlineWbSunny,
} from 'react-icons/md';

// Import the reusable components
import { DateTimePicker } from '@/components/common/DateTimePicker';
import RoutineCalendar from '@/components/routine/RoutineCalendar';
import RoutineSectionCard from '@/components/routine/RoutineSectionCard';
import NoActiveGoalMessage from '../common/NoActiveGoalMessage';

interface SleepScheduleProps {
  currentUser: User | null;
  appState: AppState | null;
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
  onAppStateUpdate: (newAppState: AppState) => void;
}

// Helper for generating UUIDs for new item IDs (used for new naps)
const generateUUID = () => crypto.randomUUID();

// Map of icon names (strings) to their actual React component imports for naps
const IconComponents: { [key: string]: React.ElementType } = {
  MdOutlineWbSunny,
  MdOutlineNightlight,
  MdOutlineAccessTime,
};

// Array of icon names to be passed as options for nap schedules
const napIcons: string[] = ['MdOutlineAccessTime', 'MdOutlineWbSunny', 'MdOutlineNightlight'];

// Array of sleep tips for the "Sleep Insight" section
const sleepTips = [
  "Stick to a regular sleep schedule, even on weekends, to regulate your body's internal clock.",
  "Create a relaxing bedtime routine. A warm bath, reading a book, or listening to calm music can signal to your body that it's time to wind down.",
  'Ensure your bedroom is dark, quiet, and cool. Consider using blackout curtains, earplugs, or a white noise machine.',
  'Avoid large meals, caffeine, and alcohol before bedtime as they can disrupt sleep.',
  'Get some exercise during the day. Regular physical activity can help you fall asleep faster and enjoy deeper sleep.',
  'Limit exposure to blue light from screens (phones, tablets, computers, TVs) at least an hour before bed.',
  "If you can't fall asleep after 20 minutes, get out of bed and do something relaxing until you feel sleepy.",
  'Avoid long or irregular naps during the day, especially in the late afternoon.',
  'Invest in a comfortable mattress, pillows, and bedding. Your sleep environment makes a huge difference.',
  'Get some natural sunlight exposure during the day. It helps to keep your internal clock on track.',
  'Write down your worries or to-do list for the next day to clear your mind before sleeping.',
  'Use your bedroom only for sleep and intimacy to strengthen the mental association between your bed and sleep.',
  'Practice mindfulness or meditation to calm your nervous system and reduce pre-sleep anxiety.',
  'Hydrate well during the day, but try to limit your fluid intake in the hour or two before bed to prevent nighttime awakenings.',
  "Check your room's temperature. A slightly cool room, around 65°F (18.3°C), is often considered ideal for sleeping.",
];

/**
 * SleepSchedule Component
 *
 * Manages the user's main sleep schedule (bedtime, wake-up time) and nap schedules.
 * Provides insights and integrates with Firebase for data persistence.
 *
 * Uses:
 * - RoutineCalendar for logging daily sleep routine completion.
 * - RoutineSectionCard for managing and displaying nap schedules.
 * - DateTimePicker for selecting specific times.
 */
const SleepSchedule: React.FC<SleepScheduleProps> = ({
  currentUser,
  appState,
  showMessage,
  onAppStateUpdate,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  // Derive the active goal ID from the appState
  const activeGoalId = appState?.activeGoalId;
  // Get sleep settings for the active goal, or null if no active goal/settings
  const activeGoalSleepSettings = useMemo(() => {
    // Use useMemo for activeGoalSleepSettings
    return appState?.goals[activeGoalId || '']?.routineSettings?.sleep;
  }, [appState, activeGoalId]);

  // State for main sleep times and nap schedules
  const [bedtime, setBedtime] = useState(activeGoalSleepSettings?.sleepTime || '22:00'); // Corrected to sleepTime
  const [wakeTime, setWakeTime] = useState(activeGoalSleepSettings?.wakeTime || '06:00');
  const [napSchedule, setNapSchedule] = useState<ScheduledRoutineBase[]>(
    activeGoalSleepSettings?.naps || []
  );

  const [isBedtimePickerOpen, setIsBedtimePickerOpen] = useState(false);
  const [isWakeTimePickerOpen, setIsWakeTimePickerOpen] = useState(false);
  const [randomTip, setRandomTip] = useState<string>('');
  const [isRefreshingTip, setIsRefreshingTip] = useState(false);

  // FIX: Ref to track initial mount for debounced save
  const isInitialDebounceMount = useRef(true);

  // Effect to update current time every second for real-time calculations (e.g., time until next event)
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Function to refresh the random sleep tip with a small artificial delay
  // This useCallback has NO dependencies on appState or activeGoalId. It is truly standalone.
  const refreshTip = useCallback(() => {
    setIsRefreshingTip(true); // Activate fetching loader
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * sleepTips.length);
      setRandomTip(sleepTips[randomIndex]); // Set a new random tip
      setIsRefreshingTip(false); // Deactivate fetching loader
    }, 500); // 500ms fake delay for UX
  }, []); // Empty dependency array means this callback is stable and only created once.

  // Effect to synchronize local state with Firebase appState on appState/activeGoalId changes.
  useEffect(() => {
    if (activeGoalSleepSettings) {
      // Depend on the memoized activeGoalSleepSettings
      setBedtime(activeGoalSleepSettings.sleepTime);
      setWakeTime(activeGoalSleepSettings.wakeTime);
      setNapSchedule(activeGoalSleepSettings.naps || []);
    } else {
      // Reset to defaults if no active goal or sleep settings
      setBedtime('22:00');
      setWakeTime('06:00');
      setNapSchedule([]);
    }
  }, [activeGoalSleepSettings]); // This useEffect correctly depends on activeGoalSleepSettings

  // Effect to set initial random tip on first render.
  // This useEffect will specifically call refreshTip ONCE on component mount.
  useEffect(() => {
    refreshTip();
  }, [refreshTip]); // Depends only on refreshTip callback's stability

  /**
   * Memoized calculation of sleep-related status and timings.
   * Re-calculates only when `currentTime`, `bedtime`, or `wakeTime` changes.
   */
  const { isSleepTime, timeUntilNextEvent, nextEventLabel, totalSleepDurationMinutes } =
    useMemo(() => {
      const now = currentTime;
      // Parse bedtime and wake time into Date objects, adjusting for overnight schedules
      let bed = parse(bedtime, 'HH:mm', now);
      let wake = parse(wakeTime, 'HH:mm', now);

      const isOvernight = isAfter(bed, wake);

      if (isOvernight) {
        // If wake time is before bedtime on the same day, it implies wake time is next day.
        if (isBefore(now, wake)) {
          // If current time is before wake time, then bedtime must have been yesterday.
          bed = addDays(bed, -1);
        } else {
          // Otherwise, wake time is tomorrow.
          wake = addDays(wake, 1);
        }
      }

      // Determine if current time falls within the main sleep window
      const isCurrentlySleepTime = isAfter(now, bed) && isBefore(now, wake);

      // Determine time until the next sleep event (bedtime or wake-up)
      const nextBedEvent = parse(bedtime, 'HH:mm', now);
      let nextWakeEvent = parse(wakeTime, 'HH:mm', now);

      // Adjust nextWakeEvent if it's an overnight schedule and wake time is already past today
      if (isAfter(nextBedEvent, nextWakeEvent)) {
        // If bedtime is later than wakeTime (overnight)
        if (isBefore(now, nextWakeEvent)) {
          // Current time is before wake time, so wake is today
          // no adjustment needed for nextWakeEvent if parsing assumes current day
        } else {
          // Current time is after wake time, so wake is tomorrow
          nextWakeEvent = addDays(nextWakeEvent, 1);
        }
      }

      let timeUntilNextEventMinutes: number;
      let nextEventDisplayLabel: string;

      const timeToBed = differenceInMinutes(nextBedEvent, now);
      const timeToWake = differenceInMinutes(nextWakeEvent, now);

      // Logic to find the nearest upcoming event
      if (isAfter(nextBedEvent, now) && (timeToBed <= timeToWake || timeToWake < 0)) {
        // If bedtime is in the future AND (it's closer than wake time OR wake time is in the past)
        timeUntilNextEventMinutes = timeToBed;
        nextEventDisplayLabel = 'Bedtime';
      } else if (isAfter(nextWakeEvent, now)) {
        // If wake time is in the future
        timeUntilNextEventMinutes = timeToWake;
        nextEventDisplayLabel = 'Wake Up';
      } else {
        // If both are in the past, calculate time to tomorrow's bedtime
        timeUntilNextEventMinutes = differenceInMinutes(addDays(nextBedEvent, 1), now);
        nextEventDisplayLabel = 'Bedtime';
      }

      // Calculate total duration between bedtime and wake time
      let totalDuration = differenceInMinutes(wake, bed);
      // Ensure total duration is not negative (e.g., if wake time is next day)
      if (totalDuration < 0 && isOvernight) {
        totalDuration = 1440 + totalDuration; // Add 24 hours (1440 minutes) for overnight duration
      } else if (totalDuration < 0) {
        // Fallback for cases where it's not overnight but duration is negative
        totalDuration = 0;
      }

      return {
        isSleepTime: isCurrentlySleepTime,
        timeUntilNextEvent: timeUntilNextEventMinutes,
        nextEventLabel: nextEventDisplayLabel,
        totalSleepDurationMinutes: totalDuration,
      };
    }, [currentTime, bedtime, wakeTime]);

  /**
   * Saves the main sleep settings (bedtime, wake-up time) to Firebase.
   * This function is debounced to avoid excessive writes.
   */
  const saveMainSleepSettings = useCallback(async () => {
    if (!currentUser || !activeGoalId) {
      console.warn('Attempted to save main sleep settings without user or active goal.');
      showMessage('Authentication or active goal required to save main sleep settings.', 'error');
      return;
    }
    const newSettings: SleepRoutineSettings = {
      sleepTime: bedtime, // Corrected to sleepTime
      wakeTime,
      naps: napSchedule, // Ensure naps are included to avoid overwriting
    };
    try {
      await firebaseService.updateSleepRoutineSettings(activeGoalId, currentUser.uid, newSettings);
      // Re-fetch AppState to update all related parts (e.g., routine reset logic)
      const newAppState = await firebaseService.getUserData(currentUser.uid);
      onAppStateUpdate(newAppState);
      showMessage('Main sleep schedule updated!', 'success');
    } catch (error) {
      console.error('Failed to save main sleep settings:', error);
      showMessage('Failed to save main sleep settings.', 'error');
    }
  }, [currentUser, activeGoalId, bedtime, wakeTime, napSchedule, showMessage, onAppStateUpdate]);

  // Effect to debounce saving of main sleep settings.
  // FIX: Skip on initial mount
  useEffect(() => {
    if (isInitialDebounceMount.current) {
      isInitialDebounceMount.current = false; // Set to false after first render
      return; // Skip the effect on first render
    }
    const handler = setTimeout(() => {
      saveMainSleepSettings();
    }, 1000); // Debounce for 1 second
    return () => clearTimeout(handler); // Cleanup timeout on re-render or unmount
  }, [bedtime, wakeTime, saveMainSleepSettings]); // Dependencies for debounce

  /**
   * Toggles the 'completed' status of a specific nap schedule.
   * This function is passed to RoutineSectionCard.
   * @param index The index of the nap in the current `napSchedule` array to toggle.
   */
  const toggleNapCompletion = useCallback(
    async (index: number) => {
      if (!currentUser || !activeGoalId) {
        showMessage(
          'You must be logged in and have an active goal to update nap schedules.',
          'error'
        );
        return;
      }

      // Create a new array with the toggled nap's completion status and updated timestamp
      const updatedNaps = napSchedule.map((nap, i) =>
        i === index
          ? {
              ...nap,
              completed: !nap.completed,
              updatedAt: Timestamp.now(), // Update timestamp on modification
              completedAt: !nap.completed ? Timestamp.now() : null, // Set/clear completedAt
            }
          : nap
      );

      // Optimistically update local state for immediate UI feedback
      setNapSchedule(updatedNaps);

      const newSettings: SleepRoutineSettings = {
        sleepTime: bedtime, // Corrected to sleepTime
        wakeTime,
        naps: updatedNaps, // Use 'naps' as per type
      };

      try {
        await firebaseService.updateSleepRoutineSettings(
          activeGoalId,
          currentUser.uid,
          newSettings
        );
        const newAppState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(newAppState);
        showMessage('Nap schedule updated!', 'success');
      } catch (error) {
        console.error('Failed to save nap settings:', error);
        showMessage('Failed to save nap settings.', 'error');
        // Revert to old state if save fails by re-fetching from Firebase
        const oldState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(oldState);
      }
    },
    [currentUser, activeGoalId, napSchedule, bedtime, wakeTime, showMessage, onAppStateUpdate]
  );

  /**
   * Handles saving a new or updated nap schedule.
   * This function is passed to and called by the ScheduleEditModal.
   * @param schedule The ScheduledRoutineBase object to save/update.
   * @param index The original index if updating an existing schedule, or null if adding a new one.
   */
  const handleSaveNapSchedule = useCallback(
    async (schedule: ScheduledRoutineBase, index: number | null) => {
      if (!currentUser || !activeGoalId) {
        showMessage(
          'You must be logged in and have an active goal to save nap schedules.',
          'error'
        );
        return;
      }

      let updatedNaps: ScheduledRoutineBase[];
      let messageType: 'added' | 'updated';
      const now = Timestamp.now();

      if (index !== null) {
        // If index is provided, it's an update operation
        updatedNaps = napSchedule.map((n, i) =>
          i === index ? { ...schedule, updatedAt: now } : n
        );
        messageType = 'updated';
      } else {
        // If no index, it's a new schedule
        // Ensure all required fields for ScheduledRoutineBase are present for new additions
        updatedNaps = [
          ...napSchedule,
          {
            ...schedule,
            id: generateUUID(),
            createdAt: now,
            updatedAt: now,
            completed: false, // New routines start as not completed
            completedAt: null, // No completion time for new routines
          },
        ];
        messageType = 'added';
      }
      // Optimistically update local state
      setNapSchedule(updatedNaps);

      const newSettings: SleepRoutineSettings = {
        sleepTime: bedtime, // Corrected to sleepTime
        wakeTime,
        naps: updatedNaps,
      };
      try {
        await firebaseService.updateSleepRoutineSettings(
          activeGoalId,
          currentUser.uid,
          newSettings
        );
        showMessage(messageType === 'updated' ? 'Nap updated!' : 'Nap added!', 'success');
        const newAppState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(newAppState);
      } catch (error) {
        console.error('Failed to save nap schedule:', error);
        showMessage('Failed to save nap schedule.', 'error');
        // Revert local state by re-fetching original data from Firebase
        const oldState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(oldState);
      }
    },
    [currentUser, activeGoalId, napSchedule, bedtime, wakeTime, showMessage, onAppStateUpdate]
  );

  /**
   * Handles removing a specific nap schedule.
   * @param indexToRemove The index of the schedule to remove from the current `napSchedule` array.
   */
  const handleRemoveNapSchedule = useCallback(
    async (indexToRemove: number) => {
      if (!currentUser || !activeGoalId) {
        showMessage(
          'You must be logged in and have an active goal to remove nap schedules.',
          'error'
        );
        return;
      }
      // Filter out the nap to be removed
      const updatedNaps = napSchedule.filter((_, index) => index !== indexToRemove);
      // Optimistically update local state
      setNapSchedule(updatedNaps);

      const newSettings: SleepRoutineSettings = {
        sleepTime: bedtime, // Corrected to sleepTime
        wakeTime,
        naps: updatedNaps,
      };
      try {
        await firebaseService.updateSleepRoutineSettings(
          activeGoalId,
          currentUser.uid,
          newSettings
        );
        showMessage('Nap schedule removed.', 'info');
        const newAppState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(newAppState);
      } catch (error) {
        console.error('Failed to remove nap schedule:', error);
        showMessage('Failed to remove nap schedule.', 'error');
        // Revert local state by re-fetching original data from Firebase
        const oldState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(oldState);
      }
    },
    [currentUser, activeGoalId, napSchedule, bedtime, wakeTime, showMessage, onAppStateUpdate]
  );

  // Helper to format minutes into a human-readable "Xh Ym" string
  const formatTimeLeft = (minutes: number) => {
    // Ensure minutes is not negative
    if (minutes < 0) minutes = 0;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    // Only show hours if greater than 0, always show minutes
    return `${h > 0 ? `${h}h ` : ''}${m}m`;
  };

  // Render nothing if no active goal is selected.
  // This is a common pattern to avoid errors when trying to access goal-specific data.
  if (!activeGoalId || !appState?.goals[activeGoalId]) {
    // Using the NoActiveGoalMessage component
    return <NoActiveGoalMessage />;
  }

  return (
    <>
      <div className="mt-8 space-y-16">
        {/* Main Sleep Settings Card */}
        <div className="bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl shadow-2xl">
          <h2 className="flex gap-3 items-center p-6 pb-0 text-2xl font-bold text-white">
            <MdOutlineNightlight size={28} />
            Main Sleep Schedule
          </h2>

          <div className="p-6">
            {/* Status Message */}
            <div
              className={`p-4 rounded-lg text-center mb-6 transition-colors duration-500 ${isSleepTime ? 'bg-indigo-500/20' : 'bg-amber-500/10'}`}
            >
              {isSleepTime ? (
                <div className="flex gap-2 justify-center items-center">
                  <MdBedtime size={24} className="text-indigo-300" />
                  <span className="text-lg font-semibold text-indigo-200">
                    It&apos;s time to sleep. Rest well!
                  </span>
                </div>
              ) : (
                <div className="flex gap-2 justify-center items-center">
                  <FaSun size={20} className="text-amber-300" />
                  <span className="text-lg font-semibold text-amber-200">
                    {nextEventLabel} is in {formatTimeLeft(timeUntilNextEvent)}.
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Bedtime Selector */}
              <div className="flex flex-col items-center p-4 rounded-xl bg-white/5">
                <label htmlFor="bedtime-picker" className="self-start text-sm text-white/70">
                  Bedtime
                </label>
                <FaMoon className="my-3 text-4xl text-purple-300" />
                <button
                  id="bedtime-picker"
                  onClick={() => setIsBedtimePickerOpen(true)}
                  className="p-2 mt-1 w-full text-2xl font-bold text-center text-white bg-transparent rounded-lg cursor-pointer hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  aria-label="Select bedtime"
                >
                  {format(parse(bedtime, 'HH:mm', new Date()), 'h:mm a')}
                </button>
              </div>
              {/* Wake-up Time Selector */}
              <div className="flex flex-col items-center p-4 rounded-xl bg-white/5">
                <label htmlFor="wake-time-picker" className="self-start text-sm text-white/70">
                  Wake-up Time
                </label>
                <FaSun className="my-3 text-4xl text-orange-300" />
                <button
                  id="wake-time-picker"
                  onClick={() => setIsWakeTimePickerOpen(true)}
                  className="p-2 mt-1 w-full text-2xl font-bold text-center text-white bg-transparent rounded-lg cursor-pointer hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  aria-label="Select wake-up time"
                >
                  {format(parse(wakeTime, 'HH:mm', new Date()), 'h:mm a')}
                </button>
              </div>
            </div>
            {/* Total Sleep Duration Display */}
            <div className="mt-6 text-center text-white/80">
              Total Sleep Duration:{' '}
              <span className="font-bold text-white">
                {(totalSleepDurationMinutes / 60).toFixed(1)} hours
              </span>
            </div>
          </div>

          {/* Integrated Sleep Insight */}
          <div className="p-6 border-t border-white/10">
            <div className="flex justify-between items-center mb-2">
              <h3 className="flex gap-2 items-center text-lg font-semibold text-white">
                <MdOutlineLightbulb size={20} />
                Sleep Insight
              </h3>
              <button
                onClick={refreshTip}
                disabled={isRefreshingTip}
                className="p-2 rounded-full cursor-pointer hover:bg-white/10 disabled:opacity-50"
                title="Get a new tip"
                aria-label="Refresh sleep tip"
              >
                {isRefreshingTip ? <FiLoader className="animate-spin" /> : <FiRefreshCw />}
              </button>
            </div>
            <p className="text-sm text-white/70">
              {isRefreshingTip ? 'Getting a new tip...' : randomTip}
            </p>
          </div>
        </div>

        {/* Sleep Calendar */}
        <RoutineCalendar
          appState={appState}
          currentUser={currentUser}
          showMessage={showMessage}
          onAppStateUpdate={onAppStateUpdate}
          routineType={RoutineType.SLEEP}
          title="Sleep Log"
          icon={MdOutlineNightlight}
        />

        {/* Nap Schedule Card */}
        <RoutineSectionCard
          sectionTitle="Nap Schedule"
          summaryCount={`${napSchedule.filter(n => n.completed).length}/${napSchedule.length}`}
          summaryLabel="Naps Completed Today"
          progressPercentage={
            napSchedule.length > 0
              ? (napSchedule.filter(n => n.completed).length / napSchedule.length) * 100
              : 0
          }
          listTitle="Your Scheduled Naps"
          listEmptyMessage="No naps scheduled. Add one below!"
          schedules={napSchedule}
          onToggleCompletion={toggleNapCompletion} // Corrected: Passed the actual toggle function
          onRemoveSchedule={handleRemoveNapSchedule}
          onSaveSchedule={handleSaveNapSchedule}
          showMessage={showMessage}
          newInputLabelPlaceholder="e.g., Afternoon Power Nap"
          newIconOptions={napIcons}
          iconComponentsMap={IconComponents}
        />
      </div>

      {/* Time Picker Modals */}
      <DateTimePicker
        isOpen={isBedtimePickerOpen}
        value={parse(bedtime, 'HH:mm', new Date())}
        onChange={date => {
          if (date) {
            setBedtime(format(date, 'HH:mm'));
            // Message will be shown by debounced saveMainSleepSettings
          }
        }}
        onClose={() => setIsBedtimePickerOpen(false)}
        mode="time"
      />

      <DateTimePicker
        isOpen={isWakeTimePickerOpen}
        value={parse(wakeTime, 'HH:mm', new Date())}
        onChange={date => {
          if (date) {
            setWakeTime(format(date, 'HH:mm'));
            // Message will be shown by debounced saveMainSleepSettings
          }
        }}
        onClose={() => setIsWakeTimePickerOpen(false)}
        mode="time"
      />
    </>
  );
};

export default SleepSchedule;
