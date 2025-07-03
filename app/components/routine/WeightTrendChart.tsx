// app/components/routine/WeightTrendChart.tsx
'use client';

import { DailyProgress } from '@/types';
import { format } from 'date-fns';
import React, { useMemo } from 'react';
import { FaWeightHanging } from 'react-icons/fa';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
} from 'recharts';

interface WeightTrendChartProps {
  dailyProgress: DailyProgress[];
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 text-sm rounded-lg border shadow-xl bg-bg-tertiary border-border-primary">
        <p className="font-bold text-text-primary">{label}</p>
        {payload.map((entry, index) => {
          const value = entry.value;
          let displayValue: string;

          if (typeof value === 'number') {
            if (entry.dataKey === 'weight') {
              displayValue = `${value.toFixed(1)}`;
            } else {
              displayValue = value.toFixed(2);
            }
          } else {
            displayValue = 'N/A';
          }

          return (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${displayValue}`}
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

const WeightTrendChart: React.FC<WeightTrendChartProps> = ({ dailyProgress }) => {
  const weightData = useMemo(() => {
    if (!dailyProgress) return [];
    return dailyProgress
      .filter(p => p.weight !== null && p.weight > 0)
      .map(p => ({
        date: format(new Date(p.date), 'MMM d'),
        weight: p.weight,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [dailyProgress]);

  if (weightData.length < 2) {
    return (
      <div className="text-center card">
        <h3 className="flex gap-2 justify-center items-center mb-4 text-xl font-bold text-text-primary">
          <FaWeightHanging /> Weight Trend
        </h3>
        <p className="text-text-secondary">
          Log your weight on at least two different days to see a trend chart here.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="flex gap-2 justify-center items-center mb-4 text-xl font-bold text-text-primary">
        <FaWeightHanging /> Weight Trend
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={weightData}>
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
