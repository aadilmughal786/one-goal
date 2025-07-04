// app/components/profile/DataManagement.tsx
'use client';

import { deserializeGoalsForImport, serializeGoalsForExport } from '@/services/dataService';
import { resetUserData } from '@/services/goalService';
import { useAuthStore } from '@/store/useAuthStore';
import { useGoalStore } from '@/store/useGoalStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { Goal } from '@/types';
import { serializableGoalsArraySchema } from '@/utils/schemas';
import React, { useCallback, useState } from 'react';
import { FiDownload, FiLoader, FiTrash2, FiUpload } from 'react-icons/fi';

interface DataManagementTabProps {
  onGoalsImported: (goals: Goal[]) => void;
}

const DataManagementTab: React.FC<DataManagementTabProps> = ({ onGoalsImported }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser, fetchInitialData } = useAuthStore();
  const { appState } = useGoalStore();
  const showToast = useNotificationStore(state => state.showToast);
  const showConfirmation = useNotificationStore(state => state.showConfirmation);

  const handleImportFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (isLoading) return;
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
            showToast('Import failed. Invalid file format.', 'error');
            return;
          }
          const deserializedGoals = deserializeGoalsForImport(validation.data);
          if (deserializedGoals.length > 0) {
            onGoalsImported(deserializedGoals);
          } else {
            showToast('No goals found in the selected file.', 'info');
          }
        } catch {
          showToast('Import failed. Please check file format.', 'error');
        } finally {
          if (event.target) event.target.value = '';
        }
      };
      reader.readAsText(file);
    },
    [currentUser, showToast, onGoalsImported, isLoading]
  );

  const handleExportData = useCallback(async () => {
    if (!appState || Object.keys(appState.goals).length === 0 || isLoading) {
      showToast('No data to export.', 'info');
      return;
    }
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  }, [appState, showToast, isLoading]);

  const handleResetData = useCallback(() => {
    if (isLoading) return;
    showConfirmation({
      title: 'Reset All Data?',
      message:
        'This will permanently erase all your goals, lists, and progress. This action cannot be undone.',
      action: async () => {
        if (!currentUser) return;
        setIsLoading(true);
        try {
          await resetUserData(currentUser.uid);
          await fetchInitialData(currentUser);
          showToast('All data has been reset.', 'info');
        } catch {
          showToast('Failed to reset data. Please try again.', 'error');
        } finally {
          setIsLoading(false);
        }
      },
      actionDelayMs: 10000,
    });
  }, [currentUser, showToast, showConfirmation, fetchInitialData, isLoading]);

  if (!currentUser) return null;

  return (
    <div className="card">
      <h2 className="mb-6 text-2xl font-bold text-text-primary">Data Management</h2>
      <div className="space-y-4">
        <label
          htmlFor="import-file-profile-tab"
          className={`flex items-center p-4 text-left rounded-lg border transition-all ${
            isLoading
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer border-border-primary hover:bg-bg-tertiary hover:border-border-secondary'
          }`}
        >
          {isLoading ? (
            <FiLoader className="animate-spin text-text-muted" size={24} />
          ) : (
            <FiUpload className="text-green-400" size={24} />
          )}
          <div className="ml-4">
            <div className="font-medium text-text-primary">Import Goals</div>
            <div className="text-sm text-text-secondary">
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
          disabled={isLoading}
        />
        <button
          onClick={handleExportData}
          disabled={isLoading}
          className="flex items-center p-4 w-full text-left rounded-lg border transition-all cursor-pointer border-border-primary hover:bg-bg-tertiary hover:border-border-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <FiLoader className="animate-spin text-text-muted" size={24} />
          ) : (
            <FiDownload className="text-blue-400" size={24} />
          )}
          <div className="ml-4">
            <div className="font-medium text-text-primary">Export All Data</div>
            <div className="text-sm text-text-secondary">
              Download all your goals as a single JSON file.
            </div>
          </div>
        </button>
        <button
          onClick={handleResetData}
          disabled={isLoading}
          className="flex items-center p-4 w-full text-left rounded-lg border transition-all cursor-pointer border-red-400/30 hover:bg-red-400/10 hover:border-red-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <FiLoader className="animate-spin text-text-muted" size={24} />
          ) : (
            <FiTrash2 className="text-red-400" size={24} />
          )}
          <div className="ml-4">
            <div className="font-medium text-red-400">Reset All Data</div>
            <div className="text-sm text-text-secondary">Permanently clear all your app data.</div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default DataManagementTab;
