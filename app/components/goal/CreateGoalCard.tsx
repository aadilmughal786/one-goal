// app/components/goal/CreateGoalCard.tsx
'use client';

import { Goal } from '@/types';
import React, { useCallback } from 'react';
import { FiPlus, FiUpload } from 'react-icons/fi';

import { deserializeGoalForImport } from '@/services/dataService';
import { setUserData } from '@/services/goalService';
import { useGoalStore } from '@/store/useGoalStore';
import { useNotificationStore } from '@/store/useNotificationStore';

interface CreateGoalCardProps {
  onOpenGoalModal: (goal: Goal | null, isEditMode: boolean) => void;
}

const CreateGoalCard: React.FC<CreateGoalCardProps> = ({ onOpenGoalModal }) => {
  // FIX: Select state individually to prevent infinite loops.
  const currentUser = useGoalStore(state => state.currentUser);
  const appState = useGoalStore(state => state.appState);
  const showToast = useNotificationStore(state => state.showToast);
  const showConfirmation = useNotificationStore(state => state.showConfirmation);

  const handleImportGoal = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !currentUser) {
        showToast('No file selected or user not authenticated.', 'error');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showToast('File is too large (max 5MB).', 'error');
        event.target.value = '';
        return;
      }
      event.target.value = '';

      const reader = new FileReader();
      reader.onload = async e => {
        try {
          const importedRawData = JSON.parse(e.target?.result as string);
          const importedGoal = deserializeGoalForImport(importedRawData);

          const performImportAction = async () => {
            if (!currentUser || !appState) return;
            try {
              const newGoals = {
                ...appState.goals,
                [importedGoal.id]: importedGoal,
              };
              const newActiveGoalId = appState.activeGoalId || importedGoal.id;

              const newAppState = {
                ...appState,
                goals: newGoals,
                activeGoalId: newActiveGoalId,
              };

              await setUserData(currentUser.uid, newAppState);
              showToast(
                `Goal "${importedGoal.name}" imported successfully as a new goal!`,
                'success'
              );
              // Re-fetch data to update the store state correctly after import
              await useGoalStore.getState().fetchInitialData(currentUser);
            } catch (error) {
              console.error('Failed to import goal:', error);
              showToast(`Failed to import goal: ${(error as Error).message}`, 'error');
            }
          };

          showConfirmation({
            title: `Import Goal?`,
            message: `This will create a NEW goal from the imported file. It will not overwrite any existing goal. Proceed?`,
            action: performImportAction,
            actionDelayMs: 3000,
          });
        } catch (error) {
          console.error('Error processing imported file:', error);
          showToast('Import failed: Invalid file format or corrupted goal data.', 'error');
        }
      };
      reader.readAsText(file);
    },
    [currentUser, appState, showToast, showConfirmation]
  );

  return (
    <div className="p-4 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg flex flex-col justify-center items-center text-center">
      <h3 className="mb-4 text-xl font-bold text-white">New Goal</h3>
      <button
        onClick={() => onOpenGoalModal(null, false)}
        className="flex flex-col justify-center items-center mb-4 w-24 h-24 text-white rounded-full border-2 transition-all sm:w-32 sm:h-32 border-white/20 hover:bg-white/10 hover:border-white/40"
        aria-label="Create new goal"
      >
        <FiPlus size={48} />
      </button>
      <p className="mb-4 text-sm text-white/70">Click to define a new journey.</p>
      <label
        htmlFor="importIndividualGoalFile"
        className="inline-flex gap-2 items-center px-4 py-2 text-sm font-semibold text-white rounded-lg border transition-colors cursor-pointer border-white/10 bg-white/5 hover:bg-white/15"
        aria-label="Import a single goal"
      >
        <FiUpload size={16} /> Import Goal
      </label>
      <input
        type="file"
        id="importIndividualGoalFile"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleImportGoal}
      />
    </div>
  );
};

export default CreateGoalCard;
