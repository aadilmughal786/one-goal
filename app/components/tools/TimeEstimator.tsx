// app/components/tools/TimeEstimator.tsx
'use client';

import { DateTimePicker } from '@/components/common/DateTimePicker';
import { eachDayOfInterval, format, getDay } from 'date-fns';
import React, { useState } from 'react';
import { FiBriefcase, FiCalendar, FiMoon, FiTrendingUp, FiZap } from 'react-icons/fi';

const CircularProgress: React.FC<{
  days: number;
  totalDays: number;
  label: string;
  colorClass: string;
  icon: React.ReactNode;
}> = ({ days, totalDays, label, colorClass, icon }) => {
  const percentage = totalDays > 0 ? (days / totalDays) * 100 : 0;
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference * (1 - percentage / 100);

  return (
    <div className="flex flex-col items-center p-4 text-center rounded-2xl bg-bg-tertiary">
      <div className="relative w-40 h-40">
        <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="54"
            stroke="var(--color-border-primary)"
            strokeWidth="8"
            fill="transparent"
          />
          <circle
            cx="60"
            cy="60"
            r="54"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`transition-all duration-1000 ease-out ${colorClass}`}
          />
        </svg>
        <div className="flex absolute inset-0 flex-col justify-center items-center">
          <span className={`text-4xl font-bold ${colorClass}`}>{Math.round(days)}</span>
          <span className="text-sm text-text-secondary">Days</span>
        </div>
      </div>
      <div className="flex gap-2 items-center mt-4">
        {icon}
        <span className="font-semibold text-text-secondary">{label}</span>
      </div>
    </div>
  );
};

interface EstimationResult {
  totalDays: number;
  weekdays: number;
  weekendDays: number;
  productiveDays: number;
  sleepDays: number;
  personalDays: number;
  dayBreakdown: { date: Date; type: 'weekday' | 'weekend' }[];
}

const TimeEstimator: React.FC = () => {
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(() => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth;
  });

  const [isStartPickerOpen, setIsStartPickerOpen] = useState(false);
  const [isEndPickerOpen, setIsEndPickerOpen] = useState(false);

  const [result, setResult] = useState<EstimationResult | null>(null);

  const handleCalculate = () => {
    if (!startDate || !endDate || endDate <= startDate) {
      setResult(null);
      return;
    }

    const allDays = eachDayOfInterval({ start: startDate, end: endDate });
    let weekdays = 0;
    let weekendDays = 0;

    const dayBreakdown: { date: Date; type: 'weekday' | 'weekend' }[] = allDays.map(day => {
      const dayOfWeek = getDay(day);
      const type: 'weekday' | 'weekend' =
        dayOfWeek === 0 || dayOfWeek === 6 ? 'weekend' : 'weekday';
      if (type === 'weekend') {
        weekendDays++;
      } else {
        weekdays++;
      }
      return { date: day, type };
    });

    const totalDays = weekdays + weekendDays;
    const productiveDays = weekdays * (8 / 24);
    const sleepDays = totalDays * (8 / 24);
    const personalDays = weekdays * (8 / 24) + weekendDays;

    setResult({
      totalDays: Math.max(0, totalDays),
      weekdays,
      weekendDays,
      productiveDays: Math.max(0, productiveDays),
      sleepDays: Math.max(0, sleepDays),
      personalDays: Math.max(0, personalDays),
      dayBreakdown,
    });
  };

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="pb-40 space-y-8">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold text-text-primary">Effective Days Calculator</h2>
          <p className="mx-auto max-w-2xl text-text-secondary">
            A 30-day deadline isn&apos;t 30 full workdays. This tool shows your actual productive
            time by subtracting estimated days for sleep and life admin.
          </p>
        </div>

        {result ? (
          <div className="space-y-8 animate-fade-in-down">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <CircularProgress
                days={result.productiveDays}
                totalDays={result.totalDays}
                label="Effective Goal Days"
                colorClass="text-green-400"
                icon={<FiZap className="text-green-400" />}
              />
              <CircularProgress
                days={result.sleepDays}
                totalDays={result.totalDays}
                label="Days for Sleep"
                colorClass="text-blue-400"
                icon={<FiMoon className="text-blue-400" />}
              />
              <CircularProgress
                days={result.personalDays}
                totalDays={result.totalDays}
                label="Life Admin & Leisure"
                colorClass="text-purple-400"
                icon={<FiBriefcase className="text-purple-400" />}
              />
            </div>

            <div className="p-6 text-center rounded-2xl border bg-bg-tertiary border-border-primary">
              <p className="text-text-secondary">Total Days in Period</p>
              <p className="text-5xl font-bold text-text-primary">{result.totalDays}</p>
              <p className="mt-2 text-sm text-text-tertiary">
                ({result.weekdays} Weekdays & {result.weekendDays} Weekend Days)
              </p>
            </div>

            <div className="p-6 rounded-2xl border bg-bg-tertiary border-border-primary">
              <h3 className="mb-4 text-lg font-bold text-center text-text-primary">
                Daily Allocation Grid
              </h3>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {result.dayBreakdown.map(({ date, type }) => (
                  <div key={date.toISOString()} className="relative group">
                    <div
                      className={`w-4 h-4 rounded-sm ${type === 'weekday' ? 'bg-green-500' : 'bg-purple-500'}`}
                    />
                    <div className="absolute bottom-full left-1/2 px-2 py-1 mb-2 text-xs text-white rounded-md opacity-0 transition-opacity -translate-x-1/2 pointer-events-none bg-neutral-800 group-hover:opacity-100">
                      {format(date, 'MMM d,<x_bin_42>')}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 justify-center items-center mt-4 text-xs text-text-secondary">
                <span className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-green-500 rounded-sm" />
                  Work/Focus Day
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-purple-500 rounded-sm" />
                  Personal/Leisure Day
                </span>
              </div>
            </div>
            <p className="px-4 text-xs text-center text-text-muted">
              *Calculation based on the 8-8-8 model: 8 hours for work (on weekdays), 8 for sleep,
              and 8 for personal life. Weekends are allocated to personal/leisure.
            </p>
          </div>
        ) : (
          <div className="py-16 text-center text-text-muted">
            <p>Select your start and end dates below, then press &quot;Calculate&quot;.</p>
          </div>
        )}
      </div>

      <div className="fixed right-0 bottom-0 left-16 z-20 p-4 border-t backdrop-blur-md bg-bg-primary/50 border-border-primary">
        <div className="flex flex-col gap-4 justify-center items-center mx-auto max-w-3xl sm:flex-row">
          <button
            onClick={() => setIsStartPickerOpen(true)}
            className="flex flex-1 justify-between items-center p-3 w-full rounded-lg border transition-colors cursor-pointer sm:w-auto bg-bg-secondary border-border-primary hover:bg-bg-tertiary"
          >
            <span className="flex gap-2 items-center">
              <FiCalendar className="text-text-secondary" />
              <span className="text-sm font-semibold">Start:</span>
            </span>
            <span>{startDate ? format(startDate, 'MMM d,yyyy') : 'Select date'}</span>
          </button>

          <button
            onClick={() => setIsEndPickerOpen(true)}
            className="flex flex-1 justify-between items-center p-3 w-full rounded-lg border transition-colors cursor-pointer sm:w-auto bg-bg-secondary border-border-primary hover:bg-bg-tertiary"
          >
            <span className="flex gap-2 items-center">
              <FiCalendar className="text-text-secondary" />
              <span className="text-sm font-semibold">End:</span>
            </span>
            <span>{endDate ? format(endDate, 'MMM d,yyyy') : 'Select date'}</span>
          </button>

          <button
            onClick={handleCalculate}
            className="flex gap-2 justify-center items-center px-6 py-3 w-full font-semibold rounded-lg transition-transform cursor-pointer text-bg-primary bg-text-primary sm:w-auto hover:scale-105"
          >
            <FiTrendingUp />
            Calculate
          </button>
        </div>
      </div>

      <DateTimePicker
        isOpen={isStartPickerOpen}
        value={startDate}
        onChange={setStartDate}
        onClose={() => setIsStartPickerOpen(false)}
        mode="date"
      />
      <DateTimePicker
        isOpen={isEndPickerOpen}
        value={endDate}
        onChange={setEndDate}
        onClose={() => setIsEndPickerOpen(false)}
        mode="date"
      />
    </div>
  );
};

export default TimeEstimator;
