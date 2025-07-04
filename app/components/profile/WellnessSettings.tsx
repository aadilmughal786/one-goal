// app/components/profile/WellnessSettings.tsx
'use client';

import { useGoalStore } from '@/store/useGoalStore';
import { useWellnessStore } from '@/store/useWellnessStore';
import { ReminderSetting, ReminderType } from '@/types';
import React, { useEffect, useRef, useState } from 'react';
import {
  FiArrowUpCircle,
  FiChevronDown,
  FiClock,
  FiDroplet,
  FiEye,
  FiHeart,
  FiRefreshCw,
} from 'react-icons/fi';

const reminderOptions = [
  { type: ReminderType.WATER, label: 'Drink Water', icon: FiDroplet },
  { type: ReminderType.EYE_CARE, label: 'Eye Care', icon: FiEye },
  { type: ReminderType.STRETCH, label: 'Stretch', icon: FiRefreshCw },
  { type: ReminderType.BREAK, label: 'Take a Break', icon: FiClock },
  { type: ReminderType.POSTURE, label: 'Posture Check', icon: FiArrowUpCircle },
];

const frequencyOptions = [
  { label: '15 mins', value: 15 },
  { label: '30 mins', value: 30 },
  { label: '45 mins', value: 45 },
  { label: '60 mins', value: 60 },
  { label: '90 mins', value: 90 },
];

const CustomFrequencyDropdown: React.FC<{
  setting: ReminderSetting;
  onChange: (frequency: number) => void;
  disabled: boolean;
}> = ({ setting, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
        className="flex justify-between items-center px-3 py-2 w-36 rounded-md border transition-colors text-text-primary bg-bg-tertiary border-border-secondary hover:bg-border-primary disabled:opacity-50 disabled:cursor-not-allowed"
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
          className="absolute z-10 p-1 mt-2 w-36 rounded-md border shadow-lg bg-bg-tertiary border-border-primary animate-fade-in-down"
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
              className="block px-3 py-2 w-full text-left rounded text-text-primary hover:bg-blue-500/50"
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
  const { settings, updateSetting } = useWellnessStore();
  const { appState } = useGoalStore();
  const activeGoal = appState?.activeGoalId ? appState.goals[appState.activeGoalId] : null;

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
      <div className="p-8 text-center card">
        <FiHeart className="mx-auto mb-4 text-4xl text-text-muted" />
        <p className="text-text-secondary">
          Select an active goal to configure your wellness reminders.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="mb-6 text-2xl font-bold text-text-primary">Wellness Reminders</h2>
      <p className="mb-8 text-text-secondary">
        Enable periodic reminders to help you stay healthy and focused throughout the day. Reminders
        will only be active while the app is open.
      </p>
      <div className="space-y-6">
        {reminderOptions.map(({ type, label, icon: Icon }) => {
          const currentSetting = settings[type];
          return (
            <div
              key={type}
              className="flex flex-col gap-4 p-4 rounded-lg border sm:flex-row sm:items-center bg-bg-primary border-border-secondary"
            >
              <div className="flex flex-grow gap-4 items-center">
                <Icon size={24} className="text-text-accent" />
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
                    currentSetting.enabled ? 'bg-blue-600' : 'bg-bg-tertiary'
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
