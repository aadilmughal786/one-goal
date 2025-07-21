// app/components/tools/DailyTimePercentageCalculator.tsx
'use client';

import React, { useMemo, useState } from 'react';
import { FaClock } from 'react-icons/fa';

const DailyTimePercentageCalculator: React.FC = () => {
  const [minutes, setMinutes] = useState<number>(60);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMinutes(parseInt(e.target.value, 10));
  };

  const { formattedTime, selectedPercentage, comparisonText, progressPercent } = useMemo(() => {
    const MINUTES_IN_DAY = 1440;
    const REFERENCE_MINUTES = 15;

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    let ft = '';
    if (hours > 0) {
      ft += `${hours} hour${hours > 1 ? 's' : ''} `;
    }
    if (mins > 0 || hours === 0) {
      ft += `${mins} minute${mins !== 1 ? 's' : ''}`;
    }

    const sp = (minutes / MINUTES_IN_DAY) * 100;

    const ratio = minutes / REFERENCE_MINUTES;
    let ct = `Your selection is equal to the 15-minute reference.`;
    if (ratio > 1) {
      ct = `Your selection is ${ratio.toFixed(1)}x longer than 15 minutes.`;
    } else if (ratio < 1) {
      ct = `Your selection is ${(1 / ratio).toFixed(1)}x shorter than 15 minutes.`;
    }

    return {
      formattedTime: ft.trim(),
      selectedPercentage: sp.toFixed(2),
      comparisonText: ct,
      progressPercent: sp,
    };
  }, [minutes]);

  const CIRCLE_RADIUS = 90;
  const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;
  const strokeDashoffset = CIRCLE_CIRCUMFERENCE * (1 - progressPercent / 100);

  return (
    <div className="p-6 rounded-lg shadow-lg bg-bg-secondary text-text-primary">
      <h2 className="flex gap-3 items-center mb-2 text-2xl font-bold">
        <FaClock />
        Daily Time Impact
      </h2>
      <p className="mb-8 text-text-secondary">
        Visualize how any amount of time contributes to your entire day. Small chunks of time add
        up!
      </p>

      <div className="flex flex-col justify-center items-center my-8">
        <div className="relative w-64 h-64">
          <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 220 220">
            <circle
              cx="110"
              cy="110"
              r={CIRCLE_RADIUS}
              stroke="var(--color-border-primary)"
              strokeWidth="10"
              fill="transparent"
            />
            <circle
              cx="110"
              cy="110"
              r={CIRCLE_RADIUS}
              stroke="var(--color-text-accent)"
              strokeWidth="10"
              fill="transparent"
              strokeLinecap="round"
              strokeDasharray={CIRCLE_CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-300 ease-out"
            />
          </svg>
          <div className="flex absolute inset-0 flex-col justify-center items-center text-center">
            <span className="m-1 text-4xl font-bold text-text-primary">{selectedPercentage}%</span>
            <span className="text-sm text-text-secondary">of your day</span>
          </div>
        </div>
      </div>

      <div className="p-6 my-6 rounded-lg bg-bg-tertiary">
        <label
          htmlFor="minutesSlider"
          className="block mb-2 text-lg font-semibold text-center text-text-primary"
        >
          {formattedTime}
        </label>
        <input
          type="range"
          id="minutesSlider"
          min="15"
          max="1440"
          value={minutes}
          step="15"
          onChange={handleSliderChange}
          className="w-full h-3 rounded-lg appearance-none cursor-pointer bg-bg-primary accent-accent"
        />
        <div className="relative mt-2 h-4 text-xs text-text-muted">
          <span className="absolute" style={{ left: '0%' }}>
            15 min
          </span>
          <span className="absolute" style={{ left: '25%', transform: 'translateX(-50%)' }}>
            6h
          </span>
          <span className="absolute" style={{ left: '50%', transform: 'translateX(-50%)' }}>
            12h
          </span>
          <span className="absolute" style={{ right: '0%' }}>
            24h
          </span>
        </div>
      </div>

      <div className="p-4 mt-4 text-center rounded-md border bg-bg-primary border-border-primary text-text-primary">
        {comparisonText}
        <p className="mt-1 text-xs text-text-muted">(15 minutes is ~1.04% of a full day)</p>
      </div>
    </div>
  );
};

export default DailyTimePercentageCalculator;
