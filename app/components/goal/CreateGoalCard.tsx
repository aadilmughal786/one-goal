// app/components/goal/CreateGoalCard.tsx
'use client';

import { firebaseService } from '@/services/firebaseService'; // Import firebaseService
import { AppState, Goal } from '@/types'; // Import AppState and Goal types
import { User } from 'firebase/auth'; // Import User type
import React, { useCallback } from 'react';
import { FiPlus, FiUpload } from 'react-icons/fi'; // Icons for plus and upload

interface CreateGoalCardProps {
  currentUser: User | null;
  appState: AppState | null;
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
  onAppStateUpdate: (newAppState: AppState) => void;
  onOpenGoalModal: (goal: Goal | null, isEditMode: boolean) => void; // To open goal creation modal
  onOpenConfirmationModal: (props: {
    title: string;
    message: string;
    action: () => Promise<void> | void;
    actionDelayMs?: number;
  }) => void; // For import confirmation
}

/**
 * CreateGoalCard Component
 *
 * A specialized card that provides a prominent button to create a new goal.
 * It also includes an option to import an individual goal's data from a JSON file.
 */
const CreateGoalCard: React.FC<CreateGoalCardProps> = ({
  currentUser,
  appState,
  showMessage,
  onAppStateUpdate,
  onOpenGoalModal,
  onOpenConfirmationModal,
}) => {
  /**
   * Handles the change event for the hidden file input used for importing a single goal.
   * Reads the file, deserializes the goal data, and then creates a new goal from it.
   */
  const handleImportGoal = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !currentUser) {
        showMessage('No file selected or user not authenticated.', 'error');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        // Limit file size to 5MB
        showMessage('File is too large (max 5MB).', 'error');
        event.target.value = ''; // Clear input for next attempt
        return;
      }
      event.target.value = ''; // Clear file input value to allow re-uploading the same file

      const reader = new FileReader();
      reader.onload = async e => {
        try {
          const importedRawData = JSON.parse(e.target?.result as string);
          // Deserialize the imported goal data. This method is designed to create a NEW goal from the data.
          const importedGoal: Goal = firebaseService.deserializeGoalForImport(importedRawData);

          // Action to perform after confirmation (create the new goal from import)
          const performImportAction = async () => {
            if (!currentUser || !appState) return;
            try {
              // Add the deserialized goal to the user's goals in Firebase
              // No direct addGoal method, so we update the entire goals map
              const newGoals = {
                ...appState.goals,
                [importedGoal.id]: importedGoal,
              };
              // If no active goal, make this new imported one active
              const newActiveGoalId = appState.activeGoalId || importedGoal.id;

              await firebaseService.setUserData(currentUser.uid, {
                ...appState,
                goals: newGoals,
                activeGoalId: newActiveGoalId,
              });
              onAppStateUpdate({ ...appState, goals: newGoals, activeGoalId: newActiveGoalId }); // Update local state
              showMessage(
                `Goal "${importedGoal.name}" imported successfully as a new goal!`,
                'success'
              );
            } catch (error) {
              console.error('Failed to import goal:', error);
              showMessage(`Failed to import goal: ${(error as Error).message}`, 'error');
            }
          };

          // Confirm before importing to create a new goal
          onOpenConfirmationModal({
            title: `Import Goal?`,
            message: `This will create a NEW goal from the imported file. It will not overwrite any existing goal. Proceed?`,
            action: performImportAction,
            actionDelayMs: 3000, // Short delay for confirmation
          });
        } catch (error) {
          console.error('Error processing imported file:', error);
          showMessage('Import failed: Invalid file format or corrupted goal data.', 'error');
        }
      };
      reader.readAsText(file); // Read the file content as text
    },
    [currentUser, appState, showMessage, onAppStateUpdate, onOpenConfirmationModal]
  );

  return (
    <div className="p-4 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg flex flex-col justify-center items-center text-center">
      <h3 className="mb-4 text-xl font-bold text-white">New Goal</h3>
      <button
        onClick={() => onOpenGoalModal(null, false)} // Open GoalModal in create mode
        className="flex flex-col justify-center items-center mb-4 w-24 h-24 text-white rounded-full border-2 transition-all sm:w-32 sm:h-32 border-white/20 hover:bg-white/10 hover:border-white/40"
        aria-label="Create new goal"
      >
        <FiPlus size={48} />
      </button>
      <p className="mb-4 text-sm text-white/70">Click to define a new journey.</p>

      {/* Individual Goal Import Button */}
      <label
        htmlFor="importIndividualGoalFile" // Linked to hidden file input below
        className="inline-flex gap-2 items-center px-4 py-2 text-sm font-semibold text-white rounded-lg border transition-colors cursor-pointer border-white/10 bg-white/5 hover:bg-white/15"
        aria-label="Import a single goal"
      >
        <FiUpload size={16} /> Import Goal
      </label>
      {/* Hidden file input for importing individual goals */}
      <input
        type="file"
        id="importIndividualGoalFile"
        accept=".json" // Only accept JSON files
        style={{ display: 'none' }} // Hide native input
        onChange={handleImportGoal}
      />
    </div>
  );
};

export default CreateGoalCard;
