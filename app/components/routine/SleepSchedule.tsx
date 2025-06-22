// app/components/routine/SleepSchedule.tsx
'use client';

import { AppState, RoutineType, ScheduledRoutineBase, SleepRoutineSettings } from '@/types';
import { addDays, differenceInMinutes, format, isAfter, isBefore, parse } from 'date-fns';
import { User } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaMoon, FaSun } from 'react-icons/fa';
import { FiLoader, FiRefreshCw } from 'react-icons/fi';
import {
  MdBedtime,
  MdOutlineAccessTime,
  MdOutlineLightbulb,
  MdOutlineNightlight,
  MdOutlineWbSunny,
} from 'react-icons/md';

// --- REFLECTING THE REFACTOR ---
import { getUserData } from '@/services/goalService';
import { updateRoutineSettings } from '@/services/routineService';
// NEW: Import useNotificationStore to use showToast
import { useNotificationStore } from '@/store/useNotificationStore';

// Import the reusable components
import { DateTimePicker } from '@/components/common/DateTimePicker';
import RoutineCalendar from '@/components/routine/RoutineCalendar';
import RoutineSectionCard from '@/components/routine/RoutineSectionCard';
import NoActiveGoalMessage from '../common/NoActiveGoalMessage';

interface SleepScheduleProps {
  currentUser: User | null;
  appState: AppState | null;
  // REMOVED: showMessage is now handled internally via useNotificationStore, so it's removed from props
  onAppStateUpdate: (newAppState: AppState) => void;
}

const generateUUID = () => crypto.randomUUID();
const IconComponents: { [key: string]: React.ElementType } = {
  MdOutlineWbSunny,
  MdOutlineNightlight,
  MdOutlineAccessTime,
};
const napIcons: string[] = ['MdOutlineAccessTime', 'MdOutlineWbSunny', 'MdOutlineNightlight'];
const sleepTips = [
  "Stick to a regular sleep schedule, even on weekends, to regulate your body's internal clock.",
  "Create a relaxing bedtime routine. A warm bath, reading a book, or listening to calm music can signal to your body that it's time to wind down.",
  'Ensure your bedroom is dark, quiet, and cool. Consider using blackout curtains, earplugs, or a white noise machine.',
  'Avoid large meals, caffeine, and alcohol before bedtime as they can disrupt sleep.',
  'Get some exercise during the day. Regular physical activity can help you fall asleep faster and enjoy deeper sleep.',
];

/**
 * SleepSchedule Component
 * This component has been refactored to use the new dedicated services and contains full implementation.
 */
const SleepSchedule: React.FC<SleepScheduleProps> = ({
  currentUser,
  appState,
  onAppStateUpdate,
}) => {
  const [, setCurrentTime] = useState(new Date());
  const activeGoalId = appState?.activeGoalId;

  // NEW: Access showToast from the global notification store
  const showToast = useNotificationStore(state => state.showToast);

  const activeGoalSleepSettings = useMemo(() => {
    return appState?.goals[activeGoalId || '']?.routineSettings?.sleep;
  }, [appState, activeGoalId]);

  const [bedtime, setBedtime] = useState(activeGoalSleepSettings?.sleepTime || '22:00');
  const [wakeTime, setWakeTime] = useState(activeGoalSleepSettings?.wakeTime || '06:00');
  const [napSchedule, setNapSchedule] = useState<ScheduledRoutineBase[]>(
    activeGoalSleepSettings?.naps || []
  );

  const [isBedtimePickerOpen, setIsBedtimePickerOpen] = useState(false);
  const [isWakeTimePickerOpen, setIsWakeTimePickerOpen] = useState(false);
  const [randomTip, setRandomTip] = useState<string>('');
  const [isRefreshingTip, setIsRefreshingTip] = useState(false);
  const isInitialDebounceMount = useRef(true);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const refreshTip = useCallback(() => {
    setIsRefreshingTip(true);
    setTimeout(() => {
      setRandomTip(sleepTips[Math.floor(Math.random() * sleepTips.length)]);
      setIsRefreshingTip(false);
    }, 500);
  }, []);

  useEffect(() => {
    if (activeGoalSleepSettings) {
      setBedtime(activeGoalSleepSettings.sleepTime);
      setWakeTime(activeGoalSleepSettings.wakeTime);
      setNapSchedule(activeGoalSleepSettings.naps || []);
    } else {
      setBedtime('22:00');
      setWakeTime('06:00');
      setNapSchedule([]);
    }
  }, [activeGoalSleepSettings]);

  useEffect(() => {
    refreshTip();
  }, [refreshTip]);

  const { isSleepTime, timeUntilNextEvent, nextEventLabel, totalSleepDurationMinutes } =
    useMemo(() => {
      const now = new Date(); // Use a fresh `now` for calculation
      let bed = parse(bedtime, 'HH:mm', now);
      let wake = parse(wakeTime, 'HH:mm', now);
      const isOvernight = isAfter(bed, wake);

      if (isOvernight) {
        if (isBefore(now, wake)) {
          bed = addDays(bed, -1);
        } else {
          wake = addDays(wake, 1);
        }
      }

      const isCurrentlySleepTime = isAfter(now, bed) && isBefore(now, wake);

      let nextBedEvent = parse(bedtime, 'HH:mm', now);
      let nextWakeEvent = parse(wakeTime, 'HH:mm', now);

      if (isAfter(nextBedEvent, nextWakeEvent) && isAfter(now, nextWakeEvent)) {
        nextWakeEvent = addDays(nextWakeEvent, 1);
      }
      if (isAfter(now, nextBedEvent)) {
        nextBedEvent = addDays(nextBedEvent, 1);
      }

      const timeToBed = differenceInMinutes(nextBedEvent, now);
      const timeToWake = differenceInMinutes(nextWakeEvent, now);

      let timeUntilNextEventMinutes: number;
      let nextEventDisplayLabel: string;

      if (timeToBed < timeToWake) {
        timeUntilNextEventMinutes = timeToBed;
        nextEventDisplayLabel = 'Bedtime';
      } else {
        timeUntilNextEventMinutes = timeToWake;
        nextEventDisplayLabel = 'Wake Up';
      }

      let totalDuration = differenceInMinutes(wake, bed);
      if (isOvernight && totalDuration < 0) {
        totalDuration += 24 * 60;
      }

      return {
        isSleepTime: isCurrentlySleepTime,
        timeUntilNextEvent: timeUntilNextEventMinutes,
        nextEventLabel: nextEventDisplayLabel,
        totalSleepDurationMinutes: Math.max(0, totalDuration),
      };
    }, [bedtime, wakeTime]);

  const callUpdateRoutineSettings = useCallback(
    async (updatedSleepSettings: SleepRoutineSettings) => {
      if (!currentUser || !activeGoalId || !appState)
        throw new Error('User or goal not available.');
      const currentSettings = appState.goals[activeGoalId]?.routineSettings;
      if (!currentSettings) throw new Error('Routine settings not found.');

      const newSettings = { ...currentSettings, sleep: updatedSleepSettings };
      await updateRoutineSettings(currentUser.uid, activeGoalId, newSettings);
      const newAppState = await getUserData(currentUser.uid);
      onAppStateUpdate(newAppState);
    },
    [appState, currentUser, activeGoalId, onAppStateUpdate]
  );

  const saveMainSleepSettings = useCallback(async () => {
    if (!currentUser || !activeGoalId) {
      showToast('Authentication or active goal required.', 'error'); // Use global showToast
      return;
    }
    const newSettings: SleepRoutineSettings = { sleepTime: bedtime, wakeTime, naps: napSchedule };
    try {
      await callUpdateRoutineSettings(newSettings);
      showToast('Main sleep schedule updated!', 'success'); // Use global showToast
    } catch {
      showToast('Failed to save main sleep settings.', 'error'); // Use global showToast
    }
  }, [
    currentUser,
    activeGoalId,
    bedtime,
    wakeTime,
    napSchedule,
    showToast, // Dependency on global showToast
    callUpdateRoutineSettings,
  ]);

  useEffect(() => {
    if (isInitialDebounceMount.current) {
      isInitialDebounceMount.current = false;
      return;
    }
    const handler = setTimeout(() => saveMainSleepSettings(), 1000);
    return () => clearTimeout(handler);
  }, [bedtime, wakeTime, saveMainSleepSettings]);

  const toggleNapCompletion = useCallback(
    async (index: number) => {
      const updatedNaps = napSchedule.map((nap, i) =>
        i === index
          ? {
              ...nap,
              completed: !nap.completed,
              updatedAt: Timestamp.now(),
              completedAt: !nap.completed ? Timestamp.now() : null,
            }
          : nap
      );
      setNapSchedule(updatedNaps);
      try {
        await callUpdateRoutineSettings({ sleepTime: bedtime, wakeTime, naps: updatedNaps });
        showToast('Nap schedule updated!', 'success'); // Use global showToast
      } catch {
        showToast('Failed to save nap settings.', 'error'); // Use global showToast
        onAppStateUpdate(await getUserData(currentUser!.uid));
      }
    },
    [
      bedtime,
      wakeTime,
      napSchedule,
      showToast, // Dependency on global showToast
      callUpdateRoutineSettings,
      currentUser,
      onAppStateUpdate,
    ]
  );

  const handleSaveNapSchedule = useCallback(
    async (schedule: ScheduledRoutineBase, index: number | null) => {
      let updatedNaps: ScheduledRoutineBase[];
      if (index !== null) {
        updatedNaps = napSchedule.map((n, i) =>
          i === index ? { ...schedule, updatedAt: Timestamp.now() } : n
        );
      } else {
        updatedNaps = [
          ...napSchedule,
          {
            ...schedule,
            id: generateUUID(),
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            completed: false,
            completedAt: null,
          },
        ];
      }
      setNapSchedule(updatedNaps);
      try {
        await callUpdateRoutineSettings({ sleepTime: bedtime, wakeTime, naps: updatedNaps });
        showToast(index !== null ? 'Nap updated!' : 'Nap added!', 'success'); // Use global showToast
      } catch {
        showToast('Failed to save nap schedule.', 'error'); // Use global showToast
        onAppStateUpdate(await getUserData(currentUser!.uid));
      }
    },
    [
      bedtime,
      wakeTime,
      napSchedule,
      showToast, // Dependency on global showToast
      callUpdateRoutineSettings,
      currentUser,
      onAppStateUpdate,
    ]
  );

  const handleRemoveNapSchedule = useCallback(
    async (indexToRemove: number) => {
      const updatedNaps = napSchedule.filter((_, index) => index !== indexToRemove);
      setNapSchedule(updatedNaps);
      try {
        await callUpdateRoutineSettings({ sleepTime: bedtime, wakeTime, naps: updatedNaps });
        showToast('Nap schedule removed.', 'info'); // Use global showToast
      } catch {
        showToast('Failed to remove nap schedule.', 'error'); // Use global showToast
        onAppStateUpdate(await getUserData(currentUser!.uid));
      }
    },
    [
      bedtime,
      wakeTime,
      napSchedule,
      showToast, // Dependency on global showToast
      callUpdateRoutineSettings,
      currentUser,
      onAppStateUpdate,
    ]
  );

  const formatTimeLeft = (minutes: number) => {
    if (minutes < 0) minutes = 0;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h > 0 ? `${h}h ` : ''}${m}m`;
  };

  if (!activeGoalId || !appState?.goals[activeGoalId]) {
    return <NoActiveGoalMessage />;
  }

  return (
    <>
      <div className="mt-8 space-y-16">
        <div className="bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl shadow-2xl">
          <h2 className="flex gap-3 items-center p-6 pb-0 text-2xl font-bold text-white">
            <MdOutlineNightlight size={28} /> Main Sleep Schedule
          </h2>
          <div className="p-6">
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
              <div className="flex flex-col items-center p-4 rounded-xl bg-white/5">
                <label htmlFor="bedtime-picker" className="self-start text-sm text-white/70">
                  Bedtime
                </label>
                <FaMoon className="my-3 text-4xl text-purple-300" />
                <button
                  id="bedtime-picker"
                  onClick={() => setIsBedtimePickerOpen(true)}
                  className="p-2 mt-1 w-full text-2xl font-bold text-center text-white bg-transparent rounded-lg cursor-pointer hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {format(parse(bedtime, 'HH:mm', new Date()), 'HH:mm')}
                </button>
              </div>
              <div className="flex flex-col items-center p-4 rounded-xl bg-white/5">
                <label htmlFor="wake-time-picker" className="self-start text-sm text-white/70">
                  Wake-up Time
                </label>
                <FaSun className="my-3 text-4xl text-orange-300" />
                <button
                  id="wake-time-picker"
                  onClick={() => setIsWakeTimePickerOpen(true)}
                  className="p-2 mt-1 w-full text-2xl font-bold text-center text-white bg-transparent rounded-lg cursor-pointer hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {format(parse(wakeTime, 'HH:mm', new Date()), 'HH:mm')}
                </button>
              </div>
            </div>
            <div className="mt-6 text-center text-white/80">
              Total Sleep Duration:{' '}
              <span className="font-bold text-white">
                {(totalSleepDurationMinutes / 60).toFixed(1)} hours
              </span>
            </div>
          </div>
          <div className="p-6 border-t border-white/10">
            <div className="flex justify-between items-center mb-2">
              <h3 className="flex gap-2 items-center text-lg font-semibold text-white">
                <MdOutlineLightbulb size={20} /> Sleep Insight
              </h3>
              <button
                onClick={refreshTip}
                disabled={isRefreshingTip}
                className="p-2 rounded-full cursor-pointer hover:bg-white/10 disabled:opacity-50"
                title="Get a new tip"
              >
                {isRefreshingTip ? <FiLoader className="animate-spin" /> : <FiRefreshCw />}
              </button>
            </div>
            <p className="text-sm text-white/70">
              {isRefreshingTip ? 'Getting a new tip...' : randomTip}
            </p>
          </div>
        </div>

        <RoutineCalendar
          appState={appState}
          currentUser={currentUser}
          onAppStateUpdate={onAppStateUpdate}
          routineType={RoutineType.SLEEP}
          title="Sleep Log"
          icon={MdOutlineNightlight}
        />

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
          onToggleCompletion={toggleNapCompletion}
          onRemoveSchedule={handleRemoveNapSchedule}
          onSaveSchedule={handleSaveNapSchedule}
          // REMOVED: showToast prop is no longer needed, RoutineSectionCard gets it directly
          newInputLabelPlaceholder="e.g., Afternoon Power Nap"
          newIconOptions={napIcons}
          iconComponentsMap={IconComponents}
        />
      </div>
      <DateTimePicker
        isOpen={isBedtimePickerOpen}
        value={parse(bedtime, 'HH:mm', new Date())}
        onChange={date => {
          if (date) setBedtime(format(date, 'HH:mm'));
        }}
        onClose={() => setIsBedtimePickerOpen(false)}
        mode="time"
      />
      <DateTimePicker
        isOpen={isWakeTimePickerOpen}
        value={parse(wakeTime, 'HH:mm', new Date())}
        onChange={date => {
          if (date) setWakeTime(format(date, 'HH:mm'));
        }}
        onClose={() => setIsWakeTimePickerOpen(false)}
        mode="time"
      />
    </>
  );
};

export default SleepSchedule;
