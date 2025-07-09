// app/components/dashboard/charts/GoalProgressOverviewChart.tsx
'use client';

import { GoalProgressData } from '@/types';
import React from 'react';
import { FiTarget } from 'react-icons/fi';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CustomTooltip } from './CustomTooltip';

interface GoalProgressOverviewChartProps {
  goalProgressData: GoalProgressData;
}

const GoalProgressOverviewChart: React.FC<GoalProgressOverviewChartProps> = ({
  goalProgressData,
}) => {
  if (!goalProgressData) return null;

  return (
    <div className="card">
      <h3 className="flex gap-2 justify-center items-center mb-4 text-xl font-bold text-text-primary">
        <FiTarget /> Goal Progress Overview
      </h3>
      <ResponsiveContainer width="100%" height={150}>
        <BarChart
          data={[{ name: 'Goal Progress', ...goalProgressData }]}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" domain={[0, goalProgressData.totalDays]} hide />
          <YAxis type="category" dataKey="name" hide />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="daysLogged" stackId="a" fill="#84cc16" name="Logged Days" />
          <Bar dataKey="unloggedDays" stackId="a" fill="#6b7280" name="Unlogged Days" />
          <Bar dataKey="daysRemaining" stackId="a" fill="#f97316" name="Days Remaining" />
        </BarChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-2 gap-4 mt-4 text-center">
        <div>
          <p className="text-2xl font-bold text-blue-400">{goalProgressData.daysPassed}</p>
          <p className="text-sm text-text-secondary">Days Passed</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-orange-400">{goalProgressData.daysRemaining}</p>
          <p className="text-sm text-text-secondary">Days Remaining</p>
        </div>
      </div>
    </div>
  );
};

export default GoalProgressOverviewChart;
