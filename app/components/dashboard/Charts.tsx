// app/components/dashboard/Charts.tsx
'use client';

import React, { useMemo } from 'react';
import { DailyProgress, SatisfactionLevel, Goal } from '@/types';
import {
  format,
  getDay,
  differenceInDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
} from 'date-fns';
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  Bar,
  PieChart,
  Pie,
  Cell,
  Area,
  ComposedChart,
  BarChart,
  RadialBarChart,
  RadialBar,
  TooltipProps,
} from 'recharts';
import {
  FiTrendingUp,
  FiCheckCircle,
  FiActivity,
  FiStar,
  FiClock,
  FiTarget,
  FiCalendar,
  FiBarChart,
} from 'react-icons/fi';

interface ChartsProps {
  dailyProgress: DailyProgress[];
  goal: Goal | null;
}

const getSatisfactionInfo = (level: SatisfactionLevel) => {
  const info: Record<SatisfactionLevel, { color: string; label: string; numeric: number }> = {
    [SatisfactionLevel.VERY_LOW]: { color: '#ef4444', label: 'Very Low', numeric: 1 },
    [SatisfactionLevel.LOW]: { color: '#f97316', label: 'Low', numeric: 2 },
    [SatisfactionLevel.MEDIUM]: { color: '#f59e0b', label: 'Medium', numeric: 3 },
    [SatisfactionLevel.HIGH]: { color: '#84cc16', label: 'High', numeric: 4 },
    [SatisfactionLevel.VERY_HIGH]: { color: '#22c55e', label: 'Very High', numeric: 5 },
  };
  return info[level] || { color: '#9ca3af', label: 'Unknown', numeric: 0 };
};

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 text-sm rounded-lg border shadow-xl bg-neutral-800 border-white/10">
        <p className="font-bold text-white">{label}</p>
        {payload.map((entry, index) => {
          const value = entry.value;
          let displayValue: string;

          if (typeof value === 'number') {
            // Format based on the data key for better readability
            if (entry.dataKey === 'cumulativeHours' || entry.dataKey === 'avgTime') {
              displayValue = `${value.toFixed(1)}`;
            } else if (entry.dataKey === 'completionRate') {
              displayValue = `${value.toFixed(1)}%`;
            } else if (entry.dataKey === 'consistency') {
              displayValue = `${value.toFixed(0)}%`;
            } else {
              displayValue = value.toFixed(2);
            }
          } else if (typeof value === 'string') {
            const parsed = parseFloat(value);
            displayValue = isNaN(parsed) ? value : parsed.toFixed(2);
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

const Charts: React.FC<ChartsProps> = ({ dailyProgress, goal }) => {
  // Enhanced chart data with more meaningful metrics
  const chartData = useMemo(() => {
    // Ensure dailyProgress is an array before mapping
    if (!dailyProgress) return [];

    const data = dailyProgress.map(p => ({
      date: format(new Date(p.date), 'MMM d'), // Use new Date(p.date) as p.date is string
      satisfaction: getSatisfactionInfo(p.satisfactionLevel).numeric,
      // Use effortTimeMinutes which is now number | null
      timeSpent: p.effortTimeMinutes || 0,
      movingAvg: 0,
      efficiency:
        (p.effortTimeMinutes || 0) > 0
          ? getSatisfactionInfo(p.satisfactionLevel).numeric / ((p.effortTimeMinutes || 0) / 60)
          : 0,
    }));

    // Calculate 7-day moving average
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - 6);
      const end = i + 1;
      const window = data.slice(start, end);
      const sum = window.reduce((acc, curr) => acc + curr.satisfaction, 0);
      data[i].movingAvg = parseFloat((sum / window.length).toFixed(2));
    }

    return data;
  }, [dailyProgress]);

  // Goal progress tracking
  const goalProgressData = useMemo(() => {
    if (!goal) return null;

    // Use goal.createdAt instead of goal.startDate
    const totalDays = differenceInDays(goal.endDate.toDate(), goal.startDate.toDate()) + 1;
    const daysPassed = Math.min(
      differenceInDays(new Date(), goal.startDate.toDate()) + 1,
      totalDays
    );
    const daysLogged = dailyProgress.filter(
      p => getSatisfactionInfo(p.satisfactionLevel).numeric > 1 || (p.effortTimeMinutes || 0) > 0
    ).length; // Use effortTimeMinutes

    const completionRate = (daysPassed / totalDays) * 100;
    const loggingRate = (daysLogged / daysPassed) * 100;

    return {
      totalDays,
      daysPassed,
      daysRemaining: Math.max(0, totalDays - daysPassed),
      daysLogged,
      completionRate,
      loggingRate,
    };
  }, [dailyProgress, goal]);

  // Consistency metrics
  const consistencyData = useMemo(() => {
    if (!goal) return [];

    const weeks = [];
    // Use goal.createdAt instead of goal.startDate
    let currentDate = goal.startDate.toDate();
    const endDate = Math.min(new Date().getTime(), goal.endDate.toDate().getTime());

    while (currentDate.getTime() <= endDate) {
      const weekStart = startOfWeek(currentDate);
      const weekEnd = endOfWeek(currentDate);
      const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

      const weekProgress = weekDays
        // Use goal.createdAt instead of goal.startDate
        .filter(day => day >= goal.startDate.toDate() && day <= new Date())
        .map(day => {
          const dayKey = format(day, 'yyyy-MM-dd'); // Format date string correctly
          return dailyProgress.find(p => p.date === dayKey); // Compare date strings
        });

      const activeDays = weekProgress.filter(
        p =>
          p &&
          (getSatisfactionInfo(p.satisfactionLevel).numeric > 1 || (p.effortTimeMinutes || 0) > 0)
      ).length; // Use effortTimeMinutes

      const totalWeekDays = weekProgress.length;
      const consistency = totalWeekDays > 0 ? (activeDays / totalWeekDays) * 100 : 0;

      weeks.push({
        week: format(weekStart, 'MMM d'),
        consistency,
        activeDays,
        totalDays: totalWeekDays,
      });

      currentDate = new Date(weekEnd.getTime() + 24 * 60 * 60 * 1000);
    }

    return weeks;
  }, [dailyProgress, goal]);

  // Enhanced cumulative data
  const cumulativeTimeData = useMemo(() => {
    // Ensure dailyProgress is an array before mapping
    if (!dailyProgress) return [];

    let accumulatedTime = 0;
    let accumulatedSatisfaction = 0;

    return dailyProgress.map((p, index) => {
      accumulatedTime += p.effortTimeMinutes || 0; // Use effortTimeMinutes
      accumulatedSatisfaction += getSatisfactionInfo(p.satisfactionLevel).numeric;

      return {
        date: format(new Date(p.date), 'MMM d'), // Use new Date(p.date)
        cumulativeHours: parseFloat((accumulatedTime / 60).toFixed(2)),
        avgSatisfaction: parseFloat((accumulatedSatisfaction / (index + 1)).toFixed(2)),
      };
    });
  }, [dailyProgress]);

  // Time vs satisfaction correlation
  const correlationData = useMemo(() => {
    // Ensure chartData is an array before mapping
    if (!chartData) return [];

    return chartData.map(item => ({
      timeSpent: item.timeSpent, // Already uses effortTimeMinutes from chartData
      satisfaction: item.satisfaction,
      efficiency: item.efficiency,
      date: item.date,
    }));
  }, [chartData]);

  // Weekly performance (enhanced)
  const weeklyPerformance = useMemo(() => {
    // Ensure dailyProgress is an array before processing
    if (!dailyProgress) return [];

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyData: {
      [key: number]: {
        totalSatisfaction: number;
        totalTime: number;
        count: number;
        highSatisfactionDays: number;
      };
    } = {};

    dailyProgress.forEach(p => {
      const dayIndex = getDay(new Date(p.date)); // Use new Date(p.date)
      if (!weeklyData[dayIndex]) {
        weeklyData[dayIndex] = {
          totalSatisfaction: 0,
          totalTime: 0,
          count: 0,
          highSatisfactionDays: 0,
        };
      }
      const satisfaction = getSatisfactionInfo(p.satisfactionLevel).numeric;
      weeklyData[dayIndex].totalSatisfaction += satisfaction;
      weeklyData[dayIndex].totalTime += p.effortTimeMinutes || 0; // Use effortTimeMinutes
      weeklyData[dayIndex].count++;
      if (satisfaction >= 4) weeklyData[dayIndex].highSatisfactionDays++;
    });

    return daysOfWeek.map((name, index) => ({
      name,
      avgSatisfaction: weeklyData[index]
        ? parseFloat((weeklyData[index].totalSatisfaction / weeklyData[index].count).toFixed(2))
        : 0,
      avgTime: weeklyData[index]
        ? parseFloat((weeklyData[index].totalTime / weeklyData[index].count).toFixed(2))
        : 0,
      successRate: weeklyData[index]
        ? parseFloat(
            ((weeklyData[index].highSatisfactionDays / weeklyData[index].count) * 100).toFixed(1)
          )
        : 0,
    }));
  }, [dailyProgress]);

  // Satisfaction distribution (enhanced)
  const satisfactionDistribution = useMemo(() => {
    // Ensure dailyProgress is an array before processing
    if (!dailyProgress) return [];

    const distribution = new Map<SatisfactionLevel, number>();
    dailyProgress.forEach(p => {
      distribution.set(p.satisfactionLevel, (distribution.get(p.satisfactionLevel) || 0) + 1);
    });

    return Array.from(distribution.entries()).map(([level, count]) => ({
      name: getSatisfactionInfo(level).label,
      value: count,
      percentage: parseFloat(((count / dailyProgress.length) * 100).toFixed(1)),
      color: getSatisfactionInfo(level).color,
    }));
  }, [dailyProgress]);

  if (dailyProgress.length === 0) {
    return (
      <div className="p-8 text-center text-white/60">
        <FiBarChart className="mx-auto mb-4 text-4xl" />
        <p>No progress data available yet. Start logging your daily progress to see charts!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Goal Progress Overview */}
      {goalProgressData && (
        <div className="p-4 sm:p-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl shadow-2xl">
          <h3 className="flex gap-2 justify-center items-center mb-4 text-xl font-bold text-white">
            <FiTarget /> Goal Progress Overview
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="20%"
              outerRadius="80%"
              data={[
                { name: 'Time Progress', value: goalProgressData.completionRate, fill: '#38bdf8' },
                {
                  name: 'Logging Consistency',
                  value: goalProgressData.loggingRate,
                  fill: '#84cc16',
                },
              ]}
            >
              <RadialBar dataKey="value" cornerRadius={10} />
              <Legend iconType="circle" />
              <Tooltip content={<CustomTooltip />} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-4 mt-4 text-center md:grid-cols-4">
            <div>
              <p className="text-2xl font-bold text-blue-400">{goalProgressData.daysPassed}</p>
              <p className="text-sm text-white/60">Days Passed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">{goalProgressData.daysLogged}</p>
              <p className="text-sm text-white/60">Days Logged</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-400">{goalProgressData.daysRemaining}</p>
              <p className="text-sm text-white/60">Days Remaining</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-400">
                {goalProgressData.loggingRate.toFixed(0)}%
              </p>
              <p className="text-sm text-white/60">Consistency</p>
            </div>
          </div>
        </div>
      )}

      {/* Satisfaction Trend */}
      <div className="p-4 sm:p-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl shadow-2xl">
        <h3 className="flex gap-2 justify-center items-center mb-4 text-xl font-bold text-white">
          <FiTrendingUp /> Satisfaction Trend & Moving Average
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

      {/* Weekly Consistency */}
      {consistencyData.length > 0 && (
        <div className="p-4 sm:p-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl shadow-2xl">
          <h3 className="flex gap-2 justify-center items-center mb-4 text-xl font-bold text-white">
            <FiCalendar /> Weekly Consistency Tracking
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={consistencyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" />
              <XAxis dataKey="week" stroke="#9ca3af" fontSize={12} />
              <YAxis
                stroke="#9ca3af"
                fontSize={12}
                label={{
                  value: 'Consistency %',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#9ca3af',
                }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.1)' }} />
              <Legend iconType="circle" />
              <Bar dataKey="consistency" fill="#8b5cf6" name="Weekly Consistency %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Enhanced Weekly Performance */}
      <div className="p-4 sm:p-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl shadow-2xl">
        <h3 className="flex gap-2 justify-center items-center mb-4 text-xl font-bold text-white">
          <FiActivity /> Day-of-Week Performance Analysis
        </h3>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={weeklyPerformance}>
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

      {/* Cumulative Progress */}
      <div className="p-4 sm:p-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl shadow-2xl">
        <h3 className="flex gap-2 justify-center items-center mb-4 text-xl font-bold text-white">
          <FiClock /> Cumulative Progress & Satisfaction Trend
        </h3>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={cumulativeTimeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" />
            <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
            <YAxis
              yAxisId="left"
              stroke="#84cc16"
              fontSize={12}
              label={{ value: 'Hours', angle: -90, position: 'insideLeft', fill: '#84cc16' }}
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
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="cumulativeHours"
              name="Total Hours Invested"
              stroke="#84cc16"
              fill="#84cc16"
              fillOpacity={0.2}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="avgSatisfaction"
              name="Rolling Avg Satisfaction"
              stroke="#38bdf8"
              strokeWidth={3}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Time vs Satisfaction Efficiency */}
      <div className="p-4 sm:p-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl shadow-2xl">
        <h3 className="flex gap-2 justify-center items-center mb-4 text-xl font-bold text-white">
          <FiStar /> Time vs Satisfaction Analysis
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={correlationData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" />
            <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
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
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.1)' }} />
            <Legend iconType="circle" />
            <Bar yAxisId="left" dataKey="timeSpent" fill="#84cc16" name="Time Spent (mins)" />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="satisfaction"
              stroke="#38bdf8"
              name="Satisfaction Level"
              strokeWidth={2}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Enhanced Satisfaction Distribution */}
      <div className="p-4 sm:p-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl shadow-2xl">
        <h3 className="flex gap-2 justify-center items-center mb-4 text-xl font-bold text-white">
          <FiCheckCircle /> Satisfaction Level Distribution
        </h3>
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
              label={({ cx, cy, midAngle, innerRadius, outerRadius, percentage }) => {
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
                    {`${percentage.toFixed(0)}%`}
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
