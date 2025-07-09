// app/components/dashboard/charts/DayOfWeekPerformanceChart.tsx
'use client';

import { DayOfWeekPerformanceDataItem } from '@/types';
import React from 'react';
import { FiActivity } from 'react-icons/fi';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CustomTooltip } from './CustomTooltip';

interface DayOfWeekPerformanceChartProps {
  weeklyPerformance: DayOfWeekPerformanceDataItem[];
}

const DayOfWeekPerformanceChart: React.FC<DayOfWeekPerformanceChartProps> = ({
  weeklyPerformance,
}) => {
  return (
    <div className="card">
      <h3 className="flex gap-2 justify-center items-center mb-4 text-xl font-bold text-text-primary">
        <FiActivity /> Day-of-Week Performance Analysis
      </h3>
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={weeklyPerformance}>
          <CartesianGrid stroke="var(--color-border-primary)" strokeDasharray="3 3" />
          <XAxis dataKey="name" stroke="var(--color-text-secondary)" fontSize={12} />
          <YAxis
            yAxisId="left"
            orientation="left"
            stroke="#84cc16"
            fontSize={12}
            label={{
              value: 'Avg Time (mins)',
              angle: -90,
              position: 'insideLeft',
              fill: '#84cc16',
            }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[1, 5]}
            tickCount={5}
            stroke="#38bdf8"
            fontSize={12}
            label={{
              value: 'Avg Satisfaction',
              angle: 90,
              position: 'insideRight',
              fill: '#38bdf8',
            }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-bg-tertiary)' }} />
          <Legend iconType="circle" />
          <Bar yAxisId="left" dataKey="avgTime" fill="#84cc16" name="Avg Time Spent" />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="avgSatisfaction"
            stroke="#38bdf8"
            name="Avg Satisfaction"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="successRate"
            stroke="#f97316"
            name="Success Rate %"
            strokeDasharray="5 5"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DayOfWeekPerformanceChart;
