// app/(root)/profile/page.tsx
'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  FiDownload,
  FiUpload,
  FiTrash2,
  FiMail,
  FiCalendar,
  FiClock,
  FiTrendingUp,
  FiAward,
  FiHash,
  FiLogIn,
  FiChevronsRight,
  FiEdit,
} from 'react-icons/fi';
import { MdRocketLaunch } from 'react-icons/md';
import { User } from 'firebase/auth';
import { firebaseService } from '@/services/firebaseService';
import { AppState } from '@/types'; // Ensure AppState and nested types are correctly imported
import { differenceInDays, format as formatDate } from 'date-fns'; // Renamed format to formatDate to avoid conflict
import ConfirmationModal from '@/components/common/ConfirmationModal';
import ToastMessage from '@/components/common/ToastMessage';
import AvatarSelectionModal from '@/components/profile/AvatarSelectionModal';

/**
 * Skeleton loader for the Profile Page.
 * Displays animated placeholders while content is loading.
 */
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
    {/* Goal Stats Skeleton */}
    <div className="p-8 bg-white/[0.02] border border-white/10 rounded-2xl">
      <div className="mb-6 w-1/3 h-8 rounded-lg bg-white/10"></div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-white/5"></div>
        ))}
      </div>
    </div>
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

/**
 * Reusable component for displaying a single statistic card.
 */
const StatCard = ({
  icon,
  label,
  value,
  colorClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  colorClass: string;
}) => (
  <div className="flex items-center p-4 rounded-lg bg-white/5">
    <div className={`mr-4 text-2xl ${colorClass}`}>{icon}</div>
    <div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-white/60">{label}</div>
    </div>
  </div>
);

/**
 * Main Profile Page component.
 * Displays user profile information, goal statistics, and data management options.
 */
export default function ProfilePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appState, setAppState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true); // Manages overall loading state for the page

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [confirmationProps, setConfirmationProps] = useState({
    title: '',
    message: '',
    action: () => {}, // Default empty action
    actionDelayMs: 0,
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  /**
   * Callback function to display a toast message.
   */
  const showMessage = useCallback((text: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(text);
    setToastType(type);
    // Optional: Auto-clear toast after a few seconds
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  /**
   * Fetches user data from Firebase after authentication.
   */
  const fetchUserAndData = useCallback(
    async (user: User) => {
      try {
        const userData = await firebaseService.getUserData(user.uid);
        setAppState(userData);
      } catch (error) {
        console.error('Failed to load user data:', error);
        showMessage('Failed to load user data.', 'error');
      } finally {
        setLoading(false); // Always set loading to false after fetch attempt
      }
    },
    [showMessage]
  );

  // Effect to listen for Firebase authentication state changes.
  useEffect(() => {
    const unsubscribe = firebaseService.onAuthChange(async user => {
      if (user) {
        setCurrentUser(user);
        fetchUserAndData(user); // Fetch data if user is logged in
      } else {
        router.push('/login'); // Redirect to login if not authenticated
      }
    });
    return () => unsubscribe(); // Cleanup Firebase listener
  }, [router, fetchUserAndData]);

  /**
   * Handles importing user data from a JSON file.
   * Prompts for confirmation if existing goal data would be overwritten.
   */
  const handleImportData = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !currentUser) {
        showMessage('No file selected or user not authenticated.', 'info');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        // Max 5MB file size
        showMessage('File is too large (max 5MB).', 'error');
        return;
      }
      event.target.value = ''; // Clear file input value to allow re-uploading the same file

      const reader = new FileReader();
      reader.onload = async e => {
        try {
          const importedRawData = JSON.parse(e.target?.result as string);
          // Deserialize the imported data to convert timestamps back to Timestamp objects
          const deserializedData = firebaseService.deserializeAppState(importedRawData);

          const performImport = async () => {
            if (!currentUser) return; // Re-check user authentication
            await firebaseService.setUserData(currentUser.uid, deserializedData);
            setAppState(deserializedData); // Update local state with imported data
            showMessage('Data imported successfully! Refreshing...', 'success');
            // A full page reload is often necessary after a data import to re-initialize all components
            setTimeout(() => window.location.reload(), 2000);
          };

          // If there's an existing active goal, prompt for confirmation before overwriting
          if (appState?.activeGoalId && appState.goals[appState.activeGoalId]) {
            setConfirmationProps({
              title: 'Overwrite All Data?',
              message:
                'Importing will replace your current goal and all associated data. This action is irreversible. The confirm button will be enabled in 5 seconds.',
              action: performImport,
              actionDelayMs: 5000, // Delay for user to read warning
            });
            setIsConfirmModalOpen(true);
          } else {
            // No active goal, proceed with import directly
            await performImport();
          }
        } catch (error) {
          console.error('Error importing data:', error);
          showMessage('Import failed. Please check file format.', 'error');
        }
      };
      reader.readAsText(file); // Read the file content as text
    },
    [currentUser, appState, showMessage]
  );

  /**
   * Handles exporting all user data to a JSON file.
   */
  const handleExportData = useCallback(async () => {
    if (!appState) {
      showMessage('No data to export.', 'info');
      return;
    }
    try {
      // Serialize the AppState to convert Timestamp objects to strings for export
      const serializableData = firebaseService.serializeAppState(appState);
      const dataStr = JSON.stringify(serializableData, null, 2); // Pretty print JSON
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob); // Create a URL for the blob
      const link = document.createElement('a'); // Create a temporary anchor element
      link.href = url;
      link.download = `one-goal-backup-${new Date().toISOString().split('T')[0]}.json`; // Set download filename
      document.body.appendChild(link); // Append to body to make it clickable
      link.click(); // Programmatically click the link to start download
      document.body.removeChild(link); // Clean up the temporary link
      URL.revokeObjectURL(url); // Release the object URL
      showMessage('Data exported successfully.', 'success');
    } catch (error) {
      console.error('Failed to export data:', error);
      showMessage(`Failed to export data: ${(error as Error).message}`, 'error');
    }
  }, [appState, showMessage]);

  /**
   * Handles initiating the data reset process.
   * Prompts for confirmation before proceeding.
   */
  const handleResetData = useCallback(() => {
    setConfirmationProps({
      title: 'Reset All Data?',
      message:
        'This will permanently erase all your goal data, lists, and routines. This action cannot be undone. The confirm button will be enabled in 10 seconds.',
      action: async () => {
        if (!currentUser) return; // Re-check user authentication
        const resetData = await firebaseService.resetUserData(currentUser.uid);
        setAppState(resetData); // Update local state with the reset data
        showMessage('All data has been reset.', 'info');
      },
      actionDelayMs: 10000, // Longer delay for data reset confirmation
    });
    setIsConfirmModalOpen(true);
  }, [currentUser, showMessage]);

  /**
   * Handles selecting a new avatar URL and updating the user's profile.
   */
  const handleAvatarSelect = async (avatarUrl: string) => {
    if (!currentUser) {
      showMessage('Authentication required to update avatar.', 'error');
      return;
    }
    try {
      await firebaseService.updateUserProfile(currentUser, { photoURL: avatarUrl });
      // Manually update the user object in state to trigger re-render instantly
      setCurrentUser(prevUser => {
        if (!prevUser) return null;
        // Create a new object to ensure React detects the change and re-renders
        const updatedUser = Object.assign(Object.create(Object.getPrototypeOf(prevUser)), prevUser);
        updatedUser.photoURL = avatarUrl;
        return updatedUser;
      });
      showMessage('Avatar updated successfully!', 'success');
      setIsAvatarModalOpen(false); // Close the avatar selection modal
    } catch (error) {
      console.error('Failed to update avatar:', error);
      showMessage('Failed to update avatar. Please try again.', 'error');
    }
  };

  /**
   * Memoized calculation of current goal statistics.
   * Re-calculates only when `appState` changes.
   */
  const goalStats = useMemo(() => {
    // Return null if no active goal is found
    if (!appState?.activeGoalId || !appState.goals[appState.activeGoalId]) return null;

    const goal = appState.goals[appState.activeGoalId];
    const { dailyProgress } = goal; // Use dailyProgress from the specific goal

    const startDate = goal.startDate.toDate();
    const endDate = goal.endDate.toDate();
    const now = new Date();

    const totalDays = Math.max(1, differenceInDays(endDate, startDate) + 1); // Ensure at least 1 day
    const daysPassed = Math.max(0, differenceInDays(now, startDate) + 1); // Days from start to today (inclusive)
    const daysRemaining = Math.max(0, differenceInDays(endDate, now) + 1); // Days from today to end (inclusive)

    const progressValues = Object.values(dailyProgress || {}); // Get all daily progress entries

    // FIX: Correctly calculate total time spent from StopwatchSession durations
    const totalTimeSpentHours =
      progressValues.reduce((daySum, entry) => {
        // Sum durations (in milliseconds) from all sessions for each day
        const sessionDurationMs = (entry.sessions || []).reduce(
          (sessionSum, session) => sessionSum + session.duration, // Use 'duration' property
          0
        );
        return daySum + sessionDurationMs;
      }, 0) /
      (1000 * 60 * 60); // Convert total milliseconds to hours

    // FIX: Correctly calculate average satisfaction from 'satisfaction' property
    const avgSatisfaction =
      progressValues.length > 0
        ? progressValues.reduce((sum, p) => sum + p.satisfaction, 0) / progressValues.length // Use 'satisfaction' property
        : 0;

    return {
      totalDays,
      daysPassed,
      daysRemaining,
      progressEntries: progressValues.length,
      totalTimeSpentHours,
      avgSatisfaction,
    };
  }, [appState]); // Dependency on appState ensures recalculation when data changes

  // Display skeleton loader while page data is loading
  if (loading) {
    return (
      <main className="px-6 py-8 mx-auto max-w-4xl sm:px-8 lg:px-12">
        <ProfilePageSkeleton />
      </main>
    );
  }

  // If no current user, typically means unauthenticated or redirecting, render nothing.
  if (!currentUser) return null;

  return (
    <main className="relative px-6 py-8 mx-auto max-w-4xl sm:px-8 lg:px-12">
      <ToastMessage message={toastMessage} type={toastType} />
      {/* Hidden file input for importing data */}
      <input
        type="file"
        id="import-file-profile"
        accept=".json" // Only accept JSON files
        onChange={handleImportData}
        className="hidden" // Hide the native input element
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
                    ? formatDate(new Date(currentUser.metadata.creationTime), 'MMM d, yyyy') // Corrected format
                    : 'N/A'}
                </span>
              </div>
              <div className="flex gap-2 justify-center items-center md:justify-start">
                <MdRocketLaunch size={16} />
                <span>
                  {appState?.activeGoalId && appState.goals[appState.activeGoalId]
                    ? 'Currently pursuing a goal'
                    : 'No active goal'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Goal Statistics Section (only renders if an active goal exists) */}
      {goalStats && (
        <div className="p-8 mb-8 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl">
          <h2 className="mb-6 text-2xl font-bold text-white">Current Goal Stats</h2>
          <div className="p-4 mb-6 rounded-lg bg-white/5">
            <h3 className="text-lg font-semibold text-white">
              {appState?.goals[appState.activeGoalId || '']?.name}
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              icon={<FiClock />}
              label="Days Remaining"
              value={goalStats.daysRemaining}
              colorClass="text-blue-400"
            />
            <StatCard
              icon={<FiAward />}
              label="Time Invested"
              value={`${goalStats.totalTimeSpentHours.toFixed(1)}h`}
              colorClass="text-yellow-400"
            />
            <StatCard
              icon={<FiTrendingUp />}
              label="Avg. Satisfaction"
              value={`${goalStats.avgSatisfaction.toFixed(1)}/5`}
              colorClass="text-purple-400"
            />
            <StatCard
              icon={<FiHash />}
              label="Total Duration"
              value={`${goalStats.totalDays} days`}
              colorClass="text-teal-400"
            />
            <StatCard
              icon={<FiLogIn />}
              label="Progress Entries"
              value={goalStats.progressEntries}
              colorClass="text-cyan-400"
            />
            <StatCard
              icon={<FiChevronsRight />}
              label="Days Passed"
              value={goalStats.daysPassed}
              colorClass="text-orange-400"
            />
          </div>
        </div>
      )}

      {/* Data Management Section */}
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
                <div className="font-medium">Import Data</div>
                <div className="text-sm text-white/60">
                  Upload a JSON backup file to restore your state.
                </div>
              </div>
            </label>
            <button
              onClick={handleExportData}
              className="flex items-center p-4 w-full text-left text-white rounded-lg border transition-all cursor-pointer border-white/10 hover:bg-white/5 hover:border-white/20"
            >
              <FiDownload className="text-blue-400" size={24} />
              <div className="ml-4">
                <div className="font-medium">Export Data</div>
                <div className="text-sm text-white/60">
                  Download all your data as a single JSON file.
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
                <div className="text-sm text-white/60">
                  Permanently clear your goal, lists, and routines.
                </div>
              </div>
            </button>
          </div>
        </div>
        {/* Account Information Section */}
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
                  ? formatDate(new Date(currentUser.metadata.creationTime), 'MMM d, yyyy') // Corrected format
                  : 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-white/60">Last Sign In</span>
              <span className="text-white/80">
                {currentUser.metadata.lastSignInTime
                  ? formatDate(new Date(currentUser.metadata.lastSignInTime), 'MMM d, yyyy') // Corrected format
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

      {/* Avatar Selection Modal */}
      {isAvatarModalOpen && (
        <AvatarSelectionModal
          isOpen={isAvatarModalOpen}
          onClose={() => setIsAvatarModalOpen(false)}
          onAvatarSelect={handleAvatarSelect}
          currentUser={currentUser}
          showMessage={showMessage}
        />
      )}

      {/* Generic Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title={confirmationProps.title}
        message={confirmationProps.message}
        confirmButton={{ text: 'Confirm', onClick: confirmationProps.action }}
        cancelButton={{ text: 'Cancel', onClick: () => setIsConfirmModalOpen(false) }}
        actionDelayMs={confirmationProps.actionDelayMs} // Apply delay to confirm button
      />
    </main>
  );
}
