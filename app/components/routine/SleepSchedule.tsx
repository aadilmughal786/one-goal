// app/components/routine/SleepSchedule.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MdOutlineWbSunny,
  MdOutlineNightlight,
  MdOutlineAccessTime,
  MdOutlineNotificationsActive,
} from 'react-icons/md';
import { parse, differenceInMinutes, addMinutes, format } from 'date-fns';
import { AppState, RoutineType, SleepRoutineSettings, ScheduledRoutineBase } from '@/types';
import { firebaseService } from '@/services/firebaseService';
import { User } from 'firebase/auth';

// Import the reusable components
import RoutineSectionCard from '@/components/routine/RoutineSectionCard';
import RoutineCalendar from '@/components/routine/RoutineCalendar'; // The new generic calendar
import { DateTimePicker } from '@/components/common/DateTimePicker'; // Import the custom picker

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

  // State for controlling the time pickers
  const [isBedtimePickerOpen, setIsBedtimePickerOpen] = useState(false);
  const [isWakeTimePickerOpen, setIsWakeTimePickerOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const sleepSettings = appState?.routineSettings?.sleep;
    if (sleepSettings) {
      setBedtime(sleepSettings.bedtime);
      setWakeTime(sleepSettings.wakeTime);
      setNapSchedule(sleepSettings.napSchedule || []);
    }
  }, [appState]);

  const timeUntilBedtime = useMemo(() => {
    const now = currentTime;
    const target = parse(bedtime, 'HH:mm', now);
    return differenceInMinutes(target > now ? target : addMinutes(target, 24 * 60), now);
  }, [bedtime, currentTime]);

  const timeUntilWakeTime = useMemo(() => {
    const now = currentTime;
    const target = parse(wakeTime, 'HH:mm', now);
    return differenceInMinutes(target > now ? target : addMinutes(target, 24 * 60), now);
  }, [wakeTime, currentTime]);

  const totalSleepDurationMinutes = useMemo(() => {
    const bed = parse(bedtime, 'HH:mm', new Date());
    const wake = parse(wakeTime, 'HH:mm', new Date());
    return differenceInMinutes(wake > bed ? wake : addMinutes(wake, 24 * 60), bed);
  }, [bedtime, wakeTime]);

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

  return (
    <>
      <div className="space-y-8">
        {/* Main Sleep Settings Card */}
        <div className="p-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl shadow-2xl">
          <h2 className="flex gap-3 items-center mb-6 text-2xl font-bold text-white">
            <MdOutlineNightlight size={28} />
            Main Sleep Schedule ({(totalSleepDurationMinutes / 60).toFixed(1)} hours)
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="p-4 rounded-xl bg-white/5">
              <label className="text-sm text-white/70">Bedtime</label>
              <button
                onClick={() => setIsBedtimePickerOpen(true)}
                className="p-2 mt-1 w-full text-2xl font-bold text-left text-white bg-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {format(parse(bedtime, 'HH:mm', new Date()), 'h:mm a')}
              </button>
              <p className="mt-2 text-xs text-purple-300">
                In {Math.floor(timeUntilBedtime / 60)}h {timeUntilBedtime % 60}m
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/5">
              <label className="text-sm text-white/70">Wake-up Time</label>
              <button
                onClick={() => setIsWakeTimePickerOpen(true)}
                className="p-2 mt-1 w-full text-2xl font-bold text-left text-white bg-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {format(parse(wakeTime, 'HH:mm', new Date()), 'h:mm a')}
              </button>
              <p className="mt-2 text-xs text-orange-300">
                In {Math.floor(timeUntilWakeTime / 60)}h {timeUntilWakeTime % 60}m
              </p>
            </div>
          </div>
          <div className="flex gap-2 items-start p-4 mt-6 rounded-lg bg-blue-500/10">
            <MdOutlineNotificationsActive size={24} className="mt-1 text-blue-300" />
            <p className="text-sm text-blue-200">
              Your body thrives on consistency. Try to stick to this schedule, even on weekends, to
              regulate your internal clock.
            </p>
          </div>
        </div>

        {/* Nap Schedule Card using RoutineSectionCard */}
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

        <RoutineCalendar
          appState={appState}
          currentUser={currentUser}
          showMessage={showMessage}
          onAppStateUpdate={onAppStateUpdate}
          routineType={RoutineType.SLEEP}
          title="Sleep Log"
          icon={MdOutlineNightlight}
        />
      </div>

      {/* Bedtime Picker Modal */}
      <DateTimePicker
        isOpen={isBedtimePickerOpen}
        value={parse(bedtime, 'HH:mm', new Date())}
        onChange={date => {
          if (date) setBedtime(format(date, 'HH:mm'));
        }}
        onClose={() => setIsBedtimePickerOpen(false)}
        mode="time"
      />

      {/* Wake-up Time Picker Modal */}
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
