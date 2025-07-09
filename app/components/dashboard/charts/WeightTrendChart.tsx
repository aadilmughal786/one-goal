// app/components/dashboard/charts/WeightTrendChart.tsx
'use client';

import { WeightDataItem } from '@/types';
import React, { useMemo } from 'react';
import { FaWeightHanging } from 'react-icons/fa';
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

interface WeightTrendChartProps {
  weightData: WeightDataItem[];
}

const WeightTrendChart: React.FC<WeightTrendChartProps> = ({ weightData }) => {
  const sortedData = useMemo(() => {
    return [...weightData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [weightData]);

  if (sortedData.length <= 1) return null;

  return (
    <div className="card">
      <h3 className="flex gap-2 justify-center items-center mb-4 text-xl font-bold text-text-primary">
        <FaWeightHanging /> Weight Trend
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={sortedData}>
          <CartesianGrid stroke="var(--color-border-primary)" strokeDasharray="3 3" />
          <XAxis dataKey="date" stroke="var(--color-text-secondary)" fontSize={12} />
          <YAxis
            stroke="var(--color-text-secondary)"
            fontSize={12}
            domain={['dataMin - 2', 'dataMax + 2']}
            label={{
              value: 'Weight',
              angle: -90,
              position: 'insideLeft',
              fill: 'var(--color-text-secondary)',
            }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-bg-tertiary)' }} />
          <Legend iconType="circle" />
          <Line
            type="monotone"
            dataKey="weight"
            name="Weight"
            stroke="#f472b6"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeightTrendChart;
