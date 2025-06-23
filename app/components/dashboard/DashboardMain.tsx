// app/components/dashboard/DashboardMain.tsx
'use client';

import { DailyProgress } from '@/types';
import { format } from 'date-fns';
import React, { useMemo } from 'react';

// REFACTOR: Import the common 'No Active Goal' component
import NoActiveGoalMessage from '@/components/common/NoActiveGoalMessage';
import { useGoalStore } from '@/store/useGoalStore';

import CountdownCard from '@/components/dashboard/CountdownCard';
import DailyProgressModal from '@/components/dashboard/DailyProgressModal';
import ProgressCalendar from '@/components/dashboard/ProgressCalendar';
import RoutineTimeline from '@/components/dashboard/RoutineTimeline';

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

  // FIX: Use the common NoActiveGoalMessage component for consistency.
  if (!activeGoal) {
    return <NoActiveGoalMessage />;
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
