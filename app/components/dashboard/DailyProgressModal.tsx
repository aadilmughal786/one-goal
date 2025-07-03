// app/components/dashboard/DailyProgressModal.tsx
'use client';

import { useNotificationStore } from '@/store/useNotificationStore';
import { DailyProgress, RoutineLogStatus, RoutineType, SatisfactionLevel } from '@/types';
import { format } from 'date-fns';
import React, { useEffect, useRef, useState } from 'react';
import { FaTooth, FaWeightHanging } from 'react-icons/fa6';
import { FiCheckCircle, FiChevronDown, FiEdit3, FiLoader, FiX } from 'react-icons/fi';
import {
  MdOutlineDirectionsRun,
  MdOutlineNightlight,
  MdOutlineRestaurant,
  MdOutlineShower,
  MdOutlineWaterDrop,
} from 'react-icons/md';

// React Hook Form imports
import { dailyProgressFormSchema } from '@/utils/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

type DailyProgressFormData = z.infer<typeof dailyProgressFormSchema>;

interface DailyProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  initialProgress: DailyProgress | null;
  onSave: (progressData: Partial<DailyProgress>) => Promise<void>;
}

const satisfactionOptions = [
  { level: SatisfactionLevel.VERY_UNSATISFIED, label: 'Very Unsatisfied', color: 'bg-red-500' },
  { level: SatisfactionLevel.UNSATISFIED, label: 'Unsatisfied', color: 'bg-orange-500' },
  { level: SatisfactionLevel.NEUTRAL, label: 'Neutral', color: 'bg-yellow-500' },
  { level: SatisfactionLevel.SATISFIED, label: 'Satisfied', color: 'bg-lime-500' },
  { level: SatisfactionLevel.VERY_SATISFIED, label: 'Very Satisfied', color: 'bg-green-500' },
];

const routineData = [
  { type: RoutineType.SLEEP, label: 'Sleep', icon: MdOutlineNightlight },
  { type: RoutineType.WATER, label: 'Water', icon: MdOutlineWaterDrop },
  { type: RoutineType.EXERCISE, label: 'Exercise', icon: MdOutlineDirectionsRun },
  { type: RoutineType.MEAL, label: 'Meal', icon: MdOutlineRestaurant },
  { type: RoutineType.TEETH, label: 'Teeth', icon: FaTooth },
  { type: RoutineType.BATH, label: 'Bath', icon: MdOutlineShower },
];

const DailyProgressModal: React.FC<DailyProgressModalProps> = ({
  isOpen,
  onClose,
  date,
  initialProgress,
  onSave,
}) => {
  const showToast = useNotificationStore(state => state.showToast);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty, isValid },
  } = useForm<DailyProgressFormData>({
    resolver: zodResolver(dailyProgressFormSchema),
    defaultValues: {
      satisfaction: SatisfactionLevel.NEUTRAL,
      notes: '',
      weight: null,
    },
    mode: 'onTouched',
  });

  const selectedSatisfaction = watch('satisfaction');
  const [routines, setRoutines] = useState<Record<RoutineType, RoutineLogStatus>>(
    {} as Record<RoutineType, RoutineLogStatus>
  );
  const [routinesChanged, setRoutinesChanged] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      reset({
        satisfaction: initialProgress?.satisfaction || SatisfactionLevel.NEUTRAL,
        notes: initialProgress?.notes || '',
        weight: initialProgress?.weight,
      });

      const initialRoutinesData: Record<RoutineType, RoutineLogStatus> = Object.values(
        RoutineType
      ).reduce(
        (acc, type) => {
          acc[type] = initialProgress?.routines?.[type] || RoutineLogStatus.NOT_LOGGED;
          return acc;
        },
        {} as Record<RoutineType, RoutineLogStatus>
      );
      setRoutines(initialRoutinesData);
      setRoutinesChanged(false);
      setIsDropdownOpen(false);
    }
  }, [isOpen, initialProgress, reset]);

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      for (const key in errors) {
        const error = errors[key as keyof DailyProgressFormData];
        if (error?.message) {
          showToast(error.message, 'error');
        }
      }
    }
  }, [errors, showToast]);

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
      if (currentStatus === RoutineLogStatus.DONE) newStatus = RoutineLogStatus.SKIPPED;
      else if (currentStatus === RoutineLogStatus.SKIPPED) newStatus = RoutineLogStatus.NOT_LOGGED;
      else newStatus = RoutineLogStatus.DONE;
      return { ...prev, [type]: newStatus };
    });
    setRoutinesChanged(true);
  };

  const onSubmit: SubmitHandler<DailyProgressFormData> = async data => {
    const progressData: Partial<DailyProgress> = {
      date: format(date, 'yyyy-MM-dd'),
      satisfaction: data.satisfaction,
      notes: data.notes?.trim() || '',
      weight: data.weight || null,
      routines: routines,
    };
    try {
      await new Promise(resolve => setTimeout(resolve, 200));

      await onSave(progressData);
      onClose();
    } catch (error) {
      console.error('Failed to save daily progress:', error);
      showToast('Failed to save daily progress.', 'error');
    }
  };

  if (!isOpen) return null;

  const getStatusInfo = (status: RoutineLogStatus) => {
    switch (status) {
      case RoutineLogStatus.DONE:
        return { label: 'Done', color: 'bg-green-500/80 text-white' };
      case RoutineLogStatus.SKIPPED:
        return { label: 'Skipped', color: 'bg-red-500/80 text-white' };
      default:
        return {
          label: 'Not Logged',
          color: 'bg-bg-tertiary text-text-secondary hover:bg-border-primary',
        };
    }
  };

  const selectedOption = satisfactionOptions.find(opt => opt.level === selectedSatisfaction);

  return (
    <div
      className="flex fixed inset-0 z-40 justify-center items-center p-4 backdrop-blur-sm cursor-pointer bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="daily-progress-modal-title"
    >
      <div
        className="w-full max-w-md rounded-3xl border shadow-2xl backdrop-blur-md cursor-auto bg-bg-secondary border-border-primary"
        onClick={e => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex justify-between items-center px-6 py-4 border-b border-border-primary">
            <h2 id="daily-progress-modal-title" className="text-xl font-semibold text-text-primary">
              Log Progress for {format(date, 'MMMM d, yyyy')}
            </h2>
            <button
              type="button"
              className="p-1.5 rounded-full text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary focus:outline-none cursor-pointer"
              onClick={onClose}
              aria-label="Close modal"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            <div>
              <label className="block mb-2 text-sm font-medium text-text-secondary">
                <FiEdit3 className="inline -mt-1 mr-1" />
                Satisfaction Level
              </label>
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex justify-between items-center px-4 py-3 w-full text-lg text-left rounded-md border cursor-pointer text-text-primary bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-border-accent"
                  aria-haspopup="listbox"
                  aria-expanded={isDropdownOpen}
                >
                  {selectedOption ? (
                    <span className="flex gap-3 items-center">
                      <div className={`w-3 h-3 rounded-full ${selectedOption.color}`}></div>
                      {selectedOption.label}
                    </span>
                  ) : (
                    <span className="text-text-muted">Select a level...</span>
                  )}
                  <FiChevronDown
                    className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isDropdownOpen && (
                  <div
                    className="absolute z-10 p-2 mt-2 w-full rounded-md border shadow-lg bg-bg-tertiary border-border-primary"
                    role="listbox"
                  >
                    {satisfactionOptions.map(option => (
                      <button
                        key={option.level}
                        type="button"
                        onClick={() => {
                          setValue('satisfaction', option.level, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                          setIsDropdownOpen(false);
                        }}
                        className="flex gap-3 items-center px-3 py-2 w-full text-left rounded-md transition-colors cursor-pointer text-text-primary hover:bg-border-primary"
                        role="option"
                        aria-selected={selectedSatisfaction === option.level}
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
              <label
                htmlFor="weight"
                className="block mb-2 text-sm font-medium text-text-secondary"
              >
                <FaWeightHanging className="inline -mt-1 mr-1" />
                Weight (Optional)
              </label>
              <input
                id="weight"
                type="number"
                step="0.1"
                placeholder="e.g., 75.5"
                {...register('weight')}
                className="p-3 w-full text-base rounded-md border text-text-primary bg-bg-primary border-border-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-border-accent"
              />
            </div>

            <div>
              <label htmlFor="notes" className="block mb-2 text-sm font-medium text-text-secondary">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                rows={3}
                placeholder="Any thoughts, challenges, or wins from today?"
                {...register('notes')}
                className="p-3 w-full text-base rounded-md border resize-none text-text-primary bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-border-accent"
              />
            </div>
            <div>
              <label className="block mb-3 text-sm font-medium text-text-secondary">
                Log Daily Routines
              </label>
              <div className="grid grid-cols-3 gap-2 p-2 rounded-lg border sm:grid-cols-6 bg-bg-primary border-border-primary">
                {routineData.map(({ type, label, icon: Icon }) => {
                  const status = routines[type];
                  const statusInfo = getStatusInfo(status);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleToggleRoutine(type)}
                      className={`flex-1 flex flex-col items-center gap-1 p-3 text-xs font-semibold rounded-md transition-colors duration-200 cursor-pointer ${statusInfo.color}`}
                      title={`${label}: ${statusInfo.label}`}
                      aria-label={`${label}: ${statusInfo.label}. Click to toggle.`}
                    >
                      <Icon size={20} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-border-primary">
            <button
              type="submit"
              disabled={!isValid || (!isDirty && !routinesChanged) || isSubmitting}
              className="inline-flex gap-2 justify-center items-center px-6 py-3 w-full text-lg font-semibold text-black bg-white rounded-full transition-all duration-200 cursor-pointer hover:bg-gray-200 disabled:opacity-60"
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
        </form>
      </div>
    </div>
  );
};

export default DailyProgressModal;
