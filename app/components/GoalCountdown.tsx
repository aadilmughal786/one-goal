// src/components/GoalCountdown.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FiTarget, FiClock, FiAward } from 'react-icons/fi';
import { GoalData, UrgencyLevel } from '@/types'; // Import necessary types
import Stopwatch from '@/components/Stopwatch'; // Stopwatch is still a child of this section

interface GoalCountdownProps {
  goalData: GoalData | null;
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
}

const GoalCountdown: React.FC<GoalCountdownProps> = ({ goalData, showMessage }) => {
  // State to force re-render for countdown, actual time calc happens in render
  const [_, setTick] = useState(0);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Memoized functions for urgency and motivational message
  const getUrgencyLevel = useCallback((timeLeft: number, totalTime: number): UrgencyLevel => {
    const ratio = timeLeft / totalTime;
    if (ratio > 0.5) return 'low';
    if (ratio > 0.2) return 'medium';
    return 'high';
  }, []);

  const getMotivationalMessage = useCallback((urgency: UrgencyLevel, timeLeft: number): string => {
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    if (urgency === 'high') {
      return days > 1 ? "Final sprint! You've got this!" : 'The final hour approaches!';
    } else if (urgency === 'medium') {
      return 'Stay focused and keep pushing forward!';
    } else {
      return 'Great pace! Keep up the momentum!';
    }
  }, []);

  // Effect to manage the countdown interval
  useEffect(() => {
    if (goalData) {
      const endDate = new Date(goalData.endDate.toString());
      if (endDate.getTime() > Date.now()) {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = setInterval(() => {
          setTick(prev => prev + 1); // Trigger re-render every second
        }, 1000);
      } else {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      }
    } else {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    }
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [goalData]); // Re-run effect if goalData changes

  // Calculations for display
  const goalEndDate = goalData ? new Date(goalData.endDate.toString()) : null;
  const goalStartDate = goalData ? new Date(goalData.startDate.toString()) : null;
  const now = new Date();

  const timeLeft = goalEndDate ? goalEndDate.getTime() - now.getTime() : 0;
  const totalTime =
    goalEndDate && goalStartDate ? goalEndDate.getTime() - goalStartDate.getTime() : 1; // Avoid division by zero
  const progressPercent = Math.min(
    goalStartDate ? ((now.getTime() - goalStartDate.getTime()) / totalTime) * 100 : 0,
    100
  );

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  const urgency: UrgencyLevel =
    goalData && timeLeft > 0 ? getUrgencyLevel(timeLeft, totalTime) : 'low';
  const motivationalMessage =
    goalData && timeLeft > 0
      ? getMotivationalMessage(urgency, timeLeft)
      : goalData && timeLeft <= 0
        ? 'Goal achieved! Time to set a new one or celebrate this accomplishment.'
        : 'Set a new goal or celebrate your achievements!'; // Fallback for no goal, should not happen if this component renders based on goalData existence

  if (!goalData) {
    // This component should ideally only render when goalData is present,
    // but a defensive check ensures it doesn't break.
    return null;
  }

  return (
    <section id="countdownSection">
      <div className="p-8 mb-6 bg-white rounded-xl border border-gray-200 shadow-lg card-hover">
        <div className="flex flex-col justify-between items-start pb-4 mb-6 border-b md:flex-row md:items-center">
          <div>
            <h2 id="goalTitle" className="mb-2 text-3xl font-bold text-gray-900">
              {goalData.name}
            </h2>
            {goalData.description && (
              <p className="italic leading-relaxed text-gray-700 text-md">{goalData.description}</p>
            )}
          </div>
          <div className="flex gap-2 items-center mt-4 text-sm text-gray-500 md:mt-0">
            <span>Started:</span>
            <span id="startDate" className="font-medium text-gray-700">
              {goalStartDate?.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Countdown Display */}
        <div className="grid grid-cols-2 gap-6 pt-4 mb-8 md:grid-cols-4">
          <div className="p-4 text-center bg-gray-50 rounded-lg shadow-sm">
            <span
              className={`block mx-auto mb-1 text-5xl font-extrabold countdown-number ${timeLeft <= 0 ? 'text-gray-400' : `urgency-${urgency}`}`}
            >
              {Math.max(0, days)}
            </span>
            <span className="text-sm font-medium text-gray-600">Days</span>
          </div>
          <div className="p-4 text-center bg-gray-50 rounded-lg shadow-sm">
            <span
              className={`block mx-auto mb-1 text-5xl font-extrabold countdown-number ${timeLeft <= 0 ? 'text-gray-400' : `urgency-${urgency}`}`}
            >
              {Math.max(0, hours)}
            </span>
            <span className="text-sm font-medium text-gray-600">Hours</span>
          </div>
          <div className="p-4 text-center bg-gray-50 rounded-lg shadow-sm">
            <span
              className={`block mx-auto mb-1 text-5xl font-extrabold countdown-number ${timeLeft <= 0 ? 'text-gray-400' : `urgency-${urgency}`}`}
            >
              {Math.max(0, minutes)}
            </span>
            <span className="text-sm font-medium text-gray-600">Minutes</span>
          </div>
          <div className="p-4 text-center bg-gray-50 rounded-lg shadow-sm">
            <span
              className={`block mx-auto mb-1 text-5xl font-extrabold countdown-number ${timeLeft <= 0 ? 'text-gray-400' : `urgency-${urgency}`}`}
            >
              {Math.max(0, seconds)}
            </span>
            <span className="text-sm font-medium text-gray-600">Seconds</span>
          </div>
        </div>

        {/* Progress Ring & Urgency */}
        <div className="flex flex-col gap-8 justify-center items-center p-4 mb-6 bg-gray-50 rounded-lg md:flex-row">
          <div className="relative w-40 h-40">
            <svg width="160" height="160" className="transform -rotate-90">
              <circle cx="80" cy="80" r="70" fill="none" stroke="#e5e7eb" strokeWidth="10" />
              <circle
                id="progressCircle"
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="#000000" /* Black for progress */
                strokeWidth="10"
                strokeDasharray="439.8"
                strokeDashoffset={439.8 - (progressPercent / 100) * 439.8}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <div className="flex absolute inset-0 justify-center items-center">
              <span id="progressPercent" className="text-3xl font-bold text-gray-800">
                {Math.round(progressPercent)}%
              </span>
            </div>
          </div>

          <div className="text-center md:text-left">
            <p
              id="urgencyIndicator"
              className={`flex items-center justify-center md:justify-start gap-2 mb-2 text-xl font-medium ${timeLeft <= 0 ? 'text-gray-500' : `urgency-${urgency}`}`}
            >
              {timeLeft <= 0 ? (
                <FiAward className="w-6 h-6 text-green-600" />
              ) : urgency === 'high' ? (
                <FiAward className="w-6 h-6" />
              ) : urgency === 'medium' ? (
                <FiClock className="w-6 h-6" />
              ) : (
                <FiTarget className="w-6 h-6" />
              )}
              {timeLeft <= 0
                ? 'Goal Completed!'
                : urgency === 'high'
                  ? 'Urgent - Final Push!'
                  : urgency === 'medium'
                    ? 'Stay Focused'
                    : 'On Track'}
            </p>
            <p id="motivationalMessage" className="text-base italic text-gray-600">
              {motivationalMessage}
            </p>
          </div>
        </div>

        {/* Stopwatch Section */}
        <Stopwatch showMessage={showMessage} />
      </div>
    </section>
  );
};

export default GoalCountdown;
