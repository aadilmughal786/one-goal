// app/components/dashboard/charts/SatisfactionLevelDistributionCharts.tsx
'use client';

import React from 'react';
import { FiCheckCircle } from 'react-icons/fi';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SatisfactionDistributionItem } from '../../../../app/types';
import { CustomTooltip } from './CustomTooltip';

interface SatisfactionLevelDistributionChartsProps {
  satisfactionDistribution: SatisfactionDistributionItem[];
  satisfactionForStackedBar: { name: string; [key: string]: number | string }[];
  dailyProgressLength: number;
}

const SatisfactionLevelDistributionCharts: React.FC<SatisfactionLevelDistributionChartsProps> = ({
  satisfactionDistribution,
  satisfactionForStackedBar,
  dailyProgressLength,
}) => {
  return (
    <div className="card">
      <h3 className="flex gap-2 justify-center items-center mb-4 text-xl font-bold text-text-primary">
        <FiCheckCircle /> Satisfaction Level Distribution
      </h3>
      <div className="flex flex-col gap-8">
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={satisfactionDistribution}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              activeShape={{}}
              stroke="none"
              label={({ cx, cy, midAngle, innerRadius, outerRadius, payload }) => {
                const radius = innerRadius + (outerRadius - innerRadius) * 1.2;
                const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                return (
                  <text
                    x={x}
                    y={y}
                    fill="var(--color-text-primary)"
                    textAnchor={x > cx ? 'start' : 'end'}
                    dominantBaseline="central"
                    fontSize={14}
                  >
                    {`${payload.percentage.toFixed(0)}%`}
                  </text>
                );
              }}
            >
              {satisfactionDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
        <ResponsiveContainer width="100%" height={30}>
          <BarChart data={satisfactionForStackedBar} layout="vertical" margin={{ bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, dailyProgressLength]} hide />
            <YAxis type="category" dataKey="name" hide />
            <Bar dataKey="Very Satisfied" stackId="a" fill="#22c55e" name="Very Satisfied" />
            <Bar dataKey="Satisfied" stackId="a" fill="#84cc16" name="Satisfied" />
            <Bar dataKey="Neutral" stackId="a" fill="#f59e0b" name="Neutral" />
            <Bar dataKey="Unsatisfied" stackId="a" fill="#f97316" name="Unsatisfied" />
            <Bar dataKey="Very Unsatisfied" stackId="a" fill="#ef4444" name="Very Unsatisfied" />
          </BarChart>
        </ResponsiveContainer>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={satisfactionDistribution} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} />
            <YAxis type="category" dataKey="name" width={120} hide />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="percentage" name="Percentage">
              {satisfactionDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SatisfactionLevelDistributionCharts;
