// app/components/finance/charts/NetWorthHistoryChart.tsx
'use client';

import { CustomTooltip } from '@/components/dashboard/charts/CustomTooltip';
import { NetWorthData } from '@/types';
import { format } from 'date-fns';
import React, { useMemo } from 'react';
import { FiTrendingUp } from 'react-icons/fi';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface NetWorthHistoryChartProps {
  history: NetWorthData[];
  currency?: string;
}

const NetWorthHistoryChart: React.FC<NetWorthHistoryChartProps> = ({ history, currency = '$' }) => {
  const chartData = useMemo(() => {
    return history
      .map(item => ({
        date: format(item.date.toDate(), 'MMM yy'),
        'Net Worth': item.netWorth,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [history]);

  if (history.length < 2) {
    return (
      <div className="py-10 text-center rounded-2xl border bg-bg-tertiary border-border-primary">
        <FiTrendingUp className="mx-auto mb-4 text-4xl text-text-muted" />
        <h3 className="text-lg font-semibold text-text-primary">Net Worth History</h3>
        <p className="mt-1 text-sm text-text-secondary">
          Track your net worth over time to see your financial progress.
        </p>
        <p className="mt-2 text-xs text-text-muted">
          (Come back later after your net worth changes to see a chart)
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl border bg-bg-secondary border-border-primary">
      <h3 className="mb-4 text-2xl font-bold text-center text-text-primary">Net Worth History</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-primary)" />
          <XAxis dataKey="date" stroke="var(--color-text-secondary)" fontSize={12} />
          <YAxis
            stroke="var(--color-text-secondary)"
            fontSize={12}
            tickFormatter={value => `${currency}${value / 1000}k`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-bg-tertiary)' }} />
          <Area
            type="monotone"
            dataKey="Net Worth"
            stroke="#8884d8"
            fillOpacity={1}
            fill="url(#colorNetWorth)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default NetWorthHistoryChart;
