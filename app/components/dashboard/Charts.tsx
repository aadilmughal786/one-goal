// app/components/dashboard/Charts.tsx
'use client';

import { DailyProgress, Goal, SatisfactionLevel, StopwatchSession } from '@/types';
import {
  differenceInDays,
  eachDayOfInterval,
  endOfWeek,
  format,
  getDay,
  startOfWeek,
} from 'date-fns';
import React, { useMemo } from 'react';
import { FaWeightHanging } from 'react-icons/fa';
import {
  FiActivity,
  FiBarChart,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiStar,
  FiTarget,
  FiTrendingUp,
} from 'react-icons/fi';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
} from 'recharts';

interface ChartsProps {
  dailyProgress: DailyProgress[];
  goal: Goal | null;
}

interface ChartDataItem {
  date: string;
  satisfaction: number;
  timeSpent: number;
  efficiency: number;
  movingAvg: number;
}

const getSatisfactionInfo = (level: SatisfactionLevel) => {
  const info: Record<SatisfactionLevel, { color: string; label: string; numeric: number }> = {
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
  return info[level] || { color: '#9ca3af', label: 'Unknown', numeric: 0 };
};

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 text-sm rounded-lg border shadow-xl bg-bg-tertiary border-border-primary">
        <p className="font-bold text-text-primary">{label}</p>
        {payload.map((entry, index) => {
          const value = entry.value;
          let displayValue: string;

          if (typeof value === 'number') {
            if (entry.dataKey === 'cumulativeHours') {
              displayValue = `${value.toFixed(1)} hrs`;
            } else if (entry.dataKey === 'avgTime' || entry.dataKey === 'timeSpent') {
              displayValue = `${value.toFixed(1)} mins`;
            } else if (entry.dataKey === 'weight') {
              displayValue = `${value.toFixed(1)}`;
            } else if (
              entry.dataKey === 'completionRate' ||
              entry.dataKey === 'consistency' ||
              entry.dataKey === 'successRate'
            ) {
              displayValue = `${value.toFixed(0)}%`;
            } else if (
              entry.dataKey === 'satisfaction' ||
              entry.dataKey === 'avgSatisfaction' ||
              entry.dataKey === 'movingAvg'
            ) {
              displayValue = value.toFixed(1);
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
  const getTotalSessionMinutes = (sessions: StopwatchSession[] | undefined): number => {
    return (sessions || []).reduce((sum, s) => sum + s.duration, 0) / (1000 * 60);
  };

  const chartData: ChartDataItem[] = useMemo(() => {
    if (!dailyProgress) return [];
    const data = dailyProgress.map(p => ({
      date: format(new Date(p.date), 'MMM d'),
      satisfaction: getSatisfactionInfo(p.satisfaction).numeric,
      timeSpent: getTotalSessionMinutes(p.sessions),
      efficiency:
        getTotalSessionMinutes(p.sessions) > 0
          ? getSatisfactionInfo(p.satisfaction).numeric / (getTotalSessionMinutes(p.sessions) / 60)
          : 0,
      movingAvg: 0,
    }));
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - 6);
      const end = i + 1;
      const window = data.slice(start, end);
      const sum = window.reduce((acc, curr) => acc + curr.satisfaction, 0);
      data[i].movingAvg = parseFloat((sum / window.length).toFixed(2));
    }
    return data;
  }, [dailyProgress]);

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

  const goalProgressData = useMemo(() => {
    if (!goal) return null;
    const totalDays = differenceInDays(goal.endDate.toDate(), goal.startDate.toDate()) + 1;
    const daysPassed = Math.min(
      differenceInDays(new Date(), goal.startDate.toDate()) + 1,
      totalDays
    );
    const daysLogged = dailyProgress.filter(
      p =>
        getSatisfactionInfo(p.satisfaction).numeric > SatisfactionLevel.NEUTRAL ||
        getTotalSessionMinutes(p.sessions) > 0
    ).length;
    const completionRate = (daysPassed / totalDays) * 100;
    const loggingRate = daysPassed > 0 ? (daysLogged / daysPassed) * 100 : 0;
    return {
      totalDays,
      daysPassed,
      daysRemaining: Math.max(0, totalDays - daysPassed),
      daysLogged,
      completionRate,
      loggingRate,
    };
  }, [dailyProgress, goal]);

  const consistencyData = useMemo(() => {
    if (!goal) return [];
    const weeks = [];
    let currentDate = goal.startDate.toDate();
    const endDateForLoop = Math.min(new Date().getTime(), goal.endDate.toDate().getTime());
    while (currentDate.getTime() <= endDateForLoop) {
      const weekStart = startOfWeek(currentDate);
      const weekEnd = endOfWeek(currentDate);
      const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
      const weekProgress = weekDays
        .filter(day => day >= goal.startDate.toDate() && day <= new Date())
        .map(day => {
          const dayKey = format(day, 'yyyy-MM-dd');
          return dailyProgress.find(p => p.date === dayKey);
        });
      const activeDays = weekProgress.filter(
        p =>
          p &&
          (getSatisfactionInfo(p.satisfaction).numeric > SatisfactionLevel.NEUTRAL ||
            getTotalSessionMinutes(p.sessions) > 0)
      ).length;
      const totalWeekDays = weekProgress.length;
      const consistency = totalWeekDays > 0 ? (activeDays / totalWeekDays) * 100 : 0;
      weeks.push({
        week: format(weekStart, 'MMM d'),
        consistency: parseFloat(consistency.toFixed(1)),
        activeDays,
        totalDays: totalWeekDays,
      });
      currentDate = new Date(weekEnd.getTime() + 24 * 60 * 60 * 1000);
    }
    return weeks;
  }, [dailyProgress, goal]);

  const cumulativeTimeData = useMemo(() => {
    if (!dailyProgress) return [];
    let accumulatedTimeMinutes = 0;
    let accumulatedSatisfaction = 0;
    return dailyProgress.map((p, index) => {
      accumulatedTimeMinutes += getTotalSessionMinutes(p.sessions);
      accumulatedSatisfaction += getSatisfactionInfo(p.satisfaction).numeric;
      return {
        date: format(new Date(p.date), 'MMM d'),
        cumulativeHours: parseFloat((accumulatedTimeMinutes / 60).toFixed(2)),
        avgSatisfaction: parseFloat((accumulatedSatisfaction / (index + 1)).toFixed(2)),
      };
    });
  }, [dailyProgress]);

  const correlationData = useMemo(() => {
    if (!chartData) return [];
    return chartData.map(item => ({
      timeSpent: item.timeSpent,
      satisfaction: item.satisfaction,
      efficiency: item.efficiency,
      date: item.date,
    }));
  }, [chartData]);

  const weeklyPerformance = useMemo(() => {
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
      const dayIndex = getDay(new Date(p.date));
      if (!weeklyData[dayIndex]) {
        weeklyData[dayIndex] = {
          totalSatisfaction: 0,
          totalTime: 0,
          count: 0,
          highSatisfactionDays: 0,
        };
      }
      const satisfaction = getSatisfactionInfo(p.satisfaction).numeric;
      weeklyData[dayIndex].totalSatisfaction += satisfaction;
      weeklyData[dayIndex].totalTime += getTotalSessionMinutes(p.sessions);
      weeklyData[dayIndex].count++;
      if (satisfaction >= SatisfactionLevel.SATISFIED) weeklyData[dayIndex].highSatisfactionDays++;
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

  const satisfactionDistribution = useMemo(() => {
    if (!dailyProgress) return [];
    const distribution = new Map<SatisfactionLevel, number>();
    dailyProgress.forEach(p => {
      distribution.set(p.satisfaction, (distribution.get(p.satisfaction) || 0) + 1);
    });
    return Array.from(distribution.entries()).map(([level, count]) => ({
      name: getSatisfactionInfo(level).label,
      value: count,
      percentage: parseFloat(((count / dailyProgress.length) * 100).toFixed(1)),
      color: getSatisfactionInfo(level).color,
    }));
  }, [dailyProgress]);

  if (!dailyProgress || dailyProgress.length === 0) {
    return (
      <div className="p-8 text-center text-text-secondary">
        <FiBarChart className="mx-auto mb-4 text-4xl" />
        <p>No progress data available yet. Start logging your daily progress to see charts!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {goalProgressData && (
        <div className="card">
          <h3 className="flex gap-2 justify-center items-center mb-4 text-xl font-bold text-text-primary">
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
              <p className="text-sm text-text-secondary">Days Passed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">{goalProgressData.daysLogged}</p>
              <p className="text-sm text-text-secondary">Days Logged</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-400">{goalProgressData.daysRemaining}</p>
              <p className="text-sm text-text-secondary">Days Remaining</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-400">
                {goalProgressData.loggingRate.toFixed(0)}%
              </p>
              <p className="text-sm text-text-secondary">Consistency</p>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="flex gap-2 justify-center items-center mb-4 text-xl font-bold text-text-primary">
          <FiTrendingUp /> Satisfaction Trend & Moving Average
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid stroke="var(--color-border-primary)" strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke="var(--color-text-secondary)" fontSize={12} />
            <YAxis
              domain={[1, 5]}
              tickCount={5}
              stroke="var(--color-text-secondary)"
              fontSize={12}
            />
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

      {weightData.length > 1 && (
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
      )}

      {consistencyData.length > 0 && (
        <div className="card">
          <h3 className="flex gap-2 justify-center items-center mb-4 text-xl font-bold text-text-primary">
            <FiCalendar /> Weekly Consistency Tracking
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={consistencyData}>
              <CartesianGrid stroke="var(--color-border-primary)" strokeDasharray="3 3" />
              <XAxis dataKey="week" stroke="var(--color-text-secondary)" fontSize={12} />
              <YAxis
                stroke="var(--color-text-secondary)"
                fontSize={12}
                label={{
                  value: 'Consistency %',
                  angle: -90,
                  position: 'insideLeft',
                  fill: 'var(--color-text-secondary)',
                }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-bg-tertiary)' }} />
              <Legend iconType="circle" />
              <Bar dataKey="consistency" fill="#8b5cf6" name="Weekly Consistency %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card">
        <h3 className="flex gap-2 justify-center items-center mb-4 text-xl font-bold text-text-primary">
          <FiActivity /> Day-of-Week Performance Analysis
        </h3>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={weeklyPerformance}>
            <CartesianGrid stroke="var(--color-border-primary)" strokeDasharray="3 3" />
            <XAxis dataKey="name" stroke="var(--color-text-secondary)" fontSize={12} />
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
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-bg-tertiary)' }} />
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

      <div className="card">
        <h3 className="flex gap-2 justify-center items-center mb-4 text-xl font-bold text-text-primary">
          <FiClock /> Cumulative Progress & Satisfaction Trend
        </h3>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={cumulativeTimeData}>
            <CartesianGrid stroke="var(--color-border-primary)" strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke="var(--color-text-secondary)" fontSize={12} />
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
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-bg-tertiary)' }} />
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

      <div className="card">
        <h3 className="flex gap-2 justify-center items-center mb-4 text-xl font-bold text-text-primary">
          <FiStar /> Time vs Satisfaction Analysis
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={correlationData}>
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
              stroke="#38bdf8"
              name="Satisfaction Level"
              strokeWidth={2}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3 className="flex gap-2 justify-center items-center mb-4 text-xl font-bold text-text-primary">
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
                    fill="var(--color-text-primary)"
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
