// app/components/profile/AccountSettings.tsx
'use client';

import { deserializeGoalsForImport, serializeGoalsForExport } from '@/services/dataService';
import { resetUserData } from '@/services/goalService';
import { useGoalStore } from '@/store/useGoalStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { Goal } from '@/types';
import { serializableGoalsArraySchema } from '@/utils/schemas';
import { format as formatDate } from 'date-fns';
import React, { useCallback } from 'react';
import { FiDownload, FiTrash2, FiUpload } from 'react-icons/fi';

interface AccountSettingsProps {
  onGoalsImported: (goals: Goal[]) => void;
}

const AccountSettings: React.FC<AccountSettingsProps> = ({ onGoalsImported }) => {
  const currentUser = useGoalStore(state => state.currentUser);
  const appState = useGoalStore(state => state.appState);
  const fetchInitialData = useGoalStore(state => state.fetchInitialData);
  const showToast = useNotificationStore(state => state.showToast);
  const showConfirmation = useNotificationStore(state => state.showConfirmation);

  const handleImportFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !currentUser) return;
      if (file.size > 5 * 1024 * 1024) {
        showToast('File is too large (max 5MB).', 'error');
        return;
      }
      event.target.value = '';

      const reader = new FileReader();
      reader.onload = async e => {
        try {
          const importedRawData = JSON.parse(e.target?.result as string);
          const validation = serializableGoalsArraySchema.safeParse(importedRawData);
          if (!validation.success) {
            showToast('Import failed. Invalid file format.', 'error');
            return;
          }
          const deserializedGoals = deserializeGoalsForImport(validation.data);
          onGoalsImported(deserializedGoals);
        } catch {
          showToast('Import failed. Please check file format.', 'error');
        }
      };
      reader.readAsText(file);
    },
    [currentUser, showToast, onGoalsImported]
  );

  const handleExportData = useCallback(async () => {
    if (!appState || Object.keys(appState.goals).length === 0) {
      showToast('No data to export.', 'info');
      return;
    }
    try {
      const serializableData = serializeGoalsForExport(Object.values(appState.goals));
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
      showToast('Data exported successfully.', 'success');
    } catch (error) {
      showToast(`Failed to export data: ${(error as Error).message}`, 'error');
    }
  }, [appState, showToast]);

  const handleResetData = useCallback(() => {
    showConfirmation({
      title: 'Reset All Data?',
      message:
        'This will permanently erase all your goals, lists, and progress. This action cannot be undone.',
      action: async () => {
        if (!currentUser) return;
        try {
          await resetUserData(currentUser.uid);
          await fetchInitialData(currentUser);
          showToast('All data has been reset.', 'info');
        } catch {
          showToast('Failed to reset data. Please try again.', 'error');
        }
      },
      actionDelayMs: 10000,
    });
  }, [currentUser, showToast, showConfirmation, fetchInitialData]);

  if (!currentUser) return null;

  return (
    <div className="space-y-8">
      <div className="p-8 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl">
        <h2 className="mb-6 text-2xl font-bold text-white">Data Management</h2>
        <div className="space-y-4">
          <label
            htmlFor="import-file-profile-tab"
            className="flex items-center p-4 text-left text-white rounded-lg border transition-all cursor-pointer border-white/10 hover:bg-white/5 hover:border-white/20"
          >
            <FiUpload className="text-green-400" size={24} />
            <div className="ml-4">
              <div className="font-medium">Import Goals</div>
              <div className="text-sm text-white/60">
                Upload a JSON backup file to select and import goals.
              </div>
            </div>
          </label>
          <input
            type="file"
            id="import-file-profile-tab"
            accept=".json"
            onChange={handleImportFileSelect}
            className="hidden"
          />
          <button
            onClick={handleExportData}
            className="flex items-center p-4 w-full text-left text-white rounded-lg border transition-all cursor-pointer border-white/10 hover:bg-white/5 hover:border-white/20"
          >
            <FiDownload className="text-blue-400" size={24} />
            <div className="ml-4">
              <div className="font-medium">Export All Data</div>
              <div className="text-sm text-white/60">
                Download all your goals as a single JSON file.
              </div>
            </div>
          </button>
          <button
            onClick={handleResetData}
            className="flex items-center p-4 w-full text-left text-white rounded-lg border transition-all cursor-pointer border-red-400/30 hover:bg-red-400/10 hover:border-red-400/50"
          >
            <FiTrash2 className="text-red-400" size={24} />
            <div className="ml-4">
              <div className="font-medium text-red-400">Reset All Data</div>
              <div className="text-sm text-white/60">Permanently clear all your app data.</div>
            </div>
          </button>
        </div>
      </div>
      <div className="p-8 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl">
        <h2 className="mb-6 text-2xl font-bold text-white">Account Information</h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2">
            <span className="text-white/60">User ID</span>
            <span className="font-mono text-sm text-white/80">{currentUser.uid}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-white/60">Account Created</span>
            <span className="text-white/80">
              {currentUser.metadata.creationTime
                ? formatDate(currentUser.metadata.creationTime, 'MMM d, yyyy')
                : 'Unknown'}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-white/60">Last Sign In</span>
            <span className="text-white/80">
              {currentUser.metadata.lastSignInTime
                ? formatDate(currentUser.metadata.lastSignInTime, 'MMM d, yyyy')
                : 'Unknown'}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-white/60">Email Verified</span>
            <span className={`${currentUser.emailVerified ? 'text-green-400' : 'text-red-400'}`}>
              {currentUser.emailVerified ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
