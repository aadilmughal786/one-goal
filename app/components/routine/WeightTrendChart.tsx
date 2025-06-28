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

/**
 * Custom Tooltip for the Weight Trend Chart.
 */
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 text-sm rounded-lg border shadow-xl bg-neutral-800 border-white/10">
        <p className="font-bold text-white">{label}</p>
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

/**
 * A dedicated component to render a line chart for weight trends.
 */
const WeightTrendChart: React.FC<WeightTrendChartProps> = ({ dailyProgress }) => {
  // Memoize the calculation of weight data to prevent re-computation on every render.
  const weightData = useMemo(() => {
    if (!dailyProgress) return [];
    return dailyProgress
      .filter(p => p.weight !== null && p.weight > 0) // Filter out days without weight logs
      .map(p => ({
        date: format(new Date(p.date), 'MMM d'), // Format date for X-axis
        weight: p.weight,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Ensure data is chronological
  }, [dailyProgress]);

  // If there are fewer than 2 data points, a line chart isn't meaningful.
  if (weightData.length < 2) {
    return (
      <div className="p-4 text-center bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl shadow-2xl sm:p-6">
        <h3 className="flex gap-2 justify-center items-center mb-4 text-xl font-bold text-white">
          <FaWeightHanging /> Weight Trend
        </h3>
        <p className="text-white/60">
          Log your weight on at least two different days to see a trend chart here.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl shadow-2xl sm:p-6">
      <h3 className="flex gap-2 justify-center items-center mb-4 text-xl font-bold text-white">
        <FaWeightHanging /> Weight Trend
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={weightData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" />
          <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
          <YAxis
            stroke="#9ca3af"
            fontSize={12}
            domain={['dataMin - 2', 'dataMax + 2']} // Add padding to Y-axis
            label={{
              value: 'Weight',
              angle: -90,
              position: 'insideLeft',
              fill: '#9ca3af',
            }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.1)' }} />
          <Legend iconType="circle" />
          <Line
            type="monotone"
            dataKey="weight"
            name="Weight"
            stroke="#f472b6" // Pink color for the line
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
