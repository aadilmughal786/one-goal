// app/components/dashboard/Charts.tsx
'use client';

import React, { useMemo } from 'react';
import { DailyProgress, SatisfactionLevel, Goal, StopwatchSession } from '@/types'; // Ensure StopwatchSession is imported
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

// Define the interface for a single item in the chartData array
interface ChartDataItem {
  date: string;
  satisfaction: number;
  timeSpent: number; // In minutes
  efficiency: number; // Satisfaction per hour
  movingAvg: number; // 7-day moving average for satisfaction
}

/**
 * Maps SatisfactionLevel enum values to display information (color, label, numeric value).
 * @param level The SatisfactionLevel enum value.
 * @returns An object containing color, label, and numeric representation.
 */
const getSatisfactionInfo = (level: SatisfactionLevel) => {
  const info: Record<SatisfactionLevel, { color: string; label: string; numeric: number }> = {
    // Corrected enum member names to match types/index.ts
    [SatisfactionLevel.VERY_UNSATISFIED]: {
      color: '#ef4444',
      label: 'Very Unsatisfied',
      numeric: 1,
    },
    [SatisfactionLevel.UNSATISFIED]: { color: '#f97316', label: 'Unsatisfied', numeric: 2 },
    [SatisfactionLevel.NEUTRAL]: { color: '#f59e0b', label: 'Neutral', numeric: 3 },
    [SatisfactionLevel.SATISFIED]: { color: '#84cc16', label: 'Satisfied', numeric: 4 },
    [SatisfactionLevel.VERY_SATISFIED]: { color: '#22c55e', label: 'Very Satisfied', numeric: 5 },
  };
  // Fallback for unexpected level, though TypeScript should prevent this if enum is strictly used.
  return info[level] || { color: '#9ca3af', label: 'Unknown', numeric: 0 };
};

/**
 * Custom Tooltip component for Recharts, providing formatted display of data points.
 * @param active - Boolean indicating if the tooltip is active.
 * @param payload - Array of data entries for the active point.
 * @param label - The label for the active data point (e.g., date).
 * @returns ReactNode representing the custom tooltip.
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
            // Format based on the data key for better readability
            if (entry.dataKey === 'cumulativeHours') {
              displayValue = `${value.toFixed(1)} hrs`;
            } else if (entry.dataKey === 'avgTime' || entry.dataKey === 'timeSpent') {
              // Added 'timeSpent'
              displayValue = `${value.toFixed(1)} mins`;
            } else if (
              entry.dataKey === 'completionRate' ||
              entry.dataKey === 'consistency' ||
              entry.dataKey === 'successRate'
            ) {
              displayValue = `${value.toFixed(0)}%`; // Round percentages to whole numbers
            } else if (
              entry.dataKey === 'satisfaction' ||
              entry.dataKey === 'avgSatisfaction' ||
              entry.dataKey === 'movingAvg'
            ) {
              displayValue = value.toFixed(1); // Satisfaction levels to 1 decimal
            } else {
              displayValue = value.toFixed(2); // Default for other numbers
            }
          } else if (typeof value === 'string') {
            // Attempt to parse string to float for formatting, else display as is
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

/**
 * Charts Component
 *
 * Displays various performance charts based on daily progress data for a goal.
 * Utilizes Recharts library for data visualization.
 */
const Charts: React.FC<ChartsProps> = ({ dailyProgress, goal }) => {
  /**
   * Helper to calculate total duration in minutes from an array of StopwatchSession.
   * @param sessions - Array of StopwatchSession objects.
   * @returns Total duration in minutes.
   */
  const getTotalSessionMinutes = (sessions: StopwatchSession[] | undefined): number => {
    // Ensure sessions is an array and sum the 'duration' property (which is in milliseconds)
    return (sessions || []).reduce((sum, s) => sum + s.duration, 0) / (1000 * 60); // Convert ms to minutes
  };

  /**
   * Memoized data for daily satisfaction, time spent, and moving averages.
   * This is the primary data source for the Satisfaction Trend chart.
   */
  const chartData: ChartDataItem[] = useMemo(() => {
    // Explicitly type as ChartDataItem[]
    // Ensure dailyProgress is an array before mapping
    if (!dailyProgress) return [];

    const data = dailyProgress.map(p => ({
      date: format(new Date(p.date), 'MMM d'), // Format date string for display
      satisfaction: getSatisfactionInfo(p.satisfaction).numeric, // Use 'satisfaction' property from DailyProgress
      timeSpent: getTotalSessionMinutes(p.sessions), // Calculate total time spent in minutes from sessions
      // Efficiency calculation (satisfaction per hour spent). Avoid division by zero.
      efficiency:
        getTotalSessionMinutes(p.sessions) > 0
          ? getSatisfactionInfo(p.satisfaction).numeric / (getTotalSessionMinutes(p.sessions) / 60)
          : 0,
      movingAvg: 0, // Initialize movingAvg here
    }));

    // Calculate 7-day moving average for satisfaction.
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - 6); // Start index for the 7-day window
      const end = i + 1; // End index for the window
      const window = data.slice(start, end); // Extract the window of data
      const sum = window.reduce((acc, curr) => acc + curr.satisfaction, 0); // Sum satisfaction in the window
      data[i].movingAvg = parseFloat((sum / window.length).toFixed(2)); // Calculate average and format
    }

    return data;
  }, [dailyProgress]); // Dependency: re-calculate if dailyProgress changes

  /**
   * Memoized data for overall goal progress, including days passed, logged, and consistency rates.
   * Used in the RadialBarChart.
   */
  const goalProgressData = useMemo(() => {
    if (!goal) return null;

    const totalDays = differenceInDays(goal.endDate.toDate(), goal.startDate.toDate()) + 1; // Total duration of the goal
    const daysPassed = Math.min(
      differenceInDays(new Date(), goal.startDate.toDate()) + 1, // Days from goal start to today
      totalDays
    );
    // Count days where there's progress (satisfaction > neutral or some time spent)
    const daysLogged = dailyProgress.filter(
      p =>
        getSatisfactionInfo(p.satisfaction).numeric > SatisfactionLevel.NEUTRAL ||
        getTotalSessionMinutes(p.sessions) > 0
    ).length;

    const completionRate = (daysPassed / totalDays) * 100; // Percentage of goal period passed
    const loggingRate = daysPassed > 0 ? (daysLogged / daysPassed) * 100 : 0; // Consistency of logging

    return {
      totalDays,
      daysPassed,
      daysRemaining: Math.max(0, totalDays - daysPassed),
      daysLogged,
      completionRate,
      loggingRate,
    };
  }, [dailyProgress, goal]); // Dependencies: dailyProgress and goal

  /**
   * Memoized data for weekly consistency tracking.
   * Used in the BarChart for weekly consistency.
   */
  const consistencyData = useMemo(() => {
    if (!goal) return [];

    const weeks = [];
    let currentDate = goal.startDate.toDate(); // Start from goal's start date
    // End date for loop is min of today and goal end date, to avoid future dates
    const endDateForLoop = Math.min(new Date().getTime(), goal.endDate.toDate().getTime());

    while (currentDate.getTime() <= endDateForLoop) {
      const weekStart = startOfWeek(currentDate);
      const weekEnd = endOfWeek(currentDate);
      const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

      const weekProgress = weekDays
        // Filter days to be within goal start and current date (or goal end date)
        .filter(day => day >= goal.startDate.toDate() && day <= new Date())
        .map(day => {
          const dayKey = format(day, 'yyyy-MM-dd'); // Format date string correctly for lookup
          return dailyProgress.find(p => p.date === dayKey); // Find progress for this specific day
        });

      const activeDays = weekProgress.filter(
        p =>
          p &&
          (getSatisfactionInfo(p.satisfaction).numeric > SatisfactionLevel.NEUTRAL ||
            getTotalSessionMinutes(p.sessions) > 0)
      ).length; // Count days with logged progress

      const totalWeekDays = weekProgress.length;
      const consistency = totalWeekDays > 0 ? (activeDays / totalWeekDays) * 100 : 0; // Consistency percentage

      weeks.push({
        week: format(weekStart, 'MMM d'), // Label for the week
        consistency: parseFloat(consistency.toFixed(1)), // Format consistency percentage
        activeDays,
        totalDays: totalWeekDays,
      });

      // Move to the next week's start
      currentDate = new Date(weekEnd.getTime() + 24 * 60 * 60 * 1000);
    }

    return weeks;
  }, [dailyProgress, goal]); // Dependencies: dailyProgress and goal

  /**
   * Memoized data for cumulative hours invested and rolling average satisfaction.
   * Used in the Cumulative Progress chart.
   */
  const cumulativeTimeData = useMemo(() => {
    if (!dailyProgress) return [];

    let accumulatedTimeMinutes = 0;
    let accumulatedSatisfaction = 0;

    return dailyProgress.map((p, index) => {
      accumulatedTimeMinutes += getTotalSessionMinutes(p.sessions); // Accumulate minutes
      accumulatedSatisfaction += getSatisfactionInfo(p.satisfaction).numeric; // Accumulate satisfaction

      return {
        date: format(new Date(p.date), 'MMM d'), // Format date string
        cumulativeHours: parseFloat((accumulatedTimeMinutes / 60).toFixed(2)), // Convert to hours
        avgSatisfaction: parseFloat((accumulatedSatisfaction / (index + 1)).toFixed(2)), // Rolling average
      };
    });
  }, [dailyProgress]); // Dependency: dailyProgress

  /**
   * Memoized data for correlating time spent with satisfaction levels.
   * Used in the Time vs Satisfaction Analysis chart.
   */
  const correlationData = useMemo(() => {
    if (!chartData) return []; // Depends on chartData, which has been fixed

    return chartData.map(item => ({
      timeSpent: item.timeSpent, // Already uses minutes from chartData
      satisfaction: item.satisfaction, // Already from chartData
      efficiency: item.efficiency, // Already calculated in chartData
      date: item.date,
    }));
  }, [chartData]); // Dependency: chartData

  /**
   * Memoized data for weekly performance, averaged by day of the week.
   * Used in the Day-of-Week Performance Analysis chart.
   */
  const weeklyPerformance = useMemo(() => {
    if (!dailyProgress) return [];

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyData: {
      [key: number]: {
        totalSatisfaction: number;
        totalTime: number; // In minutes
        count: number;
        highSatisfactionDays: number;
      };
    } = {};

    dailyProgress.forEach(p => {
      const dayIndex = getDay(new Date(p.date)); // Get day of week (0-6)
      if (!weeklyData[dayIndex]) {
        weeklyData[dayIndex] = {
          totalSatisfaction: 0,
          totalTime: 0,
          count: 0,
          highSatisfactionDays: 0,
        };
      }
      const satisfaction = getSatisfactionInfo(p.satisfaction).numeric; // Use 'satisfaction'
      weeklyData[dayIndex].totalSatisfaction += satisfaction;
      weeklyData[dayIndex].totalTime += getTotalSessionMinutes(p.sessions); // Accumulate total minutes
      weeklyData[dayIndex].count++;
      if (satisfaction >= SatisfactionLevel.SATISFIED) weeklyData[dayIndex].highSatisfactionDays++; // Count high satisfaction days
    });

    return daysOfWeek.map((name, index) => ({
      name, // Day name (Sun, Mon, etc.)
      avgSatisfaction: weeklyData[index]
        ? parseFloat((weeklyData[index].totalSatisfaction / weeklyData[index].count).toFixed(2))
        : 0,
      avgTime: weeklyData[index]
        ? parseFloat((weeklyData[index].totalTime / weeklyData[index].count).toFixed(2))
        : 0, // Average time in minutes
      successRate: weeklyData[index]
        ? parseFloat(
            ((weeklyData[index].highSatisfactionDays / weeklyData[index].count) * 100).toFixed(1)
          )
        : 0,
    }));
  }, [dailyProgress]); // Dependency: dailyProgress

  /**
   * Memoized data for the distribution of satisfaction levels.
   * Used in the Satisfaction Level Distribution PieChart.
   */
  const satisfactionDistribution = useMemo(() => {
    if (!dailyProgress) return [];

    const distribution = new Map<SatisfactionLevel, number>();
    dailyProgress.forEach(p => {
      distribution.set(p.satisfaction, (distribution.get(p.satisfaction) || 0) + 1); // Use 'satisfaction'
    });

    return Array.from(distribution.entries()).map(([level, count]) => ({
      name: getSatisfactionInfo(level).label,
      value: count,
      percentage: parseFloat(((count / dailyProgress.length) * 100).toFixed(1)),
      color: getSatisfactionInfo(level).color,
    }));
  }, [dailyProgress]); // Dependency: dailyProgress

  // Render a message if no progress data is available.
  if (!dailyProgress || dailyProgress.length === 0) {
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
