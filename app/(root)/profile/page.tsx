// app/profile/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  FiArrowLeft,
  FiLogOut,
  FiMail,
  FiCalendar,
  FiUser,
  FiDownload,
  FiUpload,
  FiTrash2,
  FiEdit3,
  FiSave,
  FiX,
} from 'react-icons/fi';
import { MdRocketLaunch } from 'react-icons/md';
import { User } from 'firebase/auth';
import { firebaseService } from '@/services/firebaseService';
import { AppState } from '@/types';

export default function ProfilePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appState, setAppState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    const unsubscribe = firebaseService.onAuthChange(async user => {
      if (user) {
        setCurrentUser(user);
        setDisplayName(user.displayName || '');
        try {
          const userData = await firebaseService.getUserData(user.uid);
          setAppState(userData);
        } catch (error) {
          console.error('Failed to load user data:', error);
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await firebaseService.signOutUser();
      router.push('/');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  const handleExportData = () => {
    if (!appState) return;

    const exportData = firebaseService.serializeForExport(appState);
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `one-goal-data-${new Date().toISOString().split('T')[0]}.json`;

    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', exportFileDefaultName);
    link.click();
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    const reader = new FileReader();
    reader.onload = async e => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        const deserializedData = firebaseService.deserializeForImport(importedData);
        await firebaseService.setUserData(currentUser.uid, deserializedData);
        setAppState(deserializedData);
        alert('Data imported successfully!');
      } catch (error) {
        console.error('Failed to import data:', error);
        alert('Failed to import data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = async () => {
    if (!currentUser) return;

    const confirmReset = window.confirm(
      'Are you sure you want to reset all your data? This action cannot be undone.'
    );

    if (confirmReset) {
      try {
        const resetData = await firebaseService.resetUserData(currentUser.uid);
        setAppState(resetData);
        alert('Data reset successfully!');
      } catch (error) {
        console.error('Failed to reset data:', error);
        alert('Failed to reset data. Please try again.');
      }
    }
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

    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysPassed = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const progressEntries = appState.dailyProgress.length;
    const totalTimeSpent = appState.dailyProgress.reduce(
      (sum, entry) => sum + entry.timeSpentMinutes,
      0
    );

    return {
      totalDays,
      daysPassed: Math.max(0, daysPassed),
      daysRemaining: Math.max(0, daysRemaining),
      progressEntries,
      totalTimeSpent,
      completedTodos: appState.toDoList.filter(todo => todo.completed).length,
      totalTodos: appState.toDoList.length,
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col gap-4 items-center">
          <div className="w-8 h-8 rounded-full border-2 border-white animate-spin border-t-transparent"></div>
          <p className="text-white/60">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  const goalStats = getGoalStats();

  return (
    <div className="relative z-10 px-6 py-8 mx-auto max-w-4xl sm:px-8 lg:px-12">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <Link
          href="/dashboard"
          className="inline-flex gap-2 items-center px-4 py-2 rounded-lg transition-colors text-white/70 hover:text-white hover:bg-white/5"
        >
          <FiArrowLeft size={20} />
          Back to Dashboard
        </Link>

        <div className="flex gap-3">
          <button
            onClick={handleSignOut}
            className="inline-flex gap-2 items-center px-4 py-2 font-medium text-red-400 rounded-lg border transition-all border-red-400/30 hover:bg-red-400/10 hover:border-red-400/50"
          >
            <FiLogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>

      {/* Profile Header */}
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
            <div className="flex flex-col gap-2 items-center md:flex-row md:items-center md:gap-4">
              {isEditing ? (
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className="px-3 py-1 text-2xl font-bold text-white rounded border bg-white/5 border-white/20 focus:outline-none focus:border-white/40"
                    placeholder="Your name"
                  />
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      // Note: Firebase Auth doesn't allow updating displayName directly
                      // You might want to store custom names in Firestore if needed
                    }}
                    className="p-1 text-green-400 rounded hover:bg-white/5"
                  >
                    <FiSave size={16} />
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setDisplayName(currentUser.displayName || '');
                    }}
                    className="p-1 text-red-400 rounded hover:bg-white/5"
                  >
                    <FiX size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 items-center">
                  <h1 className="text-2xl font-bold text-white md:text-3xl">
                    {currentUser.displayName || 'Anonymous User'}
                  </h1>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 rounded text-white/60 hover:text-white hover:bg-white/5"
                  >
                    <FiEdit3 size={16} />
                  </button>
                </div>
              )}
            </div>

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

      {/* Current Goal Stats */}
      {appState?.goal && goalStats && (
        <div className="mb-8 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          <h2 className="mb-6 text-2xl font-bold text-white">Current Goal Progress</h2>
          <div className="p-4 mb-4 rounded-lg bg-white/5">
            <h3 className="text-lg font-semibold text-white">{appState.goal.name}</h3>
            {appState.goal.description && (
              <p className="mt-2 text-white/70">{appState.goal.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="p-4 text-center rounded-lg bg-white/5">
              <div className="text-2xl font-bold text-blue-400">{goalStats.daysPassed}</div>
              <div className="text-sm text-white/60">Days Active</div>
            </div>
            <div className="p-4 text-center rounded-lg bg-white/5">
              <div className="text-2xl font-bold text-green-400">{goalStats.daysRemaining}</div>
              <div className="text-sm text-white/60">Days Remaining</div>
            </div>
            <div className="p-4 text-center rounded-lg bg-white/5">
              <div className="text-2xl font-bold text-purple-400">
                {Math.round(goalStats.totalTimeSpent / 60)}h
              </div>
              <div className="text-sm text-white/60">Time Invested</div>
            </div>
            <div className="p-4 text-center rounded-lg bg-white/5">
              <div className="text-2xl font-bold text-orange-400">
                {goalStats.completedTodos}/{goalStats.totalTodos}
              </div>
              <div className="text-sm text-white/60">Tasks Done</div>
            </div>
          </div>
        </div>
      )}

      {/* Data Management */}
      <div className="mb-8 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl p-8">
        <h2 className="mb-6 text-2xl font-bold text-white">Data Management</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <button
            onClick={handleExportData}
            className="flex gap-3 items-center p-4 text-left text-white rounded-lg border transition-all border-white/10 hover:bg-white/5 hover:border-white/20"
          >
            <FiDownload className="text-green-400" size={20} />
            <div>
              <div className="font-medium">Export Data</div>
              <div className="text-sm text-white/60">Download your data as JSON</div>
            </div>
          </button>

          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              id="import-file"
            />
            <label
              htmlFor="import-file"
              className="flex gap-3 items-center p-4 text-left text-white rounded-lg border transition-all cursor-pointer border-white/10 hover:bg-white/5 hover:border-white/20"
            >
              <FiUpload className="text-blue-400" size={20} />
              <div>
                <div className="font-medium">Import Data</div>
                <div className="text-sm text-white/60">Upload JSON backup file</div>
              </div>
            </label>
          </div>

          <button
            onClick={handleResetData}
            className="flex gap-3 items-center p-4 text-left text-white rounded-lg border transition-all border-red-400/30 hover:bg-red-400/10 hover:border-red-400/50"
          >
            <FiTrash2 className="text-red-400" size={20} />
            <div>
              <div className="font-medium text-red-400">Reset Data</div>
              <div className="text-sm text-white/60">Clear all data permanently</div>
            </div>
          </button>
        </div>
      </div>

      {/* Account Information */}
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
  );
}
