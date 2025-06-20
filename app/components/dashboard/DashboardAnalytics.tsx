// app/components/dashboard/DashboardAnalytics.tsx
'use client';

import React, { useMemo } from 'react';
import { AppState } from '@/types'; // Import Goal type
import Charts from '@/components/dashboard/Charts';
import { FiBarChart2 } from 'react-icons/fi';
import Link from 'next/link'; // For linking to dashboard main

interface DashboardAnalyticsProps {
  appState: AppState | null;
  // No need for currentUser, showMessage, onAppStateUpdate if only displaying charts
}

const DashboardAnalytics: React.FC<DashboardAnalyticsProps> = ({ appState }) => {
  // Get the currently active goal from appState
  const activeGoal = useMemo(() => {
    if (!appState?.activeGoalId || !appState.goals) return null;
    return appState.goals[appState.activeGoalId];
  }, [appState]);

  // Extract daily progress data as an array for the Charts component
  const dailyProgressArray = activeGoal ? Object.values(activeGoal.dailyProgress) : [];

  // Render a message if no active goal or no daily progress data is available for analysis.
  if (!activeGoal || dailyProgressArray.length === 0) {
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
      {/* Render Charts component, passing the filtered daily progress and the active goal */}
      <Charts dailyProgress={dailyProgressArray} goal={activeGoal} />
    </section>
  );
};

export default DashboardAnalytics;
