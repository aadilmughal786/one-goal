// app/components/dashboard/charts/SatisfactionTrendChart.tsx
'use client';

import { ChartDataItem } from '@/types';
import React, { useMemo } from 'react';
import { FiTrendingUp } from 'react-icons/fi';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CustomTooltip } from './CustomTooltip';

interface SatisfactionTrendChartProps {
  chartData: ChartDataItem[];
}

const SatisfactionTrendChart: React.FC<SatisfactionTrendChartProps> = ({ chartData }) => {
  const sortedData = useMemo(() => {
    return [...chartData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [chartData]);

  return (
    <div className="card">
      <h3 className="flex gap-2 justify-center items-center mb-4 text-xl font-bold text-text-primary">
        <FiTrendingUp /> Satisfaction Trend & Moving Average
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={sortedData}>
          <CartesianGrid stroke="var(--color-border-primary)" strokeDasharray="3 3" />
          <XAxis dataKey="date" stroke="var(--color-text-secondary)" fontSize={12} />
          <YAxis domain={[1, 5]} tickCount={5} stroke="var(--color-text-secondary)" fontSize={12} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-bg-tertiary)' }} />
          <Legend iconType="circle" />
          <Line
            type="monotone"
            dataKey="satisfaction"
            name="Daily Satisfaction"
            stroke="#38bdf8"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 8 }}
          />
          <Line
            type="monotone"
            dataKey="movingAvg"
            name="7-Day Average"
            stroke="#f97316"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SatisfactionTrendChart;
