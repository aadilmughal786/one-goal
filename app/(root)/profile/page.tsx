// app/(root)/profile/page.tsx
'use client';

import AvatarSelectionModal from '@/components/profile/AvatarSelectionModal';
import { AppState } from '@/types';
import { format as formatDate } from 'date-fns';
import { User } from 'firebase/auth';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';
import { FiCalendar, FiDownload, FiEdit, FiMail, FiTrash2, FiUpload } from 'react-icons/fi';

// --- REFLECTING THE REFACTOR ---
// Import the new specific service functions
import { onAuthChange, updateUserProfile } from '@/services/authService';
import { deserializeAppStateForImport, serializeAppStateForExport } from '@/services/dataService';
import { getUserData, resetUserData, setUserData } from '@/services/goalService';
import { serializableAppStateSchema } from '@/utils/schemas';

// Import the Zustand notification store
import { useNotificationStore } from '@/store/useNotificationStore';

const ProfilePageSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    <div className="p-8 bg-white/[0.02] border border-white/10 rounded-2xl">
      <div className="flex flex-col gap-6 items-center md:flex-row md:items-start">
        <div className="w-32 h-32 rounded-full bg-white/10"></div>
        <div className="flex-grow space-y-3 w-full">
          <div className="w-1/2 h-8 rounded-lg bg-white/10"></div>
          <div className="w-3/4 h-5 rounded-lg bg-white/10"></div>
          <div className="w-2/3 h-5 rounded-lg bg-white/10"></div>
        </div>
      </div>
    </div>
    <div className="p-8 bg-white/[0.02] border border-white/10 rounded-2xl">
      <div className="mb-6 w-1/2 h-8 rounded-lg bg-white/10"></div>
      <div className="h-16 rounded-lg bg-white/5"></div>
      <div className="mt-4 h-16 rounded-lg bg-white/5"></div>
    </div>
  </div>
);

export default function ProfilePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appState, setAppState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);

  // No more local state for confirmation modal or toast messages
  // Access showToast and showConfirmation from the Zustand store
  const showToast = useNotificationStore(state => state.showToast);
  const showConfirmation = useNotificationStore(state => state.showConfirmation);

  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  const fetchUserAndData = useCallback(
    async (user: User) => {
      try {
        const userData = await getUserData(user.uid);
        setAppState(userData);
      } catch {
        showToast('Failed to load user data.', 'error'); // Use store's showToast
      } finally {
        setLoading(false);
      }
    },
    [showToast] // Dependency on showToast from store
  );

  useEffect(() => {
    const unsubscribe = onAuthChange(async user => {
      if (user) {
        setCurrentUser(user);
        fetchUserAndData(user);
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router, fetchUserAndData]);

  const handleImportData = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !currentUser) return;
      if (file.size > 5 * 1024 * 1024) {
        showToast('File is too large (max 5MB).', 'error'); // Use store's showToast
        return;
      }
      event.target.value = '';

      const reader = new FileReader();
      reader.onload = async e => {
        try {
          const importedRawData = JSON.parse(e.target?.result as string);

          const validation = serializableAppStateSchema.safeParse(importedRawData);
          if (!validation.success) {
            showToast('Import failed. Invalid file format.', 'error'); // Use store's showToast
            return;
          }

          const deserializedData = deserializeAppStateForImport(validation.data);

          const performImport = async () => {
            if (!currentUser) return;
            // Now calls the dedicated service function to overwrite data
            await setUserData(currentUser.uid, deserializedData);
            setAppState(deserializedData);
            showToast('Data imported successfully! The page will now refresh.', 'success'); // Use store's showToast
            setTimeout(() => window.location.reload(), 2000);
          };

          showConfirmation({
            // Use store's showConfirmation
            title: 'Overwrite All Data?',
            message: 'Importing will replace all your current data. This action is irreversible.',
            action: performImport,
            actionDelayMs: 10000,
          });
        } catch {
          showToast('Import failed. Please check file format.', 'error'); // Use store's showToast
        }
      };
      reader.readAsText(file);
    },
    [currentUser, showToast, showConfirmation] // Dependencies include store actions
  );

  const handleExportData = useCallback(async () => {
    if (!appState || Object.keys(appState.goals).length === 0) {
      showToast('No data to export.', 'info'); // Use store's showToast
      return;
    }
    try {
      const serializableData = serializeAppStateForExport(appState);
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
      showToast('Data exported successfully.', 'success'); // Use store's showToast
    } catch (error) {
      showToast(`Failed to export data: ${(error as Error).message}`, 'error'); // Use store's showToast
    }
  }, [appState, showToast]); // Dependency on showToast

  // The handleResetData function is now fully implemented.
  const handleResetData = useCallback(() => {
    showConfirmation({
      // Use store's showConfirmation
      title: 'Reset All Data?',
      message:
        'This will permanently erase all your goals, lists, and progress. This action cannot be undone.',
      action: async () => {
        if (!currentUser) return;
        try {
          // Calls the new, specific service function.
          const resetData = await resetUserData(currentUser.uid);
          setAppState(resetData);
          showToast('All data has been reset.', 'info'); // Use store's showToast
        } catch {
          showToast('Failed to reset data. Please try again.', 'error'); // Use store's showToast
        }
      },
      actionDelayMs: 10000,
    });
  }, [currentUser, showToast, showConfirmation]); // Dependencies on store actions

  const handleAvatarSelect = async (avatarUrl: string) => {
    try {
      await updateUserProfile({ photoURL: avatarUrl });
      setCurrentUser(prevUser => {
        if (!prevUser) return null;
        const updatedUser = Object.assign(Object.create(Object.getPrototypeOf(prevUser)), prevUser);
        updatedUser.photoURL = avatarUrl;
        return updatedUser;
      });
      showToast('Avatar updated successfully!', 'success'); // Use store's showToast
      setIsAvatarModalOpen(false);
    } catch {
      showToast('Failed to update avatar. Please try again.', 'error'); // Use store's showToast
    }
  };

  if (loading) {
    return (
      <main className="relative px-6 py-8 mx-auto max-w-4xl sm:px-8 lg:px-12">
        <ProfilePageSkeleton />
      </main>
    );
  }

  if (!currentUser) return null;

  return (
    <main className="relative px-6 py-8 mx-auto max-w-4xl sm:px-8 lg:px-12">
      {/* ToastMessage and ConfirmationModal are now rendered globally in RootLayout,
          so they are removed from here. */}
      <input
        type="file"
        id="import-file-profile"
        accept=".json"
        onChange={handleImportData}
        className="hidden"
      />

      {/* User Profile Header Section */}
      <div className="p-8 mb-8 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl">
        <div className="flex flex-col gap-6 items-center md:flex-row md:items-start">
          <div className="relative group">
            <Image
              src={currentUser.photoURL || `https://placehold.co/120x120/1a1a1a/ffffff?text=User`}
              alt="Profile picture"
              width={120}
              height={120}
              className="rounded-full border-2 border-white/20"
            />
            <button
              onClick={() => setIsAvatarModalOpen(true)}
              className="flex absolute inset-0 justify-center items-center text-white rounded-full opacity-0 transition-opacity duration-300 cursor-pointer bg-black/50 group-hover:opacity-100"
              aria-label="Change profile picture"
            >
              <FiEdit size={32} />
            </button>
          </div>
          <div className="flex-grow text-center md:text-left">
            <h1 className="text-2xl font-bold text-white md:text-3xl">
              {currentUser.displayName || 'Anonymous User'}
            </h1>
            <div className="flex flex-col gap-2 mt-4 text-white/70">
              <div className="flex gap-2 justify-center items-center md:justify-start">
                <FiMail size={16} /> <span>{currentUser.email}</span>
              </div>
              <div className="flex gap-2 justify-center items-center md:justify-start">
                <FiCalendar size={16} />
                <span>
                  Member since{' '}
                  {currentUser.metadata.creationTime
                    ? formatDate(new Date(currentUser.metadata.creationTime), 'MMM d,yyyy')
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="p-8 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl">
          <h2 className="mb-6 text-2xl font-bold text-white">Data Management</h2>
          <div className="space-y-4">
            <label
              htmlFor="import-file-profile"
              className="flex items-center p-4 text-left text-white rounded-lg border transition-all cursor-pointer border-white/10 hover:bg-white/5 hover:border-white/20"
            >
              <FiUpload className="text-green-400" size={24} />
              <div className="ml-4">
                <div className="font-medium">Import All Data</div>
                <div className="text-sm text-white/60">
                  Upload a JSON backup file to restore your entire app state.
                </div>
              </div>
            </label>
            <button
              onClick={handleExportData}
              className="flex items-center p-4 w-full text-left text-white rounded-lg border transition-all cursor-pointer border-white/10 hover:bg-white/5 hover:border-white/20"
            >
              <FiDownload className="text-blue-400" size={24} />
              <div className="ml-4">
                <div className="font-medium">Export All Data</div>
                <div className="text-sm text-white/60">
                  Download all your app data as a single JSON file.
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
        <div className="bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl p-8">
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
                  ? formatDate(new Date(currentUser.metadata.creationTime), 'MMM d,yyyy')
                  : 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-white/60">Last Sign In</span>
              <span className="text-white/80">
                {currentUser.metadata.lastSignInTime
                  ? formatDate(new Date(currentUser.metadata.lastSignInTime), 'MMM d,yyyy')
                  : 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className={`${currentUser.emailVerified ? 'text-green-400' : 'text-red-400'}`}>
                Email Verified
              </span>
              <span className={`${currentUser.emailVerified ? 'text-green-400' : 'text-red-400'}`}>
                {currentUser.emailVerified ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {isAvatarModalOpen && (
        <AvatarSelectionModal
          isOpen={isAvatarModalOpen}
          onClose={() => setIsAvatarModalOpen(false)}
          onAvatarSelect={handleAvatarSelect}
          currentUser={currentUser}
          showToast={showToast} // Pass showToast to AvatarSelectionModal if it needs it
        />
      )}

      {/* ConfirmationModal is now rendered globally and listens to the store, so it is removed from here */}
    </main>
  );
}
