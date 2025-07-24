'use client';

import React, { useState } from 'react';
import { useNotificationStore } from '@/store/useNotificationStore';
import { FiRefreshCcw } from 'react-icons/fi';

const SavingMinutesCalculator: React.FC = () => {
  const { showToast } = useNotificationStore();
  const [minutesSavedPerDay, setMinutesSavedPerDay] = useState<number | string>('');

  const [savingResult, setSavingResult] = useState<string | null>(null);

  const calculateSavings = () => {
    const minutes = parseFloat(minutesSavedPerDay as string);

    if (isNaN(minutes) || minutes < 0) {
      showToast('Please enter a valid positive number for minutes saved.', 'error');
      setSavingResult(null);
      return;
    }

    const dailyMinutes = minutes;
    const weeklyMinutes = dailyMinutes * 7;
    const monthlyMinutes = dailyMinutes * (365 / 12);
    const annualMinutes = dailyMinutes * 365;

    const formatMinutes = (totalMins: number) => {
      const days = Math.floor(totalMins / 1440);
      const hours = Math.floor((totalMins % 1440) / 60);
      const mins = Math.round(totalMins % 60);
      let result = '';
      if (days > 0) result += `${days} days `;
      if (hours > 0) result += `${hours} hours `;
      result += `${mins} minutes`;
      return result.trim();
    };

    setSavingResult(
      `Daily: ${formatMinutes(dailyMinutes)}
Weekly: ${formatMinutes(weeklyMinutes)}
Monthly: ${formatMinutes(monthlyMinutes)}
Annual: ${formatMinutes(annualMinutes)}`
    );
  };

  const clearFields = () => {
    setMinutesSavedPerDay('');
    setSavingResult(null);
    showToast('Fields cleared.', 'info');
  };

  return (
    <div className="p-4 bg-bg-primary rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-text-primary mb-4">Saving Minutes Calculator</h2>

      <div className="mb-4">
        <label htmlFor="minutesSaved" className="block text-text-secondary text-sm font-bold mb-2">
          Minutes Saved Per Day:
        </label>
        <input
          id="minutesSaved"
          type="number"
          step="any"
          className="w-full p-2 border border-border-primary rounded-md bg-bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={minutesSavedPerDay}
          onChange={e => setMinutesSavedPerDay(e.target.value)}
          placeholder="e.g., 10"
        />
      </div>

      <div className="flex space-x-2 mb-4">
        <button
          onClick={calculateSavings}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Calculate Savings
        </button>
        <button
          onClick={clearFields}
          className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          title="Clear Fields"
        >
          <FiRefreshCcw />
        </button>
      </div>

      {savingResult && (
        <div className="mt-4 p-3 bg-bg-secondary rounded-md border border-border-primary">
          <h3 className="text-lg font-semibold text-text-primary mb-2">Time Saved:</h3>
          <pre className="text-text-primary text-lg font-bold whitespace-pre-wrap">
            {savingResult}
          </pre>
        </div>
      )}
    </div>
  );
};
export default SavingMinutesCalculator;
