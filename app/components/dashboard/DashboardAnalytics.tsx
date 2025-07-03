// app/components/dashboard/DashboardAnalytics.tsx
'use client';

import NoActiveGoalMessage from '@/components/common/NoActiveGoalMessage';
import Charts from '@/components/dashboard/Charts';
import { useGoalStore } from '@/store/useGoalStore';
import Link from 'next/link';
import React, { useMemo } from 'react';
import { FiBarChart2 } from 'react-icons/fi';

const DashboardAnalytics: React.FC = () => {
  const activeGoal = useGoalStore(state =>
    state.appState?.activeGoalId ? state.appState.goals[state.appState.activeGoalId] : null
  );

  const dailyProgressArray = useMemo(
    () => (activeGoal ? Object.values(activeGoal.dailyProgress) : []),
    [activeGoal]
  );

  if (!activeGoal) {
    return <NoActiveGoalMessage />;
  }

  if (dailyProgressArray.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center p-10 h-full text-center card">
        <FiBarChart2 className="mx-auto mb-6 w-20 h-20 text-text-secondary" />
        <h2 className="mb-4 text-3xl font-bold text-text-primary">No Data to Analyze</h2>
        <p className="mx-auto max-w-2xl text-lg text-text-secondary">
          Start logging your daily progress on the main dashboard to see your performance insights
          here.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center px-4 py-2 mt-4 text-white bg-blue-600 rounded-md transition-colors hover:bg-blue-700"
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <section>
      <div className="mb-8 text-center">
        <h3 className="mb-2 text-2xl font-bold">Performance Insights</h3>
        <p className="mx-auto max-w-2xl text-text-secondary">
          Analyze trends in your effort and satisfaction to understand what works best for you.
        </p>
      </div>
      <Charts dailyProgress={dailyProgressArray} goal={activeGoal} />
    </section>
  );
};

export default DashboardAnalytics;
