// app/components/profile/ImportSelectionModal.tsx
'use client';

import { Goal } from '@/types';
import { format } from 'date-fns';
import React, { useState } from 'react';
import { FiCheck, FiFileText, FiLoader, FiX } from 'react-icons/fi';

interface ImportSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalsToImport: Goal[];
  onConfirmImport: (selectedGoals: Goal[]) => Promise<void>;
}

const ImportSelectionModal: React.FC<ImportSelectionModalProps> = ({
  isOpen,
  onClose,
  goalsToImport,
  onConfirmImport,
}) => {
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const handleToggleSelection = (goalId: string) => {
    setSelectedGoalIds(prev =>
      prev.includes(goalId) ? prev.filter(id => id !== goalId) : [...prev, goalId]
    );
  };

  const handleConfirm = async () => {
    setIsImporting(true);
    const selectedGoals = goalsToImport.filter(g => selectedGoalIds.includes(g.id));
    await onConfirmImport(selectedGoals);
    setIsImporting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="flex fixed inset-0 z-50 justify-center items-center p-4 backdrop-blur-sm bg-black/60">
      <div className="flex flex-col w-full max-w-2xl max-h-[90vh] bg-bg-secondary backdrop-blur-md border border-border-primary rounded-3xl shadow-2xl">
        <div className="flex flex-shrink-0 justify-between items-center p-6 border-b border-border-primary">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">Select Goals to Import</h2>
            <p className="text-sm text-text-secondary">
              Choose which goals you want to add to your workspace.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary cursor-pointer"
            aria-label="Close modal"
          >
            <FiX size={20} />
          </button>
        </div>
        <div className="overflow-y-auto flex-grow p-6">
          <div className="space-y-3">
            {goalsToImport.map(goal => {
              const isSelected = selectedGoalIds.includes(goal.id);
              return (
                <label
                  key={goal.id}
                  className="flex gap-4 items-center p-4 rounded-lg border transition-colors cursor-pointer border-border-primary hover:bg-bg-tertiary group"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleSelection(goal.id)}
                    className="sr-only"
                  />
                  <span
                    className={`flex items-center justify-center w-6 h-6 rounded-md border-2 transition-all duration-300 ${
                      isSelected
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-border-secondary bg-bg-primary group-hover:border-border-accent'
                    }`}
                  >
                    {isSelected && <FiCheck className="w-4 h-4 text-white" />}
                  </span>

                  <FiFileText className="text-text-secondary" />
                  <div className="flex-grow">
                    <p className="font-semibold text-text-primary">{goal.name}</p>
                    <p className="text-xs text-text-tertiary">
                      Duration: {format(goal.startDate.toDate(), 'd MMM yy')} -{' '}
                      {format(goal.endDate.toDate(), 'd MMM yy')}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
        <div className="flex-shrink-0 p-6 border-t border-border-primary">
          <button
            onClick={handleConfirm}
            disabled={selectedGoalIds.length === 0 || isImporting}
            className="inline-flex gap-2 justify-center items-center px-6 py-3 w-full text-lg font-semibold rounded-full transition-all duration-200 cursor-pointer text-bg-primary bg-text-primary hover:opacity-90 disabled:opacity-50"
          >
            {isImporting ? <FiLoader className="animate-spin" /> : <FiCheck />}
            Import ({selectedGoalIds.length}) Selected Goals
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportSelectionModal;
