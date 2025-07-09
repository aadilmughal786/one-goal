// app/components/dashboard/Charts.tsx
'use client';

import { DailyProgress, Goal } from '@/types';
import {
  useChartData,
  useCorrelationData,
  useGoalProgressData,
  useSatisfactionDistribution,
  useSatisfactionForStackedBar,
  useWeeklyPerformance,
  useWeightData,
} from '@/utils/dashboardChartUtils';
import React from 'react';

import DayOfWeekPerformanceChart from '@/components/dashboard/charts/DayOfWeekPerformanceChart';
import GoalProgressOverviewChart from '@/components/dashboard/charts/GoalProgressOverviewChart';
import SatisfactionLevelDistributionCharts from '@/components/dashboard/charts/SatisfactionLevelDistributionCharts';
import SatisfactionTrendChart from '@/components/dashboard/charts/SatisfactionTrendChart';
import TimeVsSatisfactionChart from '@/components/dashboard/charts/TimeVsSatisfactionChart';
import WeightTrendChart from '@/components/dashboard/charts/WeightTrendChart';
import { FiBarChart } from 'react-icons/fi';

interface ChartsProps {
  dailyProgress: DailyProgress[];
  goal: Goal | null;
}

const Charts: React.FC<ChartsProps> = ({ dailyProgress, goal }) => {
  const chartData = useChartData(dailyProgress);
  const weightData = useWeightData(dailyProgress);
  const goalProgressData = useGoalProgressData(dailyProgress, goal);
  const correlationData = useCorrelationData(chartData);
  const weeklyPerformance = useWeeklyPerformance(dailyProgress);
  const satisfactionDistribution = useSatisfactionDistribution(dailyProgress);
  const satisfactionForStackedBar = useSatisfactionForStackedBar(satisfactionDistribution);

  if (!dailyProgress || dailyProgress.length === 0) {
    return (
      <div className="p-8 text-center text-text-secondary">
        <FiBarChart className="mx-auto mb-4 text-4xl" />
        <p>No progress data available yet. Start logging your daily progress to see charts!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {goalProgressData && <GoalProgressOverviewChart goalProgressData={goalProgressData} />}
      <SatisfactionTrendChart chartData={chartData} />
      {weightData.length > 1 && <WeightTrendChart weightData={weightData} />}
      <DayOfWeekPerformanceChart weeklyPerformance={weeklyPerformance} />
      <TimeVsSatisfactionChart correlationData={correlationData} />
      <SatisfactionLevelDistributionCharts
        satisfactionDistribution={satisfactionDistribution}
        satisfactionForStackedBar={satisfactionForStackedBar}
        dailyProgressLength={dailyProgress.length}
      />
    </div>
  );
};

export default Charts;
