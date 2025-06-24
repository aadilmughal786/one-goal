// app/components/dashboard/RoutineTimeline.tsx
'use client';

import { useGoalStore } from '@/store/useGoalStore';
import { RoutineType, ScheduledRoutineBase } from '@/types';
import { addMinutes, differenceInMinutes, isWithinInterval, parse } from 'date-fns';
import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import { IconType } from 'react-icons';
import { FaTooth } from 'react-icons/fa6';
import { FiClock, FiZap } from 'react-icons/fi';
import {
  MdBedtime,
  MdOutlineDirectionsRun,
  MdOutlineNightlight,
  MdOutlineRestaurant,
  MdOutlineShower,
  MdOutlineWaterDrop,
} from 'react-icons/md';

// FIX: Corrected icon mapping for consistency.
const routineIcons: Record<RoutineType, IconType> = {
  [RoutineType.SLEEP]: MdBedtime,
  [RoutineType.BATH]: MdOutlineShower,
  [RoutineType.EXERCISE]: MdOutlineDirectionsRun,
  [RoutineType.MEAL]: MdOutlineRestaurant,
  [RoutineType.TEETH]: FaTooth, // Corrected icon
  [RoutineType.WATER]: MdOutlineWaterDrop,
};

type TimelineItem = ScheduledRoutineBase & {
  type: RoutineType;
  minutesUntil?: number;
  isCurrent?: boolean;
  isPast?: boolean;
};

const RoutineTimeline: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // FIX: Get activeGoal directly from the store.
  const activeGoal = useGoalStore(state =>
    state.appState?.activeGoalId ? state.appState.goals[state.appState.activeGoalId] : null
  );

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const allEvents = useMemo(() => {
    if (!activeGoal?.routineSettings) {
      return [];
    }

    const now = currentTime;
    const allSchedules: TimelineItem[] = [];
    const { routineSettings } = activeGoal;

    (routineSettings.bath || []).forEach(item =>
      allSchedules.push({ ...item, type: RoutineType.BATH })
    );
    (routineSettings.exercise || []).forEach(item =>
      allSchedules.push({ ...item, type: RoutineType.EXERCISE })
    );
    (routineSettings.meal || []).forEach(item =>
      allSchedules.push({ ...item, type: RoutineType.MEAL })
    );
    (routineSettings.teeth || []).forEach(item =>
      allSchedules.push({ ...item, type: RoutineType.TEETH })
    );
    (routineSettings.sleep?.naps || []).forEach(item =>
      allSchedules.push({ ...item, type: RoutineType.SLEEP })
    );

    const relevantEvents: TimelineItem[] = [];

    allSchedules.forEach(item => {
      if (item.completed) return;
      const startTime = parse(item.time, 'HH:mm', now);
      const endTime = addMinutes(startTime, item.duration);

      if (isWithinInterval(now, { start: startTime, end: endTime })) {
        relevantEvents.push({ ...item, isCurrent: true, isPast: false });
        return;
      }

      if (now > endTime) {
        relevantEvents.push({ ...item, isCurrent: false, isPast: true });
        return;
      }

      const minutesUntilStart = differenceInMinutes(startTime, now);
      if (minutesUntilStart > 0 && minutesUntilStart <= 60) {
        relevantEvents.push({
          ...item,
          minutesUntil: minutesUntilStart,
          isCurrent: false,
          isPast: false,
        });
      }
    });

    relevantEvents.sort((a, b) => {
      if (a.isCurrent && !b.isCurrent) return -1;
      if (!a.isCurrent && b.isCurrent) return 1;
      if (a.isPast && !b.isPast) return 1;
      if (!a.isPast && b.isPast) return -1;
      return (a.minutesUntil || 0) - (b.minutesUntil || 0);
    });

    return relevantEvents;
  }, [activeGoal, currentTime]);

  const renderEventItem = (item: TimelineItem) => {
    const Icon = routineIcons[item.type] || MdOutlineNightlight;
    const timeLeft = item.minutesUntil ? `in ${item.minutesUntil}m` : '';
    let statusColor = '';
    let statusIcon: React.ReactNode = null;
    let statusText = '';

    if (item.isCurrent) {
      statusColor = 'text-green-400';
      statusIcon = <FiZap />;
      statusText = 'Now';
    } else if (item.isPast) {
      statusColor = 'text-red-400';
      statusIcon = <FiClock />;
      statusText = 'Missed';
    } else {
      statusColor = 'text-amber-400';
      statusIcon = <FiClock />;
      statusText = timeLeft;
    }

    return (
      <div
        key={`${item.type}-${item.label}-${item.time}`}
        className="flex gap-4 items-center p-3 rounded-lg bg-white/5"
      >
        <div
          className={`flex flex-shrink-0 justify-center items-center w-10 h-10 rounded-full bg-white/10 ${statusColor}`}
        >
          <Icon size={22} />
        </div>
        <div className="flex-grow">
          <p className="font-semibold text-white">{item.label}</p>
          <p className="text-sm text-white/70">
            {item.time} for {item.duration} min
          </p>
        </div>
        <div
          className={`flex-shrink-0 flex items-center gap-1.5 text-sm font-medium ${statusColor}`}
        >
          {statusIcon}
          <span>{statusText}</span>
        </div>
      </div>
    );
  };

  if (!activeGoal) {
    return (
      <div className="p-6 sm:p-8 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl shadow-2xl text-center text-white/60">
        <FiClock className="mx-auto mb-4 text-4xl" />
        <h3 className="mb-2 text-2xl font-bold">No Active Goal</h3>
        <p className="mx-auto max-w-2xl">
          Please select an active goal to see your routine timeline.
        </p>
        <Link href="/goal" className="inline-block mt-4 text-sm text-blue-400 hover:underline">
          Go to Goal Page
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl shadow-2xl">
      <div className="mb-6 text-center">
        <h3 className="mb-2 text-2xl font-bold">Today&apos;s Routine Timeline</h3>
        <p className="mx-auto max-w-2xl text-white/60">
          A unified view of what&apos;s happening now and what&apos;s coming up next in your
          schedule.
        </p>
      </div>

      <div className="space-y-3">
        {allEvents.length > 0 ? (
          allEvents.map(item => renderEventItem(item))
        ) : (
          <div className="py-8 text-center text-white/50">
            <p className="text-lg">All clear for now!</p>
            <p className="mt-1 text-sm">No routines are active, upcoming, or missed today.</p>
            <Link
              href="/routine"
              className="inline-block mt-4 text-sm text-blue-400 hover:underline"
            >
              Plan your day
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoutineTimeline;
