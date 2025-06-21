// app/components/goal/GoalDataManagement.tsx
'use client';

import { firebaseService } from '@/services/firebaseService'; // Import firebaseService
import { AppState } from '@/types';
import { User } from 'firebase/auth';
import React, { useCallback } from 'react';
import { FiDownload, FiUpload } from 'react-icons/fi'; // Icons for upload and download

interface GoalDataManagementProps {
  currentUser: User | null;
  appState: AppState | null;
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
  onAppStateUpdate: (newAppState: AppState) => void;
  onOpenConfirmationModal: (props: {
    title: string;
    message: string;
    action: () => Promise<void> | void;
    actionDelayMs?: number;
  }) => void;
}

/**
 * GoalDataManagement Component
 *
 * Provides functionalities for exporting and importing user application data.
 * It integrates with FirebaseService for data serialization/deserialization and persistence.
 */
const GoalDataManagement: React.FC<GoalDataManagementProps> = ({
  currentUser,
  appState,
  showMessage,
  onAppStateUpdate,
  onOpenConfirmationModal,
}) => {
  /**
   * Confirms and performs the data import after user confirmation.
   * This action overwrites all existing user data.
   * @param importedState The deserialized AppState object to import.
   */
  const handleConfirmImport = useCallback(
    async (importedState: AppState) => {
      if (!currentUser) {
        showMessage('Authentication required to import data.', 'error');
        return;
      }
      try {
        await firebaseService.setUserData(currentUser.uid, importedState); // Overwrite user data in Firestore
        showMessage('Data imported successfully. Refreshing...', 'success');
        // A full page reload is often necessary after a data import to re-initialize all components
        setTimeout(() => window.location.reload(), 2000);
      } catch (error) {
        console.error('Failed to save imported data:', error);
        showMessage(`Failed to save imported data: ${(error as Error).message}`, 'error');
      }
    },
    [currentUser, showMessage]
  );

  /**
   * Handles change event for the file input for data import.
   * Reads the JSON file, deserializes it, and prompts for confirmation if data might be overwritten.
   * @param event The change event from the file input.
   */
  const handleImportChange = useCallback(
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
          // Deserialize the imported data to convert timestamps back to Timestamp objects
          const importedState = firebaseService.deserializeAppState(importedRawData);

          // Check if there's any active goal data that would be overwritten
          if (appState?.activeGoalId && appState.goals[appState.activeGoalId]) {
            onOpenConfirmationModal({
              title: 'Overwrite All Data?',
              message:
                'Importing will replace all your current data. This action is irreversible. The confirm button will be enabled in 10 seconds.',
              action: async () => handleConfirmImport(importedState), // Pass the deserialized state to action
              actionDelayMs: 10000, // Long delay for critical overwrite
            });
          } else {
            // No active goal, proceed with import directly without confirmation modal
            await handleConfirmImport(importedState);
          }
        } catch (error) {
          console.error('Import failed:', error);
          showMessage('Import failed: Invalid file format.', 'error');
        }
      };
      reader.readAsText(file); // Read the file content as text
    },
    [currentUser, appState, showMessage, onOpenConfirmationModal, handleConfirmImport]
  ); // Added handleConfirmImport to dependencies

  /**
   * Handles exporting all user application data to a JSON file.
   * Serializes the current AppState and triggers a file download.
   */
  const handleExport = useCallback(async () => {
    if (!currentUser || !appState) {
      showMessage('No data to export or user not authenticated.', 'info');
      return;
    }
    try {
      // Serialize the AppState to convert Firebase Timestamps to ISO strings for export
      const serializableData = firebaseService.serializeAppState(appState);
      const dataStr = JSON.stringify(serializableData, null, 2); // Pretty print JSON for readability
      const dataBlob = new Blob([dataStr], { type: 'application/json' }); // Create a Blob from the JSON string
      const url = URL.createObjectURL(dataBlob); // Create a temporary URL for the Blob
      const link = document.createElement('a'); // Create a temporary anchor element
      link.href = url;
      link.download = `one-goal-backup-${new Date().toISOString().split('T')[0]}.json`; // Set download filename
      document.body.appendChild(link); // Append to body to make it programmatically clickable
      link.click(); // Programmatically click the link to initiate download
      document.body.removeChild(link); // Clean up the temporary link
      URL.revokeObjectURL(url); // Release the object URL
      showMessage('Data exported successfully.', 'success');
    } catch (error) {
      console.error('Failed to export data:', error);
      showMessage(`Failed to export data: ${(error as Error).message}`, 'error');
    }
  }, [currentUser, appState, showMessage]);

  return (
    <section className="p-8 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg">
      <h3 className="mb-6 text-2xl font-bold text-center text-white">Data Management</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Export Data Button */}
        <button
          onClick={handleExport}
          disabled={!currentUser || !appState || Object.keys(appState.goals).length === 0} // Disable if no user or no data
          className="flex flex-col justify-center items-center p-4 text-white rounded-lg border transition-all cursor-pointer border-blue-400/30 hover:bg-blue-400/10 hover:border-blue-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Export all data"
        >
          <FiDownload size={24} className="mb-2 text-blue-400" />
          <span className="font-semibold">Export Data</span>
          <p className="mt-1 text-xs text-white/60">Download your app data as a JSON file.</p>
        </button>

        {/* Import Data Label (linked to hidden file input) */}
        <label
          htmlFor="dataImportFile" // Link to the hidden file input
          className="flex flex-col justify-center items-center p-4 text-white rounded-lg border transition-all cursor-pointer border-green-400/30 hover:bg-green-400/10 hover:border-green-400/50"
          aria-label="Import data from file"
        >
          <FiUpload size={24} className="mb-2 text-green-400" />
          <span className="font-semibold">Import Data</span>
          <p className="mt-1 text-xs text-white/60">
            Upload a JSON backup file to restore your state.
          </p>
        </label>
        {/* Hidden file input for import */}
        <input
          type="file"
          id="dataImportFile" // Unique ID matching the label's htmlFor
          accept=".json" // Only accept JSON files
          style={{ display: 'none' }} // Hide the native input
          onChange={handleImportChange}
        />
      </div>
    </section>
  );
};

export default GoalDataManagement;
