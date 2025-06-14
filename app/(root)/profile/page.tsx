// app/(root)/profile/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  FiDownload,
  FiUpload,
  FiTrash2,
  FiUser,
  FiMail,
  FiCalendar,
  FiClock,
  FiTrendingUp,
  FiAward,
  FiHash,
  FiLogIn,
  FiChevronsRight,
} from 'react-icons/fi';
import { MdRocketLaunch } from 'react-icons/md';
import { User } from 'firebase/auth';
import { firebaseService } from '@/services/firebaseService';
import { AppState } from '@/types';
import { differenceInDays } from 'date-fns';
import ConfirmationModal from '@/components/ConfirmationModal';
import ToastMessage from '@/components/ToastMessage';

const ProfilePageSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    {/* Profile Header Skeleton */}
    <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8">
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
    <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8">
      <div className="mb-6 w-1/3 h-8 rounded-lg bg-white/10"></div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="h-24 rounded-lg bg-white/5"></div>
        <div className="h-24 rounded-lg bg-white/5"></div>
        <div className="h-24 rounded-lg bg-white/5"></div>
        <div className="h-24 rounded-lg bg-white/5"></div>
        <div className="h-24 rounded-lg bg-white/5"></div>
        <div className="h-24 rounded-lg bg-white/5"></div>
      </div>
    </div>
    {/* Data Management & Account Info Skeletons */}
    <div className="space-y-8">
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8">
        <div className="mb-6 w-1/2 h-8 rounded-lg bg-white/10"></div>
        <div className="space-y-4">
          <div className="h-16 rounded-lg bg-white/5"></div>
          <div className="h-16 rounded-lg bg-white/5"></div>
        </div>
      </div>
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8">
        <div className="mb-6 w-1/2 h-8 rounded-lg bg-white/10"></div>
        <div className="space-y-4">
          <div className="h-6 rounded-lg bg-white/5"></div>
          <div className="h-6 rounded-lg bg-white/5"></div>
          <div className="h-6 rounded-lg bg-white/5"></div>
        </div>
      </div>
    </div>
  </div>
);

type ModalType = 'confirmation' | null;

export default function ProfilePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appState, setAppState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeModal, setActiveModal] = useState<ModalType>(null);
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
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  }, []);

  useEffect(() => {
    const unsubscribe = firebaseService.onAuthChange(async user => {
      if (user) {
        setCurrentUser(user);
        try {
          const userData = await firebaseService.getUserData(user.uid);
          setAppState(userData);
        } catch (error) {
          console.error('Failed to load user data:', error);
          showMessage('Failed to load user data.', 'error');
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, showMessage]);

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      showMessage('File is too large (max 5MB).', 'error');
      return;
    }

    event.target.value = '';

    const reader = new FileReader();
    reader.onload = async e => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        const deserializedData = firebaseService.deserializeForImport(importedData);

        const importAction = async () => {
          if (!currentUser) return;
          await firebaseService.setUserData(currentUser.uid, deserializedData);
          setAppState(deserializedData);
          showMessage('Data imported successfully!', 'success');
        };

        // *** FIX START ***
        // Check if there is an existing goal to determine if confirmation is needed.
        if (appState?.goal) {
          // If a goal exists, show the confirmation modal with a delay.
          setConfirmationProps({
            title: 'Overwrite All Data?',
            message:
              'Importing will replace all current data. This action is irreversible and the confirm button will be enabled in 5 seconds.',
            action: importAction,
            actionDelayMs: 5000,
          });
          setActiveModal('confirmation');
        } else {
          // If no goal exists, import the data directly without confirmation.
          importAction();
        }
        // *** FIX END ***
      } catch {
        showMessage('Failed to import data. Please check file format.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleExportData = async () => {
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

  const handleResetData = async () => {
    setConfirmationProps({
      title: 'Reset All Data?',
      message:
        'This will permanently erase all your goal data. This action cannot be undone. The confirm button will be enabled in 10 seconds.',
      action: async () => {
        if (!currentUser) return;
        const resetData = await firebaseService.resetUserData(currentUser.uid);
        setAppState(resetData);
        showMessage('Data has been reset.', 'info');
      },
      actionDelayMs: 10000,
    });
    setActiveModal('confirmation');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getAccountAge = (creationTime: string | undefined) => {
    if (!creationTime) return 'Unknown';
    const created = new Date(creationTime);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
    return `${Math.floor(diffDays / 365)} years`;
  };

  const getGoalStats = () => {
    if (!appState?.goal) return null;

    const startDate = appState.goal.startDate.toDate();
    const endDate = appState.goal.endDate.toDate();
    const now = new Date();

    const totalDays = differenceInDays(endDate, startDate) + 1;
    const daysPassed = differenceInDays(now, startDate) + 1;
    const daysRemaining = differenceInDays(endDate, now) + 1;
    const progressEntries = appState.dailyProgress.length;

    const totalTimeSpentHours =
      appState.dailyProgress.reduce((sum, entry) => sum + entry.timeSpentMinutes, 0) / 60;

    const avgSatisfaction =
      progressEntries > 0
        ? appState.dailyProgress.reduce((sum, p) => sum + p.satisfactionLevel, 0) / progressEntries
        : 0;

    return {
      totalDays,
      daysPassed: Math.max(0, daysPassed),
      daysRemaining: Math.max(0, daysRemaining),
      progressEntries,
      totalTimeSpentHours,
      avgSatisfaction,
    };
  };

  if (loading) {
    return (
      <main className="relative z-10 px-6 py-8 mx-auto max-w-4xl sm:px-8 lg:px-12">
        <ProfilePageSkeleton />
      </main>
    );
  }

  if (!currentUser) {
    return null;
  }

  const goalStats = getGoalStats();

  return (
    <main className="relative z-10 px-6 py-8 mx-auto max-w-4xl sm:px-8 lg:px-12">
      <ToastMessage message={toastMessage} type={toastType} />

      <div className="mb-8 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl p-8">
        <div className="flex flex-col gap-6 items-center md:flex-row md:items-start">
          <div className="flex-shrink-0">
            {currentUser.photoURL ? (
              <Image
                src={currentUser.photoURL}
                alt="Profile picture"
                width={120}
                height={120}
                className="rounded-full border-2 border-white/20"
              />
            ) : (
              <div className="flex justify-center items-center rounded-full border-2 w-30 h-30 bg-white/10 border-white/20">
                <FiUser size={48} className="text-white/60" />
              </div>
            )}
          </div>
          <div className="flex-grow text-center md:text-left">
            <h1 className="text-2xl font-bold text-white md:text-3xl">
              {currentUser.displayName || 'Anonymous User'}
            </h1>
            <div className="flex flex-col gap-2 mt-4 text-white/70">
              <div className="flex gap-2 justify-center items-center md:justify-start">
                <FiMail size={16} />
                <span>{currentUser.email}</span>
              </div>
              <div className="flex gap-2 justify-center items-center md:justify-start">
                <FiCalendar size={16} />
                <span>Member for {getAccountAge(currentUser.metadata.creationTime)}</span>
              </div>
              <div className="flex gap-2 justify-center items-center md:justify-start">
                <MdRocketLaunch size={16} />
                <span>{appState?.goal ? 'Currently pursuing a goal' : 'No active goal'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {appState?.goal && goalStats && (
        <div className="mb-8 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          <h2 className="mb-6 text-2xl font-bold text-white">Current Goal Progress</h2>
          <div className="p-4 mb-6 rounded-lg bg-white/5">
            <h3 className="text-lg font-semibold text-white">{appState.goal.name}</h3>
            {appState.goal.description && (
              <p className="mt-2 text-white/70">{appState.goal.description}</p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center p-4 rounded-lg bg-white/5">
              <FiClock size={24} className="mr-4 text-blue-400" />
              <div>
                <div className="text-2xl font-bold">{goalStats.daysRemaining}</div>
                <div className="text-sm text-white/60">Days Remaining</div>
              </div>
            </div>
            <div className="flex items-center p-4 rounded-lg bg-white/5">
              <FiAward size={24} className="mr-4 text-yellow-400" />
              <div>
                <div className="text-2xl font-bold">
                  {goalStats.totalTimeSpentHours.toFixed(1)}h
                </div>
                <div className="text-sm text-white/60">Time Invested</div>
              </div>
            </div>
            <div className="flex items-center p-4 rounded-lg bg-white/5">
              <FiTrendingUp size={24} className="mr-4 text-purple-400" />
              <div>
                <div className="text-2xl font-bold">{goalStats.avgSatisfaction.toFixed(1)}/5</div>
                <div className="text-sm text-white/60">Avg. Satisfaction</div>
              </div>
            </div>
            <div className="flex items-center p-4 rounded-lg bg-white/5">
              <FiHash size={24} className="mr-4 text-teal-400" />
              <div>
                <div className="text-2xl font-bold">{goalStats.totalDays}</div>
                <div className="text-sm text-white/60">Total Duration</div>
              </div>
            </div>
            <div className="flex items-center p-4 rounded-lg bg-white/5">
              <FiLogIn size={24} className="mr-4 text-cyan-400" />
              <div>
                <div className="text-2xl font-bold">{goalStats.progressEntries}</div>
                <div className="text-sm text-white/60">Progress Entries</div>
              </div>
            </div>
            <div className="flex items-center p-4 rounded-lg bg-white/5">
              <FiChevronsRight size={24} className="mr-4 text-orange-400" />
              <div>
                <div className="text-2xl font-bold">{goalStats.daysPassed}</div>
                <div className="text-sm text-white/60">Days Passed</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8">
        <div className="bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          <h2 className="mb-6 text-2xl font-bold text-white">Data Management</h2>
          <div className="space-y-4">
            <label
              htmlFor="import-file-profile"
              className="flex items-center p-4 text-left text-white rounded-lg border transition-all cursor-pointer border-white/10 hover:bg-white/5 hover:border-white/20"
            >
              <FiUpload className="text-green-400" size={24} />
              <div className="ml-4">
                <div className="font-medium">Import Data</div>
                <div className="text-sm text-white/60">Upload a JSON backup file</div>
              </div>
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="hidden"
              id="import-file-profile"
            />

            <div
              onClick={handleExportData}
              className="flex items-center p-4 text-left text-white rounded-lg border transition-all cursor-pointer border-white/10 hover:bg-white/5 hover:border-white/20"
            >
              <FiDownload className="text-blue-400" size={24} />
              <div className="ml-4">
                <div className="font-medium">Export Data</div>
                <div className="text-sm text-white/60">Download your data as JSON</div>
              </div>
            </div>
            <div
              onClick={handleResetData}
              className="flex items-center p-4 text-left text-white rounded-lg border transition-all cursor-pointer border-red-400/30 hover:bg-red-400/10 hover:border-red-400/50"
            >
              <FiTrash2 className="text-red-400" size={24} />
              <div className="ml-4">
                <div className="font-medium text-red-400">Reset Data</div>
                <div className="text-sm text-white/60">Permanently clear all data</div>
              </div>
            </div>
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
                  ? formatDate(currentUser.metadata.creationTime)
                  : 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-white/60">Last Sign In</span>
              <span className="text-white/80">
                {currentUser.metadata.lastSignInTime
                  ? formatDate(currentUser.metadata.lastSignInTime)
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

      <ConfirmationModal
        isOpen={activeModal === 'confirmation'}
        onClose={() => setActiveModal(null)}
        title={confirmationProps.title}
        message={confirmationProps.message}
        confirmButton={{
          text: 'Confirm',
          onClick: () => {
            confirmationProps.action();
            setActiveModal(null);
          },
          className: 'bg-red-600 text-white hover:bg-red-700',
        }}
        cancelButton={{ text: 'Cancel', onClick: () => setActiveModal(null) }}
        actionDelayMs={confirmationProps.actionDelayMs}
      />
    </main>
  );
}
