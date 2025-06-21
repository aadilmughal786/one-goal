// app/components/dashboard/DailyProgressModal.tsx
'use client';

import { DailyProgress, RoutineLogStatus, RoutineType, SatisfactionLevel } from '@/types';
import { format } from 'date-fns';
import React, { useEffect, useRef, useState } from 'react';
import { FaTooth } from 'react-icons/fa6'; // Using a better icon for Teeth
import { FiCheckCircle, FiChevronDown, FiEdit3, FiLoader, FiX } from 'react-icons/fi';
import {
  MdOutlineDirectionsRun,
  MdOutlineNightlight,
  MdOutlineRestaurant,
  MdOutlineShower,
  MdOutlineWaterDrop,
} from 'react-icons/md';

interface DailyProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  initialProgress: DailyProgress | null;
  onSave: (progressData: Partial<DailyProgress>) => Promise<void>;
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
}

const satisfactionOptions = [
  { level: SatisfactionLevel.VERY_UNSATISFIED, label: 'Very Unsatisfied', color: 'bg-red-500' },
  { level: SatisfactionLevel.UNSATISFIED, label: 'Unsatisfied', color: 'bg-orange-500' },
  { level: SatisfactionLevel.NEUTRAL, label: 'Neutral', color: 'bg-yellow-500' },
  { level: SatisfactionLevel.SATISFIED, label: 'Satisfied', color: 'bg-lime-500' },
  { level: SatisfactionLevel.VERY_SATISFIED, label: 'Very Satisfied', color: 'bg-green-500' },
];

// Data structure for routine buttons, now with a better icon for Teeth.
const routineData = [
  { type: RoutineType.SLEEP, label: 'Sleep', icon: MdOutlineNightlight },
  { type: RoutineType.WATER, label: 'Water', icon: MdOutlineWaterDrop },
  { type: RoutineType.EXERCISE, label: 'Exercise', icon: MdOutlineDirectionsRun },
  { type: RoutineType.MEAL, label: 'Meal', icon: MdOutlineRestaurant },
  { type: RoutineType.TEETH, label: 'Teeth', icon: FaTooth }, // Updated Icon
  { type: RoutineType.BATH, label: 'Bath', icon: MdOutlineShower },
];

const DailyProgressModal: React.FC<DailyProgressModalProps> = ({
  isOpen,
  onClose,
  date,
  initialProgress,
  onSave,
  showMessage,
}) => {
  const [satisfaction, setSatisfaction] = useState<SatisfactionLevel>(SatisfactionLevel.NEUTRAL);
  const [notes, setNotes] = useState('');
  const [routines, setRoutines] = useState<Record<RoutineType, RoutineLogStatus>>(
    {} as Record<RoutineType, RoutineLogStatus>
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSatisfaction(initialProgress?.satisfaction || SatisfactionLevel.NEUTRAL);
      setNotes(initialProgress?.notes || '');
      const initialRoutines: Record<RoutineType, RoutineLogStatus> = Object.values(
        RoutineType
      ).reduce(
        (acc, type) => {
          acc[type] = initialProgress?.routines?.[type] || RoutineLogStatus.NOT_LOGGED;
          return acc;
        },
        {} as Record<RoutineType, RoutineLogStatus>
      );
      setRoutines(initialRoutines);
      setIsDropdownOpen(false);
    }
  }, [isOpen, initialProgress]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleRoutine = (type: RoutineType) => {
    setRoutines(prev => {
      const currentStatus = prev[type];
      let newStatus: RoutineLogStatus;
      if (currentStatus === RoutineLogStatus.DONE) {
        newStatus = RoutineLogStatus.SKIPPED;
      } else if (currentStatus === RoutineLogStatus.SKIPPED) {
        newStatus = RoutineLogStatus.NOT_LOGGED;
      } else {
        newStatus = RoutineLogStatus.DONE;
      }
      return { ...prev, [type]: newStatus };
    });
  };

  const handleSubmit = async () => {
    if (satisfaction === null) {
      showMessage('Please select a satisfaction level.', 'error');
      return;
    }
    setIsSubmitting(true);
    const progressData: Partial<DailyProgress> = {
      date: format(date, 'yyyy-MM-dd'),
      satisfaction: satisfaction,
      notes: notes.trim(),
      routines: routines,
    };
    try {
      await onSave(progressData);
      onClose();
    } catch (error) {
      console.error('Failed to save daily progress:', error);
      showMessage('Failed to save daily progress.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const selectedOption = satisfactionOptions.find(opt => opt.level === satisfaction);

  const getStatusInfo = (status: RoutineLogStatus) => {
    switch (status) {
      case RoutineLogStatus.DONE:
        return { label: 'Done', color: 'bg-green-500/80 text-white' };
      case RoutineLogStatus.SKIPPED:
        return { label: 'Skipped', color: 'bg-red-500/80 text-white' };
      default:
        return { label: 'Not Logged', color: 'bg-white/10 text-white/60 hover:bg-white/20' };
    }
  };

  return (
    <div
      className="flex fixed inset-0 z-40 justify-center items-center p-4 backdrop-blur-sm cursor-pointer bg-black/60"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="daily-progress-modal-title"
    >
      <div
        className="bg-white/[0.05] backdrop-blur-md border border-white/10 rounded-md shadow-2xl w-full max-w-md cursor-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with reduced vertical padding */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/10">
          <h2 id="daily-progress-modal-title" className="text-xl font-semibold text-white">
            Log Progress for {format(date, 'MMMM d, yyyy')}
          </h2>
          <button
            className="p-1.5 text-white/60 rounded-full hover:bg-white/10 cursor-pointer"
            onClick={onClose}
            aria-label="Close modal"
          >
            <FiX />
          </button>
        </div>
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block mb-2 text-sm font-medium text-white/70">
              <FiEdit3 className="inline -mt-1 mr-1" />
              Satisfaction Level
            </label>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex justify-between items-center px-4 py-3 w-full text-lg text-left text-white rounded-md border cursor-pointer border-white/10 bg-black/20 focus:outline-none focus:ring-2 focus:ring-white"
                aria-haspopup="listbox"
                aria-expanded={isDropdownOpen}
              >
                {selectedOption ? (
                  <span className="flex gap-3 items-center">
                    <div className={`w-3 h-3 rounded-full ${selectedOption.color}`}></div>
                    {selectedOption.label}
                  </span>
                ) : (
                  <span className="text-white/50">Select a level...</span>
                )}
                <FiChevronDown
                  className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isDropdownOpen && (
                <div
                  className="absolute z-10 p-2 mt-2 w-full rounded-md border shadow-lg bg-neutral-900 border-white/10"
                  role="listbox"
                >
                  {satisfactionOptions.map(option => (
                    <button
                      key={option.level}
                      onClick={() => {
                        setSatisfaction(option.level);
                        setIsDropdownOpen(false);
                      }}
                      className="flex gap-3 items-center px-3 py-2 w-full text-left rounded-md transition-colors cursor-pointer hover:bg-white/10"
                      role="option"
                      aria-selected={satisfaction === option.level}
                    >
                      <div className={`w-3 h-3 rounded-full ${option.color}`}></div>
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <label htmlFor="notes" className="block mb-2 text-sm font-medium text-white/70">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any thoughts, challenges, or wins from today?"
              className="p-3 w-full text-base text-white rounded-md border resize-none bg-black/20 border-white/10 focus:outline-none focus:ring-2 focus:ring-white"
            />
          </div>
          {/* Refactored Routine Toggles into a single icon row */}
          <div>
            <label className="block mb-3 text-sm font-medium text-white/70">
              Log Daily Routines
            </label>
            <div className="flex gap-2 p-2 rounded-lg border bg-black/20 border-white/10">
              {routineData.map(({ type, label, icon: Icon }) => {
                const status = routines[type];
                const statusInfo = getStatusInfo(status);
                return (
                  <button
                    key={type}
                    onClick={() => handleToggleRoutine(type)}
                    className={`flex-1 flex justify-center items-center p-3 text-sm font-semibold rounded-md transition-colors duration-200 cursor-pointer ${statusInfo.color}`}
                    title={`${label}: ${statusInfo.label}`}
                    aria-label={`${label}: ${statusInfo.label}. Click to toggle.`}
                  >
                    <Icon size={24} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        {/* Footer with reduced vertical padding */}
        <div className="px-6 py-4 border-t border-white/10">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex gap-2 justify-center items-center px-6 py-3 w-full text-lg font-semibold text-black bg-white rounded-md transition-all duration-200 cursor-pointer hover:bg-white/90 disabled:opacity-60"
            aria-label="Save daily progress"
          >
            {isSubmitting ? (
              <>
                <FiLoader className="w-5 h-5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <FiCheckCircle />
                <span>Save Progress</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyProgressModal;
