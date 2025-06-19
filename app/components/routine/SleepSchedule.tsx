// app/components/routine/SleepSchedule.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MdOutlineWbSunny,
  MdOutlineNightlight,
  MdOutlineAccessTime,
  MdBedtime,
  MdOutlineLightbulb,
} from 'react-icons/md';
import { FaMoon, FaSun } from 'react-icons/fa';
import { FiRefreshCw, FiLoader } from 'react-icons/fi';
import { parse, differenceInMinutes, format, isAfter, isBefore, addDays } from 'date-fns';
import { AppState, RoutineType, SleepRoutineSettings, ScheduledRoutineBase } from '@/types';
import { firebaseService } from '@/services/firebaseService';
import { User } from 'firebase/auth';

// Import the reusable components
import RoutineSectionCard from '@/components/routine/RoutineSectionCard';
import RoutineCalendar from '@/components/routine/RoutineCalendar';
import { DateTimePicker } from '@/components/common/DateTimePicker';

interface SleepScheduleProps {
  currentUser: User | null;
  appState: AppState | null;
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
  onAppStateUpdate: (newAppState: AppState) => void;
}

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

const SleepSchedule: React.FC<SleepScheduleProps> = ({
  currentUser,
  appState,
  showMessage,
  onAppStateUpdate,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const initialSettings = appState?.routineSettings?.sleep;

  const [bedtime, setBedtime] = useState(initialSettings?.bedtime || '22:00');
  const [wakeTime, setWakeTime] = useState(initialSettings?.wakeTime || '06:00');
  const [napSchedule, setNapSchedule] = useState<ScheduledRoutineBase[]>(
    initialSettings?.napSchedule || []
  );

  const [isBedtimePickerOpen, setIsBedtimePickerOpen] = useState(false);
  const [isWakeTimePickerOpen, setIsWakeTimePickerOpen] = useState(false);
  const [randomTip, setRandomTip] = useState<string>('');
  const [isRefreshingTip, setIsRefreshingTip] = useState(false);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Set initial state from props and select random tips
  useEffect(() => {
    const sleepSettings = appState?.routineSettings?.sleep;
    if (sleepSettings) {
      setBedtime(sleepSettings.bedtime);
      setWakeTime(sleepSettings.wakeTime);
      setNapSchedule(sleepSettings.napSchedule || []);
    }
    refreshTip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState]);

  const refreshTip = useCallback(() => {
    setIsRefreshingTip(true);
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * sleepTips.length);
      setRandomTip(sleepTips[randomIndex]);
      setIsRefreshingTip(false);
    }, 500); // 500ms fake delay
  }, []);

  const { isSleepTime, timeUntilNextEvent, nextEventLabel, totalSleepDurationMinutes } =
    useMemo(() => {
      const now = currentTime;
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

      const nextBedEvent = parse(bedtime, 'HH:mm', now);
      let nextWakeEvent = parse(wakeTime, 'HH:mm', now);

      if (isAfter(nextBedEvent, nextWakeEvent)) {
        if (isBefore(now, nextWakeEvent)) {
          // It's early morning, do nothing
        } else {
          nextWakeEvent = addDays(nextWakeEvent, 1);
        }
      }

      let timeUntilNextEvent;
      let nextEventLabel;

      const timeToBed = differenceInMinutes(nextBedEvent, now);
      const timeToWake = differenceInMinutes(nextWakeEvent, now);

      if (isAfter(nextBedEvent, now) && (timeToBed < timeToWake || timeToWake < 0)) {
        timeUntilNextEvent = timeToBed;
        nextEventLabel = 'Bedtime';
      } else if (isAfter(nextWakeEvent, now)) {
        timeUntilNextEvent = timeToWake;
        nextEventLabel = 'Wake Up';
      } else {
        timeUntilNextEvent = differenceInMinutes(addDays(nextBedEvent, 1), now);
        nextEventLabel = 'Bedtime';
      }

      const totalDuration = differenceInMinutes(wake, bed);

      return {
        isSleepTime: isCurrentlySleepTime,
        timeUntilNextEvent,
        nextEventLabel,
        totalSleepDurationMinutes: totalDuration,
      };
    }, [currentTime, bedtime, wakeTime]);

  const saveMainSleepSettings = useCallback(async () => {
    if (!currentUser) return;
    const newSettings: SleepRoutineSettings = {
      bedtime,
      wakeTime,
      napSchedule,
    };
    try {
      await firebaseService.updateSleepRoutineSettings(currentUser.uid, newSettings);
    } catch {
      showMessage('Failed to save sleep settings.', 'error');
    }
  }, [currentUser, bedtime, wakeTime, napSchedule, showMessage]);

  useEffect(() => {
    const handler = setTimeout(() => {
      saveMainSleepSettings();
    }, 1000);
    return () => clearTimeout(handler);
  }, [bedtime, wakeTime, saveMainSleepSettings]);

  const handleSaveNapSchedule = useCallback(
    async (schedule: ScheduledRoutineBase, index: number | null) => {
      if (!currentUser) return;
      const updatedNaps = [...napSchedule];
      if (index !== null) {
        updatedNaps[index] = schedule;
      } else {
        updatedNaps.push(schedule);
      }
      setNapSchedule(updatedNaps);

      const newSettings: SleepRoutineSettings = {
        bedtime,
        wakeTime,
        napSchedule: updatedNaps,
      };
      try {
        await firebaseService.updateSleepRoutineSettings(currentUser.uid, newSettings);
        showMessage(index !== null ? 'Nap updated!' : 'Nap added!', 'success');
      } catch {
        showMessage('Failed to save nap schedule.', 'error');
      }
    },
    [currentUser, napSchedule, bedtime, wakeTime, showMessage]
  );

  const handleRemoveNapSchedule = useCallback(
    async (indexToRemove: number) => {
      if (!currentUser) return;
      const updatedNaps = napSchedule.filter((_, index) => index !== indexToRemove);
      setNapSchedule(updatedNaps);
      const newSettings: SleepRoutineSettings = {
        bedtime,
        wakeTime,
        napSchedule: updatedNaps,
      };
      try {
        await firebaseService.updateSleepRoutineSettings(currentUser.uid, newSettings);
        showMessage('Nap schedule removed.', 'info');
      } catch {
        showMessage('Failed to remove nap schedule.', 'error');
      }
    },
    [currentUser, napSchedule, bedtime, wakeTime, showMessage]
  );

  const formatTimeLeft = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h > 0 ? `${h}h ` : ''}${m}m`;
  };

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
              <div className="flex flex-col items-center p-4 rounded-xl bg-white/5">
                <label className="self-start text-sm text-white/70">Bedtime</label>
                <FaMoon className="my-3 text-4xl text-purple-300" />
                <button
                  onClick={() => setIsBedtimePickerOpen(true)}
                  className="p-2 mt-1 w-full text-2xl font-bold text-center text-white bg-transparent rounded-lg cursor-pointer hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {format(parse(bedtime, 'HH:mm', new Date()), 'h:mm a')}
                </button>
              </div>
              <div className="flex flex-col items-center p-4 rounded-xl bg-white/5">
                <label className="self-start text-sm text-white/70">Wake-up Time</label>
                <FaSun className="my-3 text-4xl text-orange-300" />
                <button
                  onClick={() => setIsWakeTimePickerOpen(true)}
                  className="p-2 mt-1 w-full text-2xl font-bold text-center text-white bg-transparent rounded-lg cursor-pointer hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {format(parse(wakeTime, 'HH:mm', new Date()), 'h:mm a')}
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
          onToggleCompletion={() => {}}
          onRemoveSchedule={handleRemoveNapSchedule}
          onSaveSchedule={handleSaveNapSchedule}
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
            showMessage('Bedtime updated!', 'info');
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
            showMessage('Wake-up time updated!', 'info');
          }
        }}
        onClose={() => setIsWakeTimePickerOpen(false)}
        mode="time"
      />
    </>
  );
};

export default SleepSchedule;
