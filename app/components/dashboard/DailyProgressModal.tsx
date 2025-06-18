// app/components/dashboard/DailyProgressModal.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiEdit3, FiCheckCircle, FiLoader, FiChevronDown } from 'react-icons/fi';
import { DailyProgress, SatisfactionLevel, RoutineLog, RoutineType } from '@/types';
import { format } from 'date-fns';
import {
  MdOutlineNightlight,
  MdOutlineWaterDrop,
  MdOutlineDirectionsRun,
  MdOutlineRestaurant,
  MdOutlineCleaningServices,
  MdOutlineShower,
} from 'react-icons/md';
import { IconType } from 'react-icons';

interface DailyProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  initialProgress: DailyProgress | null;
  onSave: (progressData: Partial<DailyProgress>) => Promise<void>;
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
}

const satisfactionOptions = [
  { level: SatisfactionLevel.VERY_LOW, label: 'Very Low', color: 'bg-red-500' },
  { level: SatisfactionLevel.LOW, label: 'Low', color: 'bg-orange-500' },
  { level: SatisfactionLevel.MEDIUM, label: 'Medium', color: 'bg-yellow-500' },
  { level: SatisfactionLevel.HIGH, label: 'High', color: 'bg-lime-500' },
  { level: SatisfactionLevel.VERY_HIGH, label: 'Very High', color: 'bg-green-500' },
];

const routineIcons: Record<RoutineType, IconType> = {
  [RoutineType.SLEEP]: MdOutlineNightlight,
  [RoutineType.WATER]: MdOutlineWaterDrop,
  [RoutineType.EXERCISE]: MdOutlineDirectionsRun,
  [RoutineType.MEALS]: MdOutlineRestaurant,
  [RoutineType.TEETH]: MdOutlineCleaningServices,
  [RoutineType.BATH]: MdOutlineShower,
};

const DailyProgressModal: React.FC<DailyProgressModalProps> = ({
  isOpen,
  onClose,
  date,
  initialProgress,
  onSave,
  showMessage,
}) => {
  const [satisfaction, setSatisfaction] = useState<SatisfactionLevel>(SatisfactionLevel.MEDIUM);
  const [notes, setNotes] = useState('');
  const [routineLog, setRoutineLog] = useState<RoutineLog>({} as RoutineLog);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSatisfaction(initialProgress?.satisfactionLevel || SatisfactionLevel.MEDIUM);
      setNotes(initialProgress?.progressNote || '');
      // Initialize a full routine log object, defaulting to null if not present
      const initialLog = Object.values(RoutineType).reduce((acc, type) => {
        acc[type] = initialProgress?.routineLog?.[type] ?? null;
        return acc;
      }, {} as RoutineLog);
      setRoutineLog(initialLog);
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
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggleRoutine = (type: RoutineType) => {
    setRoutineLog(prev => ({
      ...prev,
      [type]: prev[type] === true ? false : true,
    }));
  };

  const handleSubmit = async () => {
    if (satisfaction === null) {
      showMessage('Please select a satisfaction level.', 'error');
      return;
    }
    setIsSubmitting(true);

    const progressData: Partial<DailyProgress> = {
      date: format(date, 'yyyy-MM-dd'),
      satisfactionLevel: satisfaction,
      progressNote: notes.trim(),
      routineLog: routineLog,
    };

    try {
      await onSave(progressData);
      onClose();
    } catch {
      showMessage('Failed to save daily progress.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const selectedOption = satisfactionOptions.find(opt => opt.level === satisfaction);

  return (
    <div
      className="flex fixed inset-0 z-40 justify-center items-center p-4 backdrop-blur-sm bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-white/[0.05] backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">
            Log Progress for {format(date, 'MMMM d, yyyy')}
          </h2>
          <button className="p-1.5 text-white/60 rounded-full hover:bg-white/10" onClick={onClose}>
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
                className="flex justify-between items-center px-4 py-3 w-full text-lg text-left text-white rounded-md border cursor-pointer border-white/10 bg-black/20 focus:outline-none focus:ring-2 focus:ring-white/30"
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
                  className={`transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isDropdownOpen && (
                <div className="absolute z-10 p-2 mt-2 w-full rounded-lg border shadow-lg bg-neutral-900 border-white/10">
                  {satisfactionOptions.map(option => (
                    <button
                      key={option.level}
                      onClick={() => {
                        setSatisfaction(option.level);
                        setIsDropdownOpen(false);
                      }}
                      className="flex gap-3 items-center px-3 py-2 w-full text-left rounded-md transition-colors cursor-pointer hover:bg-white/10"
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
              className="p-3 w-full text-base text-white rounded-md border resize-none bg-black/20 border-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>

          {/* New Routine Logging Section */}
          <div>
            <label className="block mb-3 text-sm font-medium text-white/70">
              Log Daily Routines
            </label>
            <div className="grid grid-cols-3 gap-2 text-center">
              {Object.values(RoutineType).map(type => {
                const Icon = routineIcons[type];
                const status = routineLog[type];
                let buttonClasses =
                  'flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer transition-all duration-200 ';

                if (status === true) {
                  buttonClasses += 'bg-green-500/20 border-green-400/30 text-green-300';
                } else if (status === false) {
                  buttonClasses += 'bg-red-500/20 border-red-400/30 text-red-300';
                } else {
                  buttonClasses += 'bg-white/5 border-white/20 text-white/60 hover:bg-white/10';
                }

                return (
                  <button
                    key={type}
                    onClick={() => handleToggleRoutine(type)}
                    className={buttonClasses}
                    title={type.charAt(0).toUpperCase() + type.slice(1)}
                  >
                    <Icon size={24} />
                    <span className="mt-1 text-xs font-semibold capitalize">{type}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-white/10">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex gap-2 justify-center items-center px-6 py-3 w-full text-lg font-semibold text-black bg-white rounded-full transition-all duration-200 cursor-pointer hover:bg-white/90 disabled:opacity-60"
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
