// app/components/goal/CreateGoalCard.tsx
'use client';

import { Goal } from '@/types';
import React, { useCallback } from 'react';
import { FiPlus, FiUpload } from 'react-icons/fi';

import { deserializeGoalsForImport } from '@/services/dataService';
import { useGoalStore } from '@/store/useGoalStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { serializableGoalsArraySchema } from '@/utils/schemas';

interface CreateGoalCardProps {
  onOpenGoalModal: (goal: Goal | null, isEditMode: boolean) => void;
  onGoalsImported: (goals: Goal[]) => void;
}

const CreateGoalCard: React.FC<CreateGoalCardProps> = ({ onOpenGoalModal, onGoalsImported }) => {
  const currentUser = useGoalStore(state => state.currentUser);
  const showToast = useNotificationStore(state => state.showToast);

  const handleImportGoal = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !currentUser) {
        showToast('No file selected or user not authenticated.', 'error');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showToast('File is too large (max 5MB).', 'error');
        if (event.target) event.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = async e => {
        try {
          const importedRawData = JSON.parse(e.target?.result as string);
          const validation = serializableGoalsArraySchema.safeParse(importedRawData);
          if (!validation.success) {
            showToast('Import failed. Invalid file format: should be an array of goals.', 'error');
            return;
          }

          const deserializedGoals = deserializeGoalsForImport(validation.data);

          if (deserializedGoals.length === 0) {
            showToast('The selected file contains no goals to import.', 'info');
            return;
          }

          onGoalsImported(deserializedGoals);
        } catch (error) {
          console.error('Error processing imported file:', error);
          showToast('Import failed: Invalid file format or corrupted goal data.', 'error');
        } finally {
          if (event.target) {
            event.target.value = '';
          }
        }
      };
      reader.readAsText(file);
    },
    [currentUser, showToast, onGoalsImported]
  );

  return (
    <div className="p-4 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg flex flex-col justify-center items-center text-center">
      <h3 className="mb-4 text-xl font-bold text-white">New Goal</h3>
      <button
        onClick={() => onOpenGoalModal(null, false)}
        className="flex flex-col justify-center items-center mb-4 w-24 h-24 text-white rounded-full border-2 transition-all sm:w-32 sm:h-32 border-white/20 hover:bg-white/10 hover:border-white/40 cursor-pointer"
        aria-label="Create new goal"
      >
        <FiPlus size={48} />
      </button>
      <p className="mb-4 text-sm text-white/70">Click to define a new journey.</p>
      <label
        htmlFor="importGoalFileFromCard"
        className="inline-flex gap-2 items-center px-4 py-2 text-sm font-semibold text-white rounded-lg border transition-colors cursor-pointer border-white/10 bg-white/5 hover:bg-white/15"
        aria-label="Import goals from file"
      >
        <FiUpload size={16} /> Import Goal(s)
      </label>
      <input
        type="file"
        id="importGoalFileFromCard"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleImportGoal}
      />
    </div>
  );
};

export default CreateGoalCard;
