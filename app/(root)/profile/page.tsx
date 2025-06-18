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
  FiEdit, // Import the edit icon
} from 'react-icons/fi';
import { MdRocketLaunch } from 'react-icons/md';
import { User } from 'firebase/auth';
import { firebaseService } from '@/services/firebaseService';
import { AppState } from '@/types';
import { differenceInDays, format as formatDate } from 'date-fns';
import ConfirmationModal from '@/components/ConfirmationModal';
import ToastMessage from '@/components/ToastMessage';
import AvatarSelectionModal from '@/components/profile/AvatarSelectionModal'; // Import the new modal

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
  }, []);

  const fetchUserAndData = useCallback(
    async (user: User) => {
      try {
        const userData = await firebaseService.getUserData(user.uid);
        setAppState(userData);
      } catch {
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
          const importedData = JSON.parse(e.target?.result as string);
          const deserializedData = firebaseService.deserializeForImport(importedData);

          const performImport = async () => {
            if (!currentUser) return;
            await firebaseService.setUserData(currentUser.uid, deserializedData);
            setAppState(deserializedData);
            showMessage('Data imported successfully! Refreshing...', 'success');
            setTimeout(() => window.location.reload(), 2000);
          };

          if (appState?.goal) {
            setConfirmationProps({
              title: 'Overwrite All Data?',
              message:
                'Importing will replace your current goal and all associated data. This action is irreversible. The confirm button will be enabled in 5 seconds.',
              action: performImport,
              actionDelayMs: 5000,
            });
            setIsConfirmModalOpen(true);
          } else {
            await performImport();
          }
        } catch {
          showMessage('Import failed. Please check file format.', 'error');
        }
      };
      reader.readAsText(file);
    },
    [currentUser, appState?.goal, showMessage]
  );

  const handleExportData = useCallback(async () => {
    if (!appState) return;
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
  }, [appState, showMessage]);

  const handleResetData = useCallback(() => {
    setConfirmationProps({
      title: 'Reset All Data?',
      message:
        'This will permanently erase all your goal data, lists, and routines. This action cannot be undone. The confirm button will be enabled in 10 seconds.',
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
    } catch {
      showMessage('Failed to update avatar. Please try again.', 'error');
    }
  };

  const goalStats = useMemo(() => {
    if (!appState?.goal) return null;
    const { goal, dailyProgress } = appState;
    const startDate = goal.startDate.toDate();
    const endDate = goal.endDate.toDate();
    const now = new Date();

    const totalDays = Math.max(1, differenceInDays(endDate, startDate) + 1);
    const daysPassed = Math.max(0, differenceInDays(now, startDate) + 1);
    const daysRemaining = Math.max(0, differenceInDays(endDate, now) + 1);
    const progressValues = Object.values(dailyProgress);
    const totalTimeSpentHours =
      progressValues.reduce((sum, entry) => sum + (entry.effortTimeMinutes || 0), 0) / 60;
    const avgSatisfaction =
      progressValues.length > 0
        ? progressValues.reduce((sum, p) => sum + p.satisfactionLevel, 0) / progressValues.length
        : 0;

    return {
      totalDays,
      daysPassed,
      daysRemaining,
      progressEntries: progressValues.length,
      totalTimeSpentHours,
      avgSatisfaction,
    };
  }, [appState]);

  if (loading) {
    return (
      <main className="px-6 py-8 mx-auto max-w-4xl sm:px-8 lg:px-12">
        <ProfilePageSkeleton />
      </main>
    );
  }

  if (!currentUser) return null;

  return (
    // FIX: Removed the `z-10` class from the main element.
    <main className="relative px-6 py-8 mx-auto max-w-4xl sm:px-8 lg:px-12">
      <ToastMessage message={toastMessage} type={toastType} />
      <input
        type="file"
        id="import-file-profile"
        accept=".json"
        onChange={handleImportData}
        className="hidden"
      />

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
                    ? formatDate(new Date(currentUser.metadata.creationTime), 'MMM d, yyyy')
                    : 'N/A'}
                </span>
              </div>
              <div className="flex gap-2 justify-center items-center md:justify-start">
                <MdRocketLaunch size={16} />
                <span>{appState?.goal ? 'Currently pursuing a goal' : 'No active goal'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {goalStats && (
        <div className="p-8 mb-8 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl">
          <h2 className="mb-6 text-2xl font-bold text-white">Current Goal Stats</h2>
          <div className="p-4 mb-6 rounded-lg bg-white/5">
            <h3 className="text-lg font-semibold text-white">{appState?.goal?.name}</h3>
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
                  ? formatDate(new Date(currentUser.metadata.creationTime), 'MMM d, yyyy')
                  : 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-white/60">Last Sign In</span>
              <span className="text-white/80">
                {currentUser.metadata.lastSignInTime
                  ? formatDate(new Date(currentUser.metadata.lastSignInTime), 'MMM d, yyyy')
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
