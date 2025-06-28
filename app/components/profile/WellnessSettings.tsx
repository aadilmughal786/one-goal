// app/components/profile/WellnessSettings.tsx
'use client';

import { useGoalStore } from '@/store/useGoalStore';
import { useWellnessStore } from '@/store/useWellnessStore';
import { ReminderSetting, ReminderType } from '@/types';
import React, { useEffect, useRef, useState } from 'react';
import { FiChevronDown, FiClock, FiEye, FiHeart, FiRefreshCw } from 'react-icons/fi';
// CORRECTED: Using a consistent icon set. All icons are now from react-icons/fi.
import { FiDroplet } from 'react-icons/fi';

const reminderOptions = [
  { type: ReminderType.WATER, label: 'Drink Water', icon: FiDroplet },
  { type: ReminderType.EYE_CARE, label: 'Eye Care', icon: FiEye },
  { type: ReminderType.STRETCH, label: 'Stretch', icon: FiRefreshCw },
  { type: ReminderType.BREAK, label: 'Take a Break', icon: FiClock },
];

// ADDED: 15 minutes option and sorted the array for better UX.
const frequencyOptions = [
  { label: '15 mins', value: 15 },
  { label: '30 mins', value: 30 },
  { label: '45 mins', value: 45 },
  { label: '60 mins', value: 60 },
  { label: '90 mins', value: 90 },
];

/**
 * A custom dropdown component for frequency selection, styled to match the app's theme.
 */
const CustomFrequencyDropdown: React.FC<{
  setting: ReminderSetting;
  onChange: (frequency: number) => void;
  disabled: boolean;
}> = ({ setting, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Effect to handle clicks outside the dropdown to close it.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel =
    frequencyOptions.find(opt => opt.value === setting.frequency)?.label ||
    `${setting.frequency} mins`;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex justify-between items-center px-3 py-2 w-36 text-white rounded-md border transition-colors bg-white/10 border-white/20 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{selectedLabel}</span>
        <FiChevronDown
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div
          className="absolute z-10 p-1 mt-2 w-36 rounded-md border shadow-lg bg-neutral-800 border-white/10 animate-fade-in-down"
          role="listbox"
        >
          {frequencyOptions.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className="block px-3 py-2 w-full text-left rounded hover:bg-blue-500/50"
              role="option"
              aria-selected={setting.frequency === opt.value}
            >
              Every {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const WellnessSettings: React.FC = () => {
  const settings = useWellnessStore(state => state.settings);
  const updateSetting = useWellnessStore(state => state.updateSetting);
  const activeGoal = useGoalStore(state =>
    state.appState?.activeGoalId ? state.appState.goals[state.appState.activeGoalId] : null
  );

  const handleToggle = (type: ReminderType, currentSetting: ReminderSetting) => {
    updateSetting(type, { ...currentSetting, enabled: !currentSetting.enabled });
  };

  const handleFrequencyChange = (
    type: ReminderType,
    currentSetting: ReminderSetting,
    frequency: number
  ) => {
    updateSetting(type, { ...currentSetting, frequency });
  };

  if (!settings || !activeGoal) {
    return (
      <div className="p-8 text-center bg-white/[0.02] border border-white/10 rounded-2xl">
        <FiHeart className="mx-auto mb-4 text-4xl text-white/40" />
        <p className="text-white/60">Select an active goal to configure your wellness reminders.</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl">
      <h2 className="mb-6 text-2xl font-bold text-white">Wellness Reminders</h2>
      <p className="mb-8 text-white/70">
        Enable periodic reminders to help you stay healthy and focused throughout the day. Reminders
        will only be active while the app is open.
      </p>
      <div className="space-y-6">
        {reminderOptions.map(({ type, label, icon: Icon }) => {
          const currentSetting = settings[type];
          return (
            <div
              key={type}
              className="flex flex-col gap-4 p-4 rounded-lg border sm:flex-row sm:items-center bg-black/20 border-white/5"
            >
              <div className="flex flex-grow gap-4 items-center">
                <Icon size={24} className="text-blue-400" />
                <span className="text-lg font-semibold">{label}</span>
              </div>
              <div className="flex gap-4 items-center">
                <CustomFrequencyDropdown
                  setting={currentSetting}
                  onChange={frequency => handleFrequencyChange(type, currentSetting, frequency)}
                  disabled={!currentSetting.enabled}
                />
                <button
                  onClick={() => handleToggle(type, currentSetting)}
                  className={`relative inline-flex items-center w-14 h-8 rounded-full transition-colors cursor-pointer ${
                    currentSetting.enabled ? 'bg-blue-600' : 'bg-white/20'
                  }`}
                  aria-pressed={currentSetting.enabled}
                  aria-label={`Toggle ${label} reminders`}
                >
                  <span
                    className={`inline-block w-6 h-6 bg-white rounded-full transition-transform transform ${
                      currentSetting.enabled ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WellnessSettings;
