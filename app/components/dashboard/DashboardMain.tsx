// app/components/dashboard/DashboardMain.tsx
'use client';

import NoActiveGoalMessage from '@/components/common/NoActiveGoalMessage';
import CountdownCard from '@/components/dashboard/CountdownCard';
import ProgressCalendar from '@/components/dashboard/ProgressCalendar';
import { useGoalStore } from '@/store/useGoalStore';
import React, { useMemo } from 'react';

interface DashboardMainProps {
  handleDayClick: (date: Date) => void;
}

const DashboardMain: React.FC<DashboardMainProps> = ({ handleDayClick }) => {
  const { appState } = useGoalStore();

  const activeGoal = useMemo(() => {
    if (!appState?.activeGoalId || !appState.goals) return null;
    return appState.goals[appState.activeGoalId];
  }, [appState]);

  if (!activeGoal) {
    return <NoActiveGoalMessage />;
  }

  return (
    <div className="space-y-12">
      <section>
        <div className="mb-8 text-center">
          <h3 className="mb-2 text-2xl font-bold">Your Mission Control</h3>
          <p className="mx-auto max-w-2xl text-text-secondary">
            This is your command center. Monitor your progress, track your time, and stay focused on
            the one thing that matters most right now.
          </p>
        </div>
        <CountdownCard goal={activeGoal} />
      </section>

      <section>
        <div className="mb-8 text-center">
          <h3 className="mb-2 text-2xl font-bold">Progress Calendar</h3>
          <p className="mx-auto max-w-2xl text-text-secondary">
            Visualize your daily satisfaction and log today&apos;s progress with a single click.
          </p>
        </div>
        <ProgressCalendar
          goal={activeGoal}
          dailyProgress={activeGoal.dailyProgress}
          onDayClick={handleDayClick}
        />
      </section>
    </div>
  );
};

export default DashboardMain;
