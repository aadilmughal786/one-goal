// app/utils/dashboardChartUtils.ts
'use client';

import {
  ChartDataItem,
  CorrelationDataItem,
  DailyProgress,
  Goal,
  SatisfactionDistributionItem,
  SatisfactionLevel,
  StopwatchSession,
} from '@/types';
import { differenceInDays, format, getDay } from 'date-fns';
import { useMemo } from 'react';

export const getSatisfactionInfo = (level: SatisfactionLevel) => {
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

const getTotalSessionMinutes = (sessions: StopwatchSession[] | undefined): number => {
  return (sessions || []).reduce((sum, s) => sum + s.duration, 0) / (1000 * 60);
};

export const useChartData = (dailyProgress: DailyProgress[]) => {
  return useMemo(() => {
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
};

export const useWeightData = (dailyProgress: DailyProgress[]) => {
  return useMemo(() => {
    if (!dailyProgress) return [];
    return dailyProgress
      .filter(p => p.weight !== null && p.weight > 0)
      .map(p => ({
        date: format(new Date(p.date), 'MMM d'),
        weight: p.weight,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [dailyProgress]);
};

export const useGoalProgressData = (dailyProgress: DailyProgress[], goal: Goal | null) => {
  return useMemo(() => {
    if (!goal) return null;
    const totalDays = differenceInDays(goal.endDate.toDate(), goal.startDate.toDate()) + 1;
    const daysPassed = Math.min(
      differenceInDays(new Date(), goal.startDate.toDate()) + 1,
      totalDays
    );
    const daysLogged = dailyProgress.length;
    const unloggedDays = daysPassed - daysLogged;

    return {
      totalDays,
      daysPassed,
      daysRemaining: Math.max(0, totalDays - daysPassed),
      daysLogged,
      unloggedDays,
    };
  }, [dailyProgress, goal]);
};

export const useCorrelationData = (chartData: ChartDataItem[]): CorrelationDataItem[] => {
  return useMemo(() => {
    if (!chartData) return [];
    return chartData.map(item => ({
      timeSpent: item.timeSpent,
      satisfaction: item.satisfaction,
      efficiency: item.efficiency,
      date: item.date,
    }));
  }, [chartData]);
};

export const useWeeklyPerformance = (dailyProgress: DailyProgress[]) => {
  return useMemo(() => {
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
};

export const useSatisfactionDistribution = (
  dailyProgress: DailyProgress[]
): SatisfactionDistributionItem[] => {
  return useMemo(() => {
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
};

export const useSatisfactionForStackedBar = (
  satisfactionDistribution: SatisfactionDistributionItem[]
) => {
  return useMemo(() => {
    const data: { name: string; [key: string]: number | string } = {
      name: 'Satisfaction Distribution',
    };
    satisfactionDistribution.forEach(item => {
      data[item.name] = item.value;
    });
    return [data];
  }, [satisfactionDistribution]);
};
