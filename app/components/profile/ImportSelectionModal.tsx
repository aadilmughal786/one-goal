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
      <div className="flex flex-col w-full max-w-2xl max-h-[90vh] bg-white/[0.05] backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl">
        <div className="flex flex-shrink-0 justify-between items-center p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-semibold text-white">Select Goals to Import</h2>
            <p className="text-sm text-white/60">
              Choose which goals you want to add to your workspace.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 cursor-pointer"
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
                  className="flex gap-4 items-center p-4 rounded-lg border transition-colors cursor-pointer border-white/10 hover:bg-white/10 group"
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
                        : 'border-white/30 bg-black/20 group-hover:border-white/50'
                    }`}
                  >
                    {isSelected && <FiCheck className="w-4 h-4 text-white" />}
                  </span>

                  <FiFileText className="text-white/70" />
                  <div className="flex-grow">
                    <p className="font-semibold text-white">{goal.name}</p>
                    <p className="text-xs text-white/60">
                      Duration: {format(goal.startDate.toDate(), 'd MMM yy')} -{' '}
                      {format(goal.endDate.toDate(), 'd MMM yy')}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
        <div className="flex-shrink-0 p-6 border-t border-white/10">
          <button
            onClick={handleConfirm}
            disabled={selectedGoalIds.length === 0 || isImporting}
            className="inline-flex gap-2 justify-center items-center px-6 py-3 w-full text-lg font-semibold text-black bg-white rounded-full transition-all duration-200 hover:bg-white/90 disabled:opacity-50 cursor-pointer"
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
