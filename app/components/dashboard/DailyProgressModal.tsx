// app/components/dashboard/DailyProgressModal.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DailyProgress, SatisfactionLevel, RoutineLogStatus, RoutineType } from '@/types'; // Import RoutineLogStatus
import { format } from 'date-fns';
import {
  FiX,
  FiEdit3,
  FiCheckCircle,
  FiLoader,
  FiChevronDown,
  FiAlertCircle,
  FiMinusCircle,
} from 'react-icons/fi'; // Added FiAlertCircle for SKIPPED, FiMinusCircle for NOT_LOGGED icons
import {
  MdOutlineNightlight,
  MdOutlineWaterDrop,
  MdOutlineDirectionsRun,
  MdOutlineRestaurant, // Corrected from MdOutlineRestaurantMenu to MdOutlineRestaurant if it's the right icon
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

// Options for satisfaction level dropdown, mapped to colors
const satisfactionOptions = [
  {
    level: SatisfactionLevel.VERY_UNSATISFIED,
    label: 'Very Unsatisfied',
    color: 'bg-red-500',
    textColor: 'text-red-400',
  },
  {
    level: SatisfactionLevel.UNSATISFIED,
    label: 'Unsatisfied',
    color: 'bg-orange-500',
    textColor: 'text-orange-400',
  },
  {
    level: SatisfactionLevel.NEUTRAL,
    label: 'Neutral',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-400',
  },
  {
    level: SatisfactionLevel.SATISFIED,
    label: 'Satisfied',
    color: 'bg-lime-500',
    textColor: 'text-lime-400',
  }, // Changed to lime
  {
    level: SatisfactionLevel.VERY_SATISFIED,
    label: 'Very Satisfied',
    color: 'bg-green-500',
    textColor: 'text-green-400',
  },
];

// Mapping of RoutineType enum values to their corresponding React icons
const routineIcons: Record<RoutineType, IconType> = {
  [RoutineType.SLEEP]: MdOutlineNightlight,
  [RoutineType.WATER]: MdOutlineWaterDrop,
  [RoutineType.EXERCISE]: MdOutlineDirectionsRun,
  [RoutineType.MEAL]: MdOutlineRestaurant, // Corrected to MEAL (singular)
  [RoutineType.TEETH]: MdOutlineCleaningServices,
  [RoutineType.BATH]: MdOutlineShower,
};

/**
 * DailyProgressModal Component
 *
 * This modal allows users to log their daily progress, including satisfaction level,
 * notes, and completion status for various daily routines.
 */
const DailyProgressModal: React.FC<DailyProgressModalProps> = ({
  isOpen,
  onClose,
  date,
  initialProgress,
  onSave,
  showMessage,
}) => {
  // State for satisfaction level, notes, and routine log
  const [satisfaction, setSatisfaction] = useState<SatisfactionLevel>(SatisfactionLevel.NEUTRAL); // Default to NEUTRAL
  const [notes, setNotes] = useState('');
  // Routine log state, explicitly typed to map RoutineType to RoutineLogStatus
  const [routines, setRoutines] = useState<Record<RoutineType, RoutineLogStatus>>(() => {
    // Initialize all routine types to NOT_LOGGED
    const defaultRoutines = Object.values(RoutineType).reduce(
      (acc, type) => {
        acc[type] = RoutineLogStatus.NOT_LOGGED;
        return acc;
      },
      {} as Record<RoutineType, RoutineLogStatus>
    );
    return defaultRoutines;
  });
  const [isSubmitting, setIsSubmitting] = useState(false); // State for submission loading
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // State for satisfaction dropdown visibility
  const dropdownRef = useRef<HTMLDivElement>(null); // Ref for click-outside detection for dropdown

  // Effect to synchronize modal state with initialProgress prop when modal opens or initialProgress changes
  useEffect(() => {
    if (isOpen) {
      setSatisfaction(initialProgress?.satisfaction || SatisfactionLevel.NEUTRAL); // Use 'satisfaction'
      setNotes(initialProgress?.notes || ''); // Use 'notes'

      // Initialize routine log: Default all to NOT_LOGGED, then apply initial values if they exist
      const initialRoutines: Record<RoutineType, RoutineLogStatus> = Object.values(
        RoutineType
      ).reduce(
        (acc, type) => {
          acc[type] = RoutineLogStatus.NOT_LOGGED; // Default to NOT_LOGGED
          return acc;
        },
        {} as Record<RoutineType, RoutineLogStatus>
      );

      if (initialProgress?.routines) {
        // Merge existing routines into the initialized object
        Object.keys(initialProgress.routines).forEach(key => {
          const routineTypeKey = key as RoutineType;
          if (Object.values(RoutineType).includes(routineTypeKey)) {
            initialRoutines[routineTypeKey] = initialProgress.routines[routineTypeKey];
          }
        });
      }
      setRoutines(initialRoutines);
      setIsDropdownOpen(false); // Ensure dropdown is closed when modal opens
    }
  }, [isOpen, initialProgress]); // Dependencies: re-run if modal opens/closes or initialProgress changes

  // Effect for closing the satisfaction dropdown when clicking outside.
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

  /**
   * Toggles the status of a specific routine.
   * Cycles through RoutineLogStatus: NOT_LOGGED (0) -> DONE (1) -> SKIPPED (2) -> NOT_LOGGED (0).
   * @param type The RoutineType to toggle.
   */
  const handleToggleRoutine = (type: RoutineType) => {
    setRoutines(prev => {
      const currentStatus = prev[type];
      let newStatus: RoutineLogStatus;

      if (currentStatus === RoutineLogStatus.DONE) {
        newStatus = RoutineLogStatus.SKIPPED;
      } else if (currentStatus === RoutineLogStatus.SKIPPED) {
        newStatus = RoutineLogStatus.NOT_LOGGED;
      } else {
        // Default (NOT_LOGGED or undefined/null) goes to DONE
        newStatus = RoutineLogStatus.DONE;
      }
      return { ...prev, [type]: newStatus };
    });
  };

  /**
   * Handles the submission of the daily progress form.
   * Validates input, constructs the progress data, and calls the `onSave` prop.
   */
  const handleSubmit = async () => {
    if (satisfaction === null) {
      // Satisfaction is a required field
      showMessage('Please select a satisfaction level.', 'error');
      return;
    }
    setIsSubmitting(true); // Set submission loading state

    // Construct the partial DailyProgress object to save
    const progressData: Partial<DailyProgress> = {
      date: format(date, 'yyyy-MM-dd'), // Format the date to a 'YYYY-MM-DD' string key
      satisfaction: satisfaction, // Use 'satisfaction'
      notes: notes.trim(), // Use 'notes'
      routines: routines, // Use 'routines'
      // stopwatchSessions are managed by Stopwatch functionality, not directly here.
      // EffortTimeMinutes is derived by the firebaseService, not passed here.
    };

    try {
      await onSave(progressData); // Call the parent's save function
      onClose(); // Close the modal on successful save
    } catch (error) {
      console.error('Failed to save daily progress:', error);
      showMessage('Failed to save daily progress.', 'error');
    } finally {
      setIsSubmitting(false); // Clear submission loading state
    }
  };

  // If modal is not open, don't render anything to optimize performance.
  if (!isOpen) return null;

  // Get the currently selected satisfaction option for display in the dropdown button.
  const selectedOption = satisfactionOptions.find(opt => opt.level === satisfaction);

  return (
    <div
      className="flex fixed inset-0 z-40 justify-center items-center p-4 backdrop-blur-sm bg-black/60"
      onClick={onClose} // Close modal on outside click
      role="dialog" // ARIA role for dialog
      aria-modal="true" // ARIA attribute to indicate it's a modal dialog
      aria-labelledby="daily-progress-modal-title" // Link to title for accessibility
    >
      <div
        className="bg-white/[0.05] backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl w-full max-w-md"
        onClick={e => e.stopPropagation()} // Prevent clicks inside content from closing modal
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <h2 id="daily-progress-modal-title" className="text-xl font-semibold text-white">
            Log Progress for {format(date, 'MMMM d,PPPP')} {/* PPPP for full date format */}
          </h2>
          <button
            className="p-1.5 text-white/60 rounded-full hover:bg-white/10"
            onClick={onClose}
            aria-label="Close modal"
          >
            <FiX />
          </button>
        </div>

        {/* Modal Body: Scrollable content area for forms */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Satisfaction Level Selector */}
          <div>
            <label className="block mb-2 text-sm font-medium text-white/70">
              <FiEdit3 className="inline -mt-1 mr-1" />
              Satisfaction Level
            </label>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex justify-between items-center px-4 py-3 w-full text-lg text-left text-white rounded-md border cursor-pointer border-white/10 bg-black/20 focus:outline-none focus:ring-2 focus:ring-white/30"
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
                  className={`transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isDropdownOpen && (
                <div
                  className="absolute z-10 p-2 mt-2 w-full rounded-lg border shadow-lg bg-neutral-900 border-white/10"
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

          {/* Notes Textarea */}
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

          {/* Routine Logging Section */}
          <div>
            <label className="block mb-3 text-sm font-medium text-white/70">
              Log Daily Routines
            </label>
            <div className="grid grid-cols-3 gap-2 text-center">
              {Object.values(RoutineType).map(type => {
                const Icon = routineIcons[type]; // Get icon component for the routine type
                const status = routines[type]; // Get the current status for this routine type

                let buttonClasses =
                  'flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer transition-all duration-200 ';
                let statusLabel = ''; // For accessibility and display

                // Apply dynamic classes and status labels based on RoutineLogStatus
                if (status === RoutineLogStatus.DONE) {
                  buttonClasses += 'bg-green-500/20 border-green-400/30 text-green-300';
                  statusLabel = 'Done';
                } else if (status === RoutineLogStatus.SKIPPED) {
                  buttonClasses += 'bg-red-500/20 border-red-400/30 text-red-300';
                  statusLabel = 'Skipped';
                } else {
                  // RoutineLogStatus.NOT_LOGGED
                  buttonClasses += 'bg-white/5 border-white/20 text-white/60 hover:bg-white/10';
                  statusLabel = 'Not Logged';
                }

                return (
                  <button
                    key={type}
                    onClick={() => handleToggleRoutine(type)}
                    className={buttonClasses}
                    title={`${type.charAt(0).toUpperCase() + type.slice(1)}: ${statusLabel}`} // Tooltip for status
                    aria-label={`${type.charAt(0).toUpperCase() + type.slice(1)}: ${statusLabel}. Click to toggle.`}
                  >
                    <Icon size={24} />
                    <span className="mt-1 text-xs font-semibold capitalize">{type}</span>
                    {/* Optional: Add a small indicator for current status */}
                    {status === RoutineLogStatus.DONE && (
                      <FiCheckCircle className="mt-1 text-xs text-green-300" />
                    )}
                    {status === RoutineLogStatus.SKIPPED && (
                      <FiAlertCircle className="mt-1 text-xs text-red-300" />
                    )}
                    {status === RoutineLogStatus.NOT_LOGGED && (
                      <FiMinusCircle className="mt-1 text-xs text-white/40" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        {/* Modal Footer: Save Button */}
        <div className="p-6 border-t border-white/10">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting} // Disable button while submitting
            className="inline-flex gap-2 justify-center items-center px-6 py-3 w-full text-lg font-semibold text-black bg-white rounded-full transition-all duration-200 cursor-pointer hover:bg-white/90 disabled:opacity-60"
            aria-label="Save daily progress"
          >
            {isSubmitting ? (
              // Show loading spinner when submitting
              <>
                <FiLoader className="w-5 h-5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              // Show check icon and text when not submitting
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
