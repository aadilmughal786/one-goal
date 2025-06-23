// app/components/dashboard/DashboardMain.tsx
'use client';

import { DailyProgress } from '@/types';
import { format } from 'date-fns';
import Link from 'next/link';
import React, { useMemo } from 'react';
import { FiTarget } from 'react-icons/fi';
import { MdRocketLaunch } from 'react-icons/md';

// Import the global store to get data directly
import { useGoalStore } from '@/store/useGoalStore';

import CountdownCard from '@/components/dashboard/CountdownCard';
import DailyProgressModal from '@/components/dashboard/DailyProgressModal';
import ProgressCalendar from '@/components/dashboard/ProgressCalendar';
import RoutineTimeline from '@/components/dashboard/RoutineTimeline';

// The props are simplified as this component now fetches its own data.
interface DashboardMainProps {
  isDailyProgressModalOpen: boolean;
  selectedDate: Date | null;
  handleDayClick: (date: Date) => void;
  handleSaveProgress: (progressData: Partial<DailyProgress>) => Promise<void>;
  setIsDailyProgressModalOpen: (isOpen: boolean) => void;
}

const DashboardMain: React.FC<DashboardMainProps> = ({
  isDailyProgressModalOpen,
  selectedDate,
  handleDayClick,
  handleSaveProgress,
  setIsDailyProgressModalOpen,
}) => {
  // Get appState directly from the Zustand store.
  const appState = useGoalStore(state => state.appState);

  const activeGoal = useMemo(() => {
    if (!appState?.activeGoalId || !appState.goals) return null;
    return appState.goals[appState.activeGoalId];
  }, [appState]);

  const initialProgress = useMemo(() => {
    return selectedDate && activeGoal
      ? activeGoal.dailyProgress[format(selectedDate, 'yyyy-MM-dd')] || null
      : null;
  }, [selectedDate, activeGoal]);

  if (!activeGoal) {
    return (
      <div className="space-y-12">
        <section>
          <div className="p-10 text-center bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg">
            <MdRocketLaunch className="mx-auto mb-6 w-20 h-20 text-white/70" />
            <h2 className="mb-4 text-3xl font-bold text-white">Start Your Journey</h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-white/70">
              Define your primary objective by heading over to the Goals page.
            </p>
            <Link
              href="/goal" // Link directly to the goal management page
              className="inline-flex gap-3 items-center px-8 py-4 font-semibold text-black bg-white rounded-full transition-all duration-200 cursor-pointer group hover:bg-white/90 hover:scale-105"
            >
              <FiTarget size={20} />
              Go to Goals
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <section>
        <div className="mb-8 text-center">
          <h3 className="mb-2 text-2xl font-bold">Your Mission Control</h3>
          <p className="mx-auto max-w-2xl text-white/60">
            This is your command center. Monitor your progress, track your time, and stay focused on
            the one thing that matters most right now.
          </p>
        </div>
        <CountdownCard goal={activeGoal} />
      </section>

      <section>
        <RoutineTimeline appState={appState} />
      </section>

      <section>
        <div className="mb-8 text-center">
          <h3 className="mb-2 text-2xl font-bold">Progress Calendar</h3>
          <p className="mx-auto max-w-2xl text-white/60">
            Visualize your daily satisfaction and log today&apos;s progress with a single click.
          </p>
        </div>
        <ProgressCalendar
          goal={activeGoal}
          dailyProgress={activeGoal.dailyProgress}
          onDayClick={handleDayClick}
        />
      </section>

      {selectedDate && (
        <DailyProgressModal
          isOpen={isDailyProgressModalOpen}
          onClose={() => setIsDailyProgressModalOpen(false)}
          date={selectedDate}
          initialProgress={initialProgress}
          onSave={handleSaveProgress}
        />
      )}
    </div>
  );
};

export default DashboardMain;
