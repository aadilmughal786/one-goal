// app/components/routine/SleepSchedule.tsx
'use client';

import { DateTimePicker } from '@/components/common/DateTimePicker';
import NoActiveGoalMessage from '@/components/common/NoActiveGoalMessage';
import RoutineCalendar from '@/components/routine/RoutineCalendar';
import RoutineSectionCard from '@/components/routine/RoutineSectionCard';
import { useGoalStore } from '@/store/useGoalStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { RoutineType, ScheduledRoutineBase, SleepRoutineSettings } from '@/types';
import { addDays, differenceInMinutes, format, isAfter, isBefore, parse } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

const SleepSchedule: React.FC = () => {
  const activeGoal = useGoalStore(state =>
    state.appState?.activeGoalId ? state.appState.goals[state.appState.activeGoalId] : null
  );
  const updateRoutineSettings = useGoalStore(state => state.updateRoutineSettings);
  const showToast = useNotificationStore(state => state.showToast);

  const sleepSettings = activeGoal?.routineSettings?.sleep;
  const bedtime = sleepSettings?.sleepTime || '22:00';
  const wakeTime = sleepSettings?.wakeTime || '06:00';

  const napSchedule = useMemo(() => sleepSettings?.naps || [], [sleepSettings?.naps]);

  const [isBedtimePickerOpen, setIsBedtimePickerOpen] = useState(false);
  const [isWakeTimePickerOpen, setIsWakeTimePickerOpen] = useState(false);
  const [randomTip, setRandomTip] = useState('');
  const [isRefreshingTip, setIsRefreshingTip] = useState(false);
  const [, setCurrentTime] = useState(new Date());

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

  const handleTimeChange = async (type: 'bedtime' | 'wakeTime', newTime: string | null) => {
    if (!activeGoal || !newTime) return;

    const newSleepSettings: SleepRoutineSettings = {
      ...activeGoal.routineSettings.sleep!,
      [type === 'bedtime' ? 'sleepTime' : 'wakeTime']: newTime,
    };
    const newSettings = { ...activeGoal.routineSettings, sleep: newSleepSettings };
    await updateRoutineSettings(newSettings);
  };

  const updateNapSchedules = useCallback(
    async (updatedNaps: ScheduledRoutineBase[], successMessage: string) => {
      if (!activeGoal) return;
      const newSleepSettings: SleepRoutineSettings = {
        ...activeGoal.routineSettings.sleep!,
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
    [activeGoal, updateRoutineSettings, showToast]
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
      await updateNapSchedules(updatedNaps, message);
    },
    [napSchedule, updateNapSchedules]
  );

  const handleRemoveNapSchedule = useCallback(
    async (indexToRemove: number) => {
      const updatedNaps = napSchedule.filter((_, index) => index !== indexToRemove);
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
        <div className="overflow-hidden rounded-3xl border shadow-2xl bg-bg-secondary border-border-primary">
          <div className="p-6">
            <h2 className="flex gap-3 items-center text-2xl font-bold text-text-primary">
              <MdOutlineNightlight size={28} /> Main Sleep Schedule
            </h2>
          </div>
          <div className="border-t border-border-primary"></div>
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
              <div className="flex flex-col items-center p-4 rounded-xl bg-bg-tertiary">
                <label htmlFor="bedtime-picker" className="self-start text-sm text-text-secondary">
                  Bedtime
                </label>
                <FaMoon className="my-3 text-4xl text-purple-300" />
                <button
                  id="bedtime-picker"
                  onClick={() => setIsBedtimePickerOpen(true)}
                  className="p-2 mt-1 w-full text-2xl font-bold text-center bg-transparent rounded-lg cursor-pointer text-text-primary hover:bg-bg-secondary focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {bedtime}
                </button>
              </div>
              <div className="flex flex-col items-center p-4 rounded-xl bg-bg-tertiary">
                <label
                  htmlFor="wake-time-picker"
                  className="self-start text-sm text-text-secondary"
                >
                  Wake-up Time
                </label>
                <FaSun className="my-3 text-4xl text-orange-300" />
                <button
                  id="wake-time-picker"
                  onClick={() => setIsWakeTimePickerOpen(true)}
                  className="p-2 mt-1 w-full text-2xl font-bold text-center bg-transparent rounded-lg cursor-pointer text-text-primary hover:bg-bg-secondary focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {wakeTime}
                </button>
              </div>
            </div>
            <div className="mt-6 text-center text-text-secondary">
              Total Sleep Duration:{' '}
              <span className="font-bold text-text-primary">
                {(totalSleepDurationMinutes / 60).toFixed(1)} hours
              </span>
            </div>
          </div>
          <div className="border-t border-border-primary"></div>
          <div className="p-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="flex gap-2 items-center text-lg font-semibold text-text-primary">
                <MdOutlineLightbulb size={20} /> Sleep Insight
              </h3>
              <button
                onClick={refreshTip}
                disabled={isRefreshingTip}
                className="p-2 rounded-full cursor-pointer text-text-tertiary hover:bg-bg-tertiary disabled:opacity-50"
                title="Get a new tip"
              >
                {isRefreshingTip ? <FiLoader className="animate-spin" /> : <FiRefreshCw />}
              </button>
            </div>
            <p className="text-sm text-text-secondary">
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
        onChange={date => handleTimeChange('bedtime', date ? format(date, 'HH:mm') : null)}
        onClose={() => setIsBedtimePickerOpen(false)}
        mode="time"
      />
      <DateTimePicker
        isOpen={isWakeTimePickerOpen}
        value={parse(wakeTime, 'HH:mm', new Date())}
        onChange={date => handleTimeChange('wakeTime', date ? format(date, 'HH:mm') : null)}
        onClose={() => setIsWakeTimePickerOpen(false)}
        mode="time"
      />
    </>
  );
};

export default SleepSchedule;
