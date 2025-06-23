// app/components/routine/SleepSchedule.tsx
'use client';

import { DateTimePicker } from '@/components/common/DateTimePicker';
import NoActiveGoalMessage from '@/components/common/NoActiveGoalMessage';
import RoutineCalendar from '@/components/routine/RoutineCalendar';
import RoutineSectionCard from '@/components/routine/RoutineSectionCard';
// --- REFACTOR: Import the global Zustand stores ---
import { useGoalStore } from '@/store/useGoalStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { RoutineType, ScheduledRoutineBase, SleepRoutineSettings } from '@/types';
import { addDays, differenceInMinutes, format, isAfter, isBefore, parse } from 'date-fns';
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
const SleepSchedule: React.FC = () => {
  // --- REFACTOR: Get all necessary state and actions from the stores ---
  const { appState, updateRoutineSettings } = useGoalStore(state => ({
    currentUser: state.currentUser,
    appState: state.appState,
    updateRoutineSettings: state.updateRoutineSettings,
  }));
  const showToast = useNotificationStore(state => state.showToast);

  const activeGoal = appState?.goals[appState?.activeGoalId || ''];

  const [bedtime, setBedtime] = useState('22:00');
  const [wakeTime, setWakeTime] = useState('06:00');
  const [napSchedule, setNapSchedule] = useState<ScheduledRoutineBase[]>([]);
  const [, setCurrentTime] = useState(new Date());
  const [isBedtimePickerOpen, setIsBedtimePickerOpen] = useState(false);
  const [isWakeTimePickerOpen, setIsWakeTimePickerOpen] = useState(false);
  const [randomTip, setRandomTip] = useState('');
  const [isRefreshingTip, setIsRefreshingTip] = useState(false);
  const isInitialDebounceMount = useRef(true);

  useEffect(() => {
    if (activeGoal?.routineSettings?.sleep) {
      const { sleepTime, wakeTime, naps } = activeGoal.routineSettings.sleep;
      setBedtime(sleepTime);
      setWakeTime(wakeTime);
      setNapSchedule(naps || []);
    } else {
      setBedtime('22:00');
      setWakeTime('06:00');
      setNapSchedule([]);
    }
  }, [activeGoal]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const { isSleepTime, timeUntilNextEvent, nextEventLabel, totalSleepDurationMinutes } =
    useMemo(() => {
      const now = new Date();
      let bed = parse(bedtime, 'HH:mm', now);
      let wake = parse(wakeTime, 'HH:mm', now);
      const isOvernight = isAfter(bed, wake);
      if (isOvernight) {
        if (isBefore(now, wake)) bed = addDays(bed, -1);
        else wake = addDays(wake, 1);
      }
      const isCurrentlySleepTime = isAfter(now, bed) && isBefore(now, wake);
      let nextBedEvent = parse(bedtime, 'HH:mm', now);
      if (isAfter(now, nextBedEvent)) nextBedEvent = addDays(nextBedEvent, 1);
      let nextWakeEvent = parse(wakeTime, 'HH:mm', now);
      if (isAfter(nextBedEvent, nextWakeEvent) && isAfter(now, nextWakeEvent)) {
        nextWakeEvent = addDays(nextWakeEvent, 1);
      } else if (isAfter(now, nextWakeEvent)) {
        nextWakeEvent = addDays(nextWakeEvent, 1);
      }
      const timeToBed = differenceInMinutes(nextBedEvent, now);
      const timeToWake = differenceInMinutes(nextWakeEvent, now);
      const timeUntilNextEventMinutes = timeToBed < timeToWake ? timeToBed : timeToWake;
      const nextEventDisplayLabel = timeToBed < timeToWake ? 'Bedtime' : 'Wake Up';
      const totalDuration = Math.max(0, differenceInMinutes(wake, bed));
      return {
        isSleepTime: isCurrentlySleepTime,
        timeUntilNextEvent: timeUntilNextEventMinutes,
        nextEventLabel: nextEventDisplayLabel,
        totalSleepDurationMinutes: totalDuration,
      };
    }, [bedtime, wakeTime]);

  const refreshTip = useCallback(() => {
    setIsRefreshingTip(true);
    setTimeout(() => {
      setRandomTip(sleepTips[Math.floor(Math.random() * sleepTips.length)]);
      setIsRefreshingTip(false);
    }, 500);
  }, []);

  useEffect(() => {
    refreshTip();
  }, [refreshTip]);

  const saveMainSleepSettings = useCallback(async () => {
    if (!activeGoal) return;
    const newSleepSettings: SleepRoutineSettings = {
      sleepTime: bedtime,
      wakeTime,
      naps: napSchedule,
    };
    const newSettings = { ...activeGoal.routineSettings, sleep: newSleepSettings };
    try {
      await updateRoutineSettings(newSettings);
    } catch (error) {
      showToast('Failed to save sleep settings.', 'error');
      console.error(error);
    }
  }, [activeGoal, bedtime, wakeTime, napSchedule, updateRoutineSettings, showToast]);

  useEffect(() => {
    if (isInitialDebounceMount.current) {
      isInitialDebounceMount.current = false;
      return;
    }
    const handler = setTimeout(() => saveMainSleepSettings(), 1000);
    return () => clearTimeout(handler);
  }, [bedtime, wakeTime, saveMainSleepSettings]);

  const updateNapSchedules = useCallback(
    async (updatedNaps: ScheduledRoutineBase[], successMessage: string) => {
      if (!activeGoal) return;
      // FIX: Explicitly create the new SleepRoutineSettings object to ensure type safety.
      const newSleepSettings: SleepRoutineSettings = {
        sleepTime: bedtime,
        wakeTime: wakeTime,
        naps: updatedNaps,
      };
      const newSettings = { ...activeGoal.routineSettings, sleep: newSleepSettings };
      try {
        await updateRoutineSettings(newSettings);
        showToast(successMessage, 'success');
      } catch (error) {
        console.error('Failed to update nap schedule:', error);
      }
    },
    [activeGoal, bedtime, wakeTime, updateRoutineSettings, showToast]
  );

  const toggleNapCompletion = useCallback(
    async (index: number) => {
      const updatedNaps = napSchedule.map((nap, i) =>
        i === index
          ? {
              ...nap,
              completed: !nap.completed,
              completedAt: !nap.completed ? Timestamp.now() : null,
            }
          : nap
      );
      setNapSchedule(updatedNaps);
      await updateNapSchedules(updatedNaps, 'Nap schedule updated!');
    },
    [napSchedule, updateNapSchedules]
  );

  const handleSaveNapSchedule = useCallback(
    async (schedule: ScheduledRoutineBase, index: number | null) => {
      let updatedNaps: ScheduledRoutineBase[];
      const message = index !== null ? 'Nap updated!' : 'Nap added!';
      if (index !== null) {
        updatedNaps = napSchedule.map((n, i) => (i === index ? schedule : n));
      } else {
        updatedNaps = [...napSchedule, schedule];
      }
      setNapSchedule(updatedNaps);
      await updateNapSchedules(updatedNaps, message);
    },
    [napSchedule, updateNapSchedules]
  );

  const handleRemoveNapSchedule = useCallback(
    async (indexToRemove: number) => {
      const updatedNaps = napSchedule.filter((_, index) => index !== indexToRemove);
      setNapSchedule(updatedNaps);
      await updateNapSchedules(updatedNaps, 'Nap schedule removed.');
    },
    [napSchedule, updateNapSchedules]
  );

  const formatTimeLeft = (minutes: number) => {
    if (minutes < 0) minutes = 0;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h > 0 ? `${h}h ` : ''}${m}m`;
  };

  if (!activeGoal) {
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
                  {bedtime}
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
                  {wakeTime}
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
