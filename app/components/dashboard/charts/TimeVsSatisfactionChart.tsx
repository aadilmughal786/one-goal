// app/components/dashboard/charts/TimeVsSatisfactionChart.tsx
'use client';

import { CorrelationDataItem } from '@/types';
import React, { useMemo } from 'react';
import { FiStar } from 'react-icons/fi';
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

interface TimeVsSatisfactionChartProps {
  correlationData: CorrelationDataItem[];
}

const TimeVsSatisfactionChart: React.FC<TimeVsSatisfactionChartProps> = ({ correlationData }) => {
  const sortedData = useMemo(() => {
    return [...correlationData].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [correlationData]);

  return (
    <div className="card">
      <h3 className="flex gap-2 justify-center items-center mb-4 text-xl font-bold text-text-primary">
        <FiStar /> Time vs Satisfaction Analysis
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={sortedData}>
          <CartesianGrid stroke="var(--color-border-primary)" strokeDasharray="3 3" />
          <XAxis dataKey="date" stroke="var(--color-text-secondary)" fontSize={12} />
          <YAxis
            yAxisId="left"
            stroke="#84cc16"
            fontSize={12}
            label={{ value: 'Time (mins)', angle: -90, position: 'insideLeft', fill: '#84cc16' }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[1, 5]}
            tickCount={5}
            stroke="#38bdf8"
            fontSize={12}
            label={{ value: 'Satisfaction', angle: 90, position: 'insideRight', fill: '#38bdf8' }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-bg-tertiary)' }} />
          <Legend iconType="circle" />
          <Bar yAxisId="left" dataKey="timeSpent" fill="#84cc16" name="Time Spent (mins)" />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="satisfaction"
            name="Satisfaction Level"
            stroke="#38bdf8"
            strokeWidth={2}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TimeVsSatisfactionChart;
