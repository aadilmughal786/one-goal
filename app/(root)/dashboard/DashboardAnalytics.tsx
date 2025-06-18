// app/(root)/dashboard/DashboardAnalytics.tsx
'use client';

import React from 'react';
import { AppState } from '@/types';
import Charts from '@/components/dashboard/Charts';
import { FiBarChart2 } from 'react-icons/fi';

interface DashboardAnalyticsProps {
  appState: AppState | null;
}

const DashboardAnalytics: React.FC<DashboardAnalyticsProps> = ({ appState }) => {
  if (!appState || !appState.goal || Object.keys(appState.dailyProgress).length === 0) {
    return (
      <div className="flex flex-col justify-center items-center p-10 h-full text-center bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg">
        <FiBarChart2 className="mx-auto mb-6 w-20 h-20 text-white/70" />
        <h2 className="mb-4 text-3xl font-bold text-white">No Data to Analyze</h2>
        <p className="mx-auto max-w-2xl text-lg text-white/70">
          Start logging your daily progress on the main dashboard to see your performance insights
          here.
        </p>
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
      <Charts dailyProgress={Object.values(appState.dailyProgress)} goal={appState.goal} />
    </section>
  );
};

export default DashboardAnalytics;
