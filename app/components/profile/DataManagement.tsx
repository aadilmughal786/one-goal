// app/components/profile/DataManagement.tsx
'use client';

import { deserializeGoalsForImport, serializeGoalsForExport } from '@/services/dataService';
import { resetUserData } from '@/services/goalService';
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
  const currentUser = useGoalStore(state => state.currentUser);
  const appState = useGoalStore(state => state.appState);
  const fetchInitialData = useGoalStore(state => state.fetchInitialData);
  const showToast = useNotificationStore(state => state.showToast);
  const showConfirmation = useNotificationStore(state => state.showConfirmation);

  const handleImportFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (isLoading) return;
      const file = event.target.files?.[0];
      if (!file || !currentUser) return;
      if (file.size > 5 * 1024 * 1024) {
        showToast('File is too large (max 5MB).', 'error');
        return;
      }
      event.target.value = '';
      setIsLoading(true);

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
        } finally {
          setIsLoading(false);
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
    <div className="p-8 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl">
      <h2 className="mb-6 text-2xl font-bold text-white">Data Management</h2>
      <div className="space-y-4">
        <label
          htmlFor="import-file-profile-tab"
          className={`flex items-center p-4 text-left text-white rounded-lg border transition-all ${
            isLoading
              ? 'cursor-not-allowed opacity-50'
              : 'cursor-pointer border-white/10 hover:bg-white/5 hover:border-white/20'
          }`}
        >
          {isLoading ? (
            <FiLoader className="animate-spin text-gray-400" size={24} />
          ) : (
            <FiUpload className="text-green-400" size={24} />
          )}
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
          disabled={isLoading}
        />
        <button
          onClick={handleExportData}
          disabled={isLoading}
          className="flex items-center p-4 w-full text-left text-white rounded-lg border transition-all cursor-pointer border-white/10 hover:bg-white/5 hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <FiLoader className="animate-spin text-gray-400" size={24} />
          ) : (
            <FiDownload className="text-blue-400" size={24} />
          )}
          <div className="ml-4">
            <div className="font-medium">Export All Data</div>
            <div className="text-sm text-white/60">
              Download all your goals as a single JSON file.
            </div>
          </div>
        </button>
        <button
          onClick={handleResetData}
          disabled={isLoading}
          className="flex items-center p-4 w-full text-left text-white rounded-lg border transition-all cursor-pointer border-red-400/30 hover:bg-red-400/10 hover:border-red-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <FiLoader className="animate-spin text-gray-400" size={24} />
          ) : (
            <FiTrash2 className="text-red-400" size={24} />
          )}
          <div className="ml-4">
            <div className="font-medium text-red-400">Reset All Data</div>
            <div className="text-sm text-white/60">Permanently clear all your app data.</div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default DataManagementTab;
