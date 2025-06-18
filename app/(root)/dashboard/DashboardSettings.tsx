// app/(root)/dashboard/DashboardSettings.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { User } from 'firebase/auth';
import { AppState, Goal } from '@/types';
import { Timestamp } from 'firebase/firestore';
import { firebaseService } from '@/services/firebaseService';

import GoalModal from '@/components/dashboard/GoalModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import { FiEdit, FiPlusCircle, FiUpload, FiDownload } from 'react-icons/fi';

interface DashboardSettingsProps {
  currentUser: User | null;
  appState: AppState | null;
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
  onAppStateUpdate: (newAppState: AppState) => void;
}

const DashboardSettings: React.FC<DashboardSettingsProps> = ({
  currentUser,
  appState,
  showMessage,
  onAppStateUpdate,
}) => {
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmationProps, setConfirmationProps] = useState({
    title: '',
    message: '',
    action: () => {},
    actionDelayMs: 0,
  });

  const handleSetGoal = useCallback(
    async (goalName: string, endDate: Date, description: string | null) => {
      if (!currentUser) return;
      const newGoal: Goal = {
        name: goalName,
        description,
        startDate: isEditMode && appState?.goal ? appState.goal.startDate : Timestamp.now(),
        endDate: Timestamp.fromDate(endDate),
      };
      await firebaseService.updateGoal(currentUser.uid, newGoal);
      const updatedUserData = await firebaseService.getUserData(currentUser.uid);
      onAppStateUpdate(updatedUserData);
      setIsGoalModalOpen(false);
      showMessage(isEditMode ? 'Goal updated successfully!' : 'Goal set successfully!', 'success');
    },
    [currentUser, appState, isEditMode, showMessage, onAppStateUpdate]
  );

  const handleOpenGoalModal = (isEditing = false) => {
    setIsEditMode(isEditing);
    setIsGoalModalOpen(true);
  };

  const promptForNewGoal = () => {
    if (appState?.goal) {
      setConfirmationProps({
        title: 'Create New Goal?',
        message:
          'This will erase your current goal and all associated data. This action is irreversible. The confirm button will be enabled in 10 seconds.',
        action: () => {
          if (!currentUser) return;
          firebaseService.resetUserData(currentUser.uid).then(newAppState => {
            onAppStateUpdate(newAppState);
            handleOpenGoalModal(false);
          });
        },
        actionDelayMs: 10000,
      });
      setIsConfirmModalOpen(true);
    } else {
      handleOpenGoalModal(false);
    }
  };

  const handleImportChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;
    if (file.size > 5 * 1024 * 1024) {
      showMessage('File is too large (max 5MB).', 'error');
      return;
    }
    event.target.value = '';

    const reader = new FileReader();
    reader.onload = async e => {
      try {
        const importedRawData = JSON.parse(e.target?.result as string);
        const importedState = firebaseService.deserializeForImport(importedRawData);

        const confirmImport = () => handleConfirmImport(importedState);

        if (appState?.goal) {
          setConfirmationProps({
            title: 'Overwrite All Data?',
            message:
              'Importing will replace all your current data. This action is irreversible. The confirm button will be enabled in 10 seconds.',
            action: confirmImport,
            actionDelayMs: 10000,
          });
          setIsConfirmModalOpen(true);
        } else {
          confirmImport();
        }
      } catch {
        showMessage('Import failed: Invalid file format.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async (importedState: AppState) => {
    if (!currentUser) return;
    try {
      await firebaseService.setUserData(currentUser.uid, importedState);
      showMessage('Data imported successfully. Refreshing...', 'success');
      setIsConfirmModalOpen(false);
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      showMessage(`Failed to save imported data: ${(error as Error).message}`, 'error');
      setIsConfirmModalOpen(false);
    }
  };

  const handleExport = async () => {
    if (!currentUser || !appState) return;
    try {
      const serializableData = firebaseService.serializeForExport(appState);
      const dataStr = JSON.stringify(serializableData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `one-goal-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showMessage('Data exported successfully.', 'success');
    } catch (error) {
      showMessage(`Failed to export data: ${(error as Error).message}`, 'error');
    }
  };

  const transformedGoalForModal = appState?.goal
    ? {
        name: appState.goal.name,
        description: appState.goal.description,
        startDate: appState.goal.startDate.toDate().toISOString(),
        endDate: appState.goal.endDate.toDate().toISOString(),
      }
    : null;

  return (
    <section>
      <input
        type="file"
        id="dashboardImportFile"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleImportChange}
      />
      <div className="p-8 text-center bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg">
        <h3 className="mb-2 text-2xl font-bold">Manage Your Goal</h3>
        <p className="mx-auto mb-6 max-w-2xl text-white/60">
          Need to make changes? You can update your goal, start fresh, or manage your data backups
          here.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          <button
            onClick={() => handleOpenGoalModal(!!appState?.goal)}
            disabled={!appState?.goal}
            className="flex flex-col justify-center items-center p-4 text-white rounded-lg border transition-all cursor-pointer border-blue-400/30 hover:bg-blue-400/10 hover:border-blue-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiEdit size={24} className="mb-2 text-blue-400" />
            <span className="font-semibold">Update Goal</span>
          </button>
          <button
            onClick={promptForNewGoal}
            className="flex flex-col justify-center items-center p-4 text-white rounded-lg border transition-all cursor-pointer border-red-400/30 hover:bg-red-400/10 hover:border-red-400/50"
          >
            <FiPlusCircle size={24} className="mb-2 text-red-400" />
            <span className="font-semibold">New Goal</span>
          </button>
          <label
            htmlFor="dashboardImportFile"
            className="flex flex-col justify-center items-center p-4 text-white rounded-lg border transition-all cursor-pointer border-white/20 hover:bg-white/10"
          >
            <FiUpload size={24} className="mb-2 text-green-400" />
            <span className="font-semibold">Import Data</span>
          </label>
          <button
            onClick={handleExport}
            disabled={!appState?.goal}
            className="flex flex-col justify-center items-center p-4 text-white rounded-lg border transition-all cursor-pointer border-white/20 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiDownload size={24} className="mb-2 text-purple-400" />
            <span className="font-semibold">Export Data</span>
          </button>
        </div>
      </div>

      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSetGoal={handleSetGoal}
        showMessage={showMessage}
        initialGoalData={isEditMode ? transformedGoalForModal : null}
        isEditMode={isEditMode}
      />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title={confirmationProps.title}
        message={confirmationProps.message}
        confirmButton={{
          text: 'Confirm',
          onClick: () => {
            confirmationProps.action();
            setIsConfirmModalOpen(false);
          },
          className: 'bg-red-600 text-white hover:bg-red-700',
        }}
        cancelButton={{ text: 'Cancel', onClick: () => setIsConfirmModalOpen(false) }}
        actionDelayMs={confirmationProps.actionDelayMs}
      />
    </section>
  );
};

export default DashboardSettings;
