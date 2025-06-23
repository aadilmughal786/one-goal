// app/components/dashboard/DashboardAnalytics.tsx
'use client';

import Charts from '@/components/dashboard/Charts';
import { AppState } from '@/types';
import Link from 'next/link';
import React, { useMemo } from 'react';
import { FiBarChart2 } from 'react-icons/fi';

// NEW: Import the common NoActiveGoalMessage component
import NoActiveGoalMessage from '@/components/common/NoActiveGoalMessage';

interface DashboardAnalyticsProps {
  appState: AppState | null;
}

const DashboardAnalytics: React.FC<DashboardAnalyticsProps> = ({ appState }) => {
  const activeGoal = useMemo(() => {
    if (!appState?.activeGoalId || !appState.goals) return null;
    return appState.goals[appState.activeGoalId];
  }, [appState]);

  const dailyProgressArray = activeGoal ? Object.values(activeGoal.dailyProgress) : [];

  // FIX: Use the common NoActiveGoalMessage component for consistency.
  if (!activeGoal) {
    return <NoActiveGoalMessage />;
  }

  // Display a different message if there is a goal but no data to analyze yet.
  if (dailyProgressArray.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center p-10 h-full text-center bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg">
        <FiBarChart2 className="mx-auto mb-6 w-20 h-20 text-white/70" />
        <h2 className="mb-4 text-3xl font-bold text-white">No Data to Analyze</h2>
        <p className="mx-auto max-w-2xl text-lg text-white/70">
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
        <p className="mx-auto max-w-2xl text-white/60">
          Analyze trends in your effort and satisfaction to understand what works best for you.
        </p>
      </div>
      <Charts dailyProgress={dailyProgressArray} goal={activeGoal} />
    </section>
  );
};

export default DashboardAnalytics;
