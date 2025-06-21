// app/(root)/profile/page.tsx
'use client';

import ConfirmationModal from '@/components/common/ConfirmationModal';
import ToastMessage from '@/components/common/ToastMessage';
import AvatarSelectionModal from '@/components/profile/AvatarSelectionModal'; // Import the new modal
import { firebaseService } from '@/services/firebaseService';
import { AppState } from '@/types'; // AppState is from types
import { format as formatDate } from 'date-fns';
import { User } from 'firebase/auth';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FiCalendar,
  FiDownload, // FiClock, FiTrendingUp, FiAward, FiHash, FiLogIn, FiChevronsRight are removed as goal stats are gone

  // FiTrendingUp, FiAward, FiHash, FiLogIn, FiChevronsRight,
  FiEdit,
  FiMail,
  FiTrash2,
  FiUpload,
} from 'react-icons/fi';

// Removed StatCard component as goal stats are removed
// const StatCard = ({ /* ... */ }) => ({ /* ... */ });

const ProfilePageSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    {/* Profile Header Skeleton */}
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
    {/* Goal Stats Skeleton Removed */}
    {/* Data & Account Skeletons */}
    <div className="space-y-8">
      <div className="p-8 bg-white/[0.02] border border-white/10 rounded-2xl">
        <div className="mb-6 w-1/2 h-8 rounded-lg bg-white/10"></div>
        <div className="h-16 rounded-lg bg-white/5"></div>
        <div className="mt-4 h-16 rounded-lg bg-white/5"></div>
      </div>
    </div>
  </div>
);

export default function ProfilePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appState, setAppState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false); // State for the new modal
  const [confirmationProps, setConfirmationProps] = useState({
    title: '',
    message: '',
    action: () => {},
    actionDelayMs: 0,
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const showMessage = useCallback((text: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(text);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const fetchUserAndData = useCallback(
    async (user: User) => {
      try {
        const userData = await firebaseService.getUserData(user.uid);
        setAppState(userData);
      } catch (error) {
        console.error('Error fetching user data:', error);
        showMessage('Failed to load user data.', 'error');
      } finally {
        setLoading(false);
      }
    },
    [showMessage]
  );

  useEffect(() => {
    const unsubscribe = firebaseService.onAuthChange(async user => {
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
        showMessage('File is too large (max 5MB).', 'error');
        return;
      }
      event.target.value = '';

      const reader = new FileReader();
      reader.onload = async e => {
        try {
          const importedRawData = JSON.parse(e.target?.result as string);
          // Deserialize the entire app state
          const deserializedData = firebaseService.deserializeAppState(importedRawData);

          const performImport = async () => {
            if (!currentUser) return;
            await firebaseService.setUserData(currentUser.uid, deserializedData);
            setAppState(deserializedData);
            showMessage('Data imported successfully! Refreshing...', 'success');
            setTimeout(() => window.location.reload(), 2000);
          };

          // Always prompt for confirmation for app-level import, as it overwrites everything
          setConfirmationProps({
            title: 'Overwrite All Data?',
            message:
              'Importing will replace all your current data (goals, lists, routines, etc.). This action is irreversible. The confirm button will be enabled in 10 seconds.',
            action: performImport,
            actionDelayMs: 10000, // Long delay for critical overwrite
          });
          setIsConfirmModalOpen(true);
        } catch (error) {
          console.error('Import failed:', error);
          showMessage('Import failed. Please check file format.', 'error');
        }
      };
      reader.readAsText(file);
    },
    [currentUser, showMessage]
  ); // appState.goal removed from dependencies as confirmation is now always prompted

  const handleExportData = useCallback(async () => {
    if (!appState || Object.keys(appState.goals).length === 0) {
      // Check if there's any data to export
      showMessage('No data to export.', 'info');
      return;
    }
    if (!currentUser) {
      // Ensure user is authenticated to export their data
      showMessage('Authentication required to export data.', 'error');
      return;
    }
    try {
      // Serialize the entire app state
      const serializableData = firebaseService.serializeAppState(appState);
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
      console.error('Failed to export data:', error);
      showMessage(`Failed to export data: ${(error as Error).message}`, 'error');
    }
  }, [appState, currentUser, showMessage]); // Added currentUser to dependencies

  const handleResetData = useCallback(() => {
    setConfirmationProps({
      title: 'Reset All Data?',
      message:
        'This will permanently erase all your data (goals, lists, routines, etc.). This action cannot be undone. The confirm button will be enabled in 10 seconds.',
      action: async () => {
        if (!currentUser) return;
        const resetData = await firebaseService.resetUserData(currentUser.uid);
        setAppState(resetData);
        showMessage('All data has been reset.', 'info');
      },
      actionDelayMs: 10000,
    });
    setIsConfirmModalOpen(true);
  }, [currentUser, showMessage]);

  const handleAvatarSelect = async (avatarUrl: string) => {
    if (!currentUser) return;
    try {
      await firebaseService.updateUserProfile(currentUser, { photoURL: avatarUrl });
      // Manually update the user object in state to trigger re-render instantly
      setCurrentUser(prevUser => {
        if (!prevUser) return null;
        // Create a new object to ensure React detects the change
        const updatedUser = Object.assign(Object.create(Object.getPrototypeOf(prevUser)), prevUser);
        updatedUser.photoURL = avatarUrl;
        return updatedUser;
      });
      showMessage('Avatar updated successfully!', 'success');
      setIsAvatarModalOpen(false);
    } catch (error) {
      console.error('Failed to update avatar:', error);
      showMessage('Failed to update avatar. Please try again.', 'error');
    }
  };

  // goalStats useMemo is removed as the section is removed
  // const goalStats = useMemo(() => { /* ... */ }, [appState]);

  if (loading) {
    return (
      <main className="px-6 py-8 mx-auto max-w-4xl sm:px-8 lg:px-12">
        <ProfilePageSkeleton />
      </main>
    );
  }

  if (!currentUser) return null;

  return (
    <main className="relative px-6 py-8 mx-auto max-w-4xl sm:px-8 lg:px-12">
      <ToastMessage message={toastMessage} type={toastType} />
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
              {/* Removed active goal status as goal stats are removed */}
              {/* <div className="flex gap-2 justify-center items-center md:justify-start">
                <MdRocketLaunch size={16} />
                <span>{appState?.activeGoalId && appState.goals[appState.activeGoalId] ? 'Currently pursuing a goal' : 'No active goal'}</span>
              </div> */}
            </div>
          </div>
        </div>
      </div>

      {/* Current Goal Statistics Section (removed) */}
      {/* {goalStats && (
        <div className="p-8 mb-8 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl">
          <h2 className="mb-6 text-2xl font-bold text-white">Current Goal Stats</h2>
          <div className="p-4 mb-6 rounded-lg bg-white/5">
            <h3 className="text-lg font-semibold text-white">{appState?.goals[appState.activeGoalId || '']?.name}</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard ... />
          </div>
        </div>
      )} */}

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
                <div className="font-medium">Import All Data</div> {/* Changed label */}
                <div className="text-sm text-white/60">
                  Upload a JSON backup file to restore your entire app state.{' '}
                  {/* Changed description */}
                </div>
              </div>
            </label>
            <button
              onClick={handleExportData}
              className="flex items-center p-4 w-full text-left text-white rounded-lg border transition-all cursor-pointer border-white/10 hover:bg-white/5 hover:border-white/20"
            >
              <FiDownload className="text-blue-400" size={24} />
              <div className="ml-4">
                <div className="font-medium">Export All Data</div> {/* Changed label */}
                <div className="text-sm text-white/60">
                  Download all your app data as a single JSON file. {/* Changed description */}
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
              <span className="text-white/60">Email Verified</span>
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
          showMessage={showMessage}
        />
      )}

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title={confirmationProps.title}
        message={confirmationProps.message}
        confirmButton={{ text: 'Confirm', onClick: confirmationProps.action }}
        cancelButton={{ text: 'Cancel', onClick: () => setIsConfirmModalOpen(false) }}
        actionDelayMs={confirmationProps.actionDelayMs}
      />
    </main>
  );
}
