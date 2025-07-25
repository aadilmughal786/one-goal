// app/components/dashboard/DashboardMain.tsx
'use client';

import NoActiveGoalMessage from '@/components/common/NoActiveGoalMessage';
import CountdownCard from '@/components/dashboard/CountdownCard';
import CatchingTheFrogSection from '@/components/dashboard/CatchingTheFrogSection';
import PinnedWeatherDisplay from '@/components/dashboard/PinnedWeatherDisplay'; // Import the new component
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
        <CountdownCard goal={activeGoal} />
      </section>

      <CatchingTheFrogSection />

      <PinnedWeatherDisplay />

      <section>
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
