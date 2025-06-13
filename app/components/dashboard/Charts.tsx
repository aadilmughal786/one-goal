// app/components/dashboard/Charts.tsx
'use client';

import React, { useMemo } from 'react';
import { DailyProgress, SatisfactionLevel } from '@/types';
import { format, getDay } from 'date-fns';
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
  TooltipProps,
} from 'recharts';
import { FiTrendingUp, FiCheckCircle, FiActivity, FiStar } from 'react-icons/fi';

interface ChartsProps {
  dailyProgress: DailyProgress[];
}

const getSatisfactionInfo = (level: SatisfactionLevel) => {
  const info: Record<SatisfactionLevel, { color: string; label: string }> = {
    [SatisfactionLevel.VERY_LOW]: { color: '#ef4444', label: 'Very Low' },
    [SatisfactionLevel.LOW]: { color: '#f97316', label: 'Low' },
    [SatisfactionLevel.MEDIUM]: { color: '#f59e0b', label: 'Medium' },
    [SatisfactionLevel.HIGH]: { color: '#84cc16', label: 'High' },
    [SatisfactionLevel.VERY_HIGH]: { color: '#22c55e', label: 'Very High' },
  };
  return info[level] || { color: '#9ca3af', label: 'Unknown' };
};

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 text-sm rounded-lg border shadow-xl bg-neutral-800 border-white/10">
        <p className="font-bold text-white">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Skeleton component for individual chart cards
const ChartCardSkeleton = () => (
  <div className="p-4 sm:p-6 bg-white/[0.02] border border-white/10 rounded-3xl shadow-2xl animate-pulse">
    <div className="mx-auto mb-4 w-1/2 h-7 rounded-lg bg-white/10"></div>
    <div className="h-[300px] w-full bg-white/5 rounded-lg"></div>
  </div>
);

const Charts: React.FC<ChartsProps> = ({ dailyProgress }) => {
  const chartData = useMemo(() => {
    return dailyProgress
      .map(p => ({
        date: format(p.date.toDate(), 'MMM d'),
        satisfaction: p.satisfactionLevel,
        timeSpent: p.timeSpentMinutes,
      }))
      .slice(-30); // Show last 30 entries for clarity
  }, [dailyProgress]);

  const satisfactionDistribution = useMemo(() => {
    const distribution = new Map<SatisfactionLevel, number>();
    dailyProgress.forEach(p => {
      distribution.set(p.satisfactionLevel, (distribution.get(p.satisfactionLevel) || 0) + 1);
    });
    return Array.from(distribution.entries()).map(([level, count]) => ({
      name: getSatisfactionInfo(level).label,
      value: count,
      color: getSatisfactionInfo(level).color,
    }));
  }, [dailyProgress]);

  const weeklyPerformance = useMemo(() => {
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyData: {
      [key: number]: { totalSatisfaction: number; totalTime: number; count: number };
    } = {};

    dailyProgress.forEach(p => {
      const dayIndex = getDay(p.date.toDate()); // 0 for Sunday, 1 for Monday, etc.
      if (!weeklyData[dayIndex]) {
        weeklyData[dayIndex] = { totalSatisfaction: 0, totalTime: 0, count: 0 };
      }
      weeklyData[dayIndex].totalSatisfaction += p.satisfactionLevel;
      weeklyData[dayIndex].totalTime += p.timeSpentMinutes;
      weeklyData[dayIndex].count++;
    });

    return daysOfWeek.map((name, index) => ({
      name,
      avgSatisfaction: weeklyData[index]
        ? weeklyData[index].totalSatisfaction / weeklyData[index].count
        : 0,
      avgTime: weeklyData[index] ? weeklyData[index].totalTime / weeklyData[index].count : 0,
    }));
  }, [dailyProgress]);

  if (dailyProgress.length === 0) {
    return (
      <div className="space-y-8">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Satisfaction Trend Chart */}
      <div className="p-4 sm:p-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl shadow-2xl">
        <h3 className="flex gap-2 justify-center items-center mb-4 text-xl font-bold text-white">
          <FiTrendingUp /> Satisfaction Trend
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" />
            <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
            <YAxis domain={[1, 5]} tickCount={5} stroke="#9ca3af" fontSize={12} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.1)' }} />
            <Legend iconType="circle" />
            <Line
              type="monotone"
              dataKey="satisfaction"
              stroke="#38bdf8"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 8 }}
              name="Satisfaction Level"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly Performance Analysis Chart */}
      <div className="p-4 sm:p-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl shadow-2xl">
        <h3 className="flex gap-2 justify-center items-center mb-4 text-xl font-bold text-white">
          <FiActivity /> Weekly Performance
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weeklyPerformance}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" />
            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
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
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.1)' }} />
            <Legend iconType="circle" />
            <Bar yAxisId="left" dataKey="avgTime" fill="#84cc16" name="Avg Time Spent" />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="avgSatisfaction"
              stroke="#38bdf8"
              name="Avg Satisfaction"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Effort vs. Satisfaction Chart */}
      <div className="p-4 sm:p-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl shadow-2xl">
        <h3 className="flex gap-2 justify-center items-center mb-4 text-xl font-bold text-white">
          <FiStar /> Effort vs. Satisfaction
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" />
            <XAxis
              type="number"
              dataKey="timeSpent"
              name="Time Spent (mins)"
              unit="m"
              stroke="#9ca3af"
              fontSize={12}
            />
            <YAxis
              type="number"
              dataKey="satisfaction"
              name="Satisfaction"
              domain={[1, 5]}
              tickCount={5}
              stroke="#9ca3af"
              fontSize={12}
            />
            <ZAxis dataKey="satisfaction" range={[60, 400]} name="satisfaction" />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            <Legend iconType="circle" />
            <Scatter name="Daily Log" data={chartData} fillOpacity={0.7}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getSatisfactionInfo(entry.satisfaction).color} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Satisfaction Distribution Chart */}
      <div className="p-4 sm:p-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl shadow-2xl">
        <h3 className="flex gap-2 justify-center items-center mb-4 text-xl font-bold text-white">
          <FiCheckCircle /> Satisfaction Distribution
        </h3>
        <ResponsiveContainer width="100%" height={300}>
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
              label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                const radius = innerRadius + (outerRadius - innerRadius) * 1.2;
                const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                return (
                  <text
                    x={x}
                    y={y}
                    fill="white"
                    textAnchor={x > cx ? 'start' : 'end'}
                    dominantBaseline="central"
                    fontSize={14}
                  >
                    {`${(percent * 100).toFixed(0)}%`}
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
      </div>
    </div>
  );
};

export default Charts;
