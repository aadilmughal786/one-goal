// app/components/dashboard/DashboardSettings.tsx
'use client';

import { AppState } from '@/types'; // Import GoalStatus
import { User } from 'firebase/auth';
import React, { useMemo } from 'react';

import { FiDownload, FiEdit, FiPlusCircle, FiUpload } from 'react-icons/fi';

interface DashboardSettingsProps {
  currentUser: User | null;
  appState: AppState | null;
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
  onAppStateUpdate: (newAppState: AppState) => void;
  // Props managed at page level (passed from DashboardPageContent)
  handleOpenGoalModal: (isEditing?: boolean) => void;
  promptForArchiveAndNewGoal: () => void;
  handleExport: () => Promise<void>;
  handleImportChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  transformedGoalForModal: {
    name: string;
    description: string | null;
    startDate: string;
    endDate: string;
  } | null;
  isEditMode: boolean; // Indicates if GoalModal should open in edit mode
}

const DashboardSettings: React.FC<DashboardSettingsProps> = ({
  appState,
  // Destructure props managed at page level
  handleOpenGoalModal,
  promptForArchiveAndNewGoal,
  handleExport,
  handleImportChange,
}) => {
  // `isGoalModalOpen`, `isEditMode`, `isConfirmModalOpen`, `confirmationProps`
  // are managed at the page level and passed down as props where needed.
  // This component will directly call the handlers from props.

  // Get the currently active goal from appState for editing/archiving
  const activeGoal = useMemo(() => {
    if (!appState?.activeGoalId || !appState.goals) return null;
    return appState.goals[appState.activeGoalId];
  }, [appState]);

  // `handleSetGoal` is now passed as a prop from the parent `page.tsx` as it manages `isGoalModalOpen` and `isEditMode`
  // and updates appState.
  // This component will use the `handleOpenGoalModal` prop, which wraps the actual `setIsGoalModalOpen` logic.

  return (
    <section>
      <input
        type="file"
        id="dashboardImportFile" // Unique ID for the hidden file input
        accept=".json" // Only accept JSON files
        style={{ display: 'none' }} // Hide the native input
        onChange={handleImportChange} // Use handleImportChange from props
      />
      <div className="p-8 text-center bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg">
        <h3 className="mb-2 text-2xl font-bold">Manage Your Goal</h3>
        <p className="mx-auto mb-6 max-w-2xl text-white/60">
          Update your current goal, archive it to start a new one, or manage your data backups.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          <button
            onClick={() => handleOpenGoalModal(true)} // Use handleOpenGoalModal from props
            disabled={!activeGoal} // Disable if no active goal to edit
            className="flex flex-col justify-center items-center p-4 text-white rounded-lg border transition-all cursor-pointer border-blue-400/30 hover:bg-blue-400/10 hover:border-blue-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Update current goal"
          >
            <FiEdit size={24} className="mb-2 text-blue-400" />
            <span className="font-semibold">Update Goal</span>
          </button>
          <button
            onClick={promptForArchiveAndNewGoal} // Use promptForArchiveAndNewGoal from props
            className="flex flex-col justify-center items-center p-4 text-white rounded-lg border transition-all cursor-pointer border-green-400/30 hover:bg-green-400/10 hover:border-green-400/50"
            aria-label="Start new goal"
          >
            <FiPlusCircle size={24} className="mb-2 text-green-400" />
            <span className="font-semibold">New Goal</span>
          </button>
          <button
            onClick={handleExport} // Use handleExport from props
            disabled={!activeGoal} // Disable if no active goal to export
            className="flex flex-col justify-center items-center p-4 text-white rounded-lg border transition-all cursor-pointer border-white/20 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Export all data"
          >
            <FiDownload size={24} className="mb-2 text-purple-400" />
            <span className="font-semibold">Export Data</span>
          </button>
          <label
            htmlFor="dashboardImportFile" // Link to the hidden input for import
            className="flex flex-col justify-center items-center p-4 text-white rounded-lg border transition-all cursor-pointer border-white/20 hover:bg-white/10"
            aria-label="Import data from file"
          >
            <FiUpload size={24} className="mb-2 text-teal-400" />
            <span className="font-semibold">Import Data</span>
          </label>
        </div>
      </div>
    </section>
  );
};

export default DashboardSettings;
