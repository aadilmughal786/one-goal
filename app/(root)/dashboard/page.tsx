// app/(root)/dashboard/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Timestamp } from 'firebase/firestore';
import { isToday, format } from 'date-fns';

import { firebaseService } from '@/services/firebaseService';
import { AppState, Goal, DailyProgress } from '@/types';

import GoalModal from '@/components/GoalModal';
import ToastMessage from '@/components/ToastMessage';
import CountdownCard from '@/components/dashboard/CountdownCard';
import ProgressCalendar from '@/components/dashboard/ProgressCalendar';
import DailyProgressModal from '@/components/dashboard/DailyProgressModal';
import Charts from '@/components/dashboard/Charts';
import ConfirmationModal from '@/components/ConfirmationModal';

import { MdRocketLaunch } from 'react-icons/md';
import { FiTarget, FiUpload, FiDownload, FiPlusCircle, FiEdit } from 'react-icons/fi';

const DashboardSkeletonLoader = () => (
  <div className="space-y-8 animate-pulse">
    <div className="text-center">
      <div className="mx-auto mb-2 w-1/2 h-8 rounded-lg bg-white/10"></div>
      <div className="mx-auto w-3/4 h-5 rounded-lg bg-white/10"></div>
    </div>
    <div className="p-8 bg-white/[0.02] border border-white/10 rounded-3xl shadow-lg">
      <div className="mb-2 w-3/4 h-8 rounded-lg bg-white/10"></div>
      <div className="mb-8 w-full h-4 rounded-lg bg-white/10"></div>
      <div className="flex flex-col gap-8 items-center md:flex-row">
        <div className="flex-shrink-0 w-48 h-48 rounded-full sm:w-56 sm:h-56 bg-white/10"></div>
        <div className="flex-1 space-y-4 w-full">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="h-24 rounded-lg bg-white/5"></div>
            <div className="h-24 rounded-lg bg-white/5"></div>
            <div className="h-24 rounded-lg bg-white/5"></div>
            <div className="h-24 rounded-lg bg-white/5"></div>
          </div>
          <div className="p-4 space-y-3 rounded-lg bg-white/5">
            <div className="w-3/4 h-4 rounded-full bg-white/10"></div>
            <div className="w-5/6 h-4 rounded-full bg-white/10"></div>
          </div>
        </div>
      </div>
    </div>

    <div className="p-6 bg-white/[0.02] border border-white/10 rounded-3xl shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <div className="w-1/3 h-7 rounded-lg bg-white/10"></div>
        <div className="flex gap-2">
          <div className="w-8 h-8 rounded-full bg-white/10"></div>
          <div className="w-8 h-8 rounded-full bg-white/10"></div>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 28 }).map((_, i) => (
          <div key={i} className="w-full h-16 rounded-lg sm:h-20 bg-white/5"></div>
        ))}
      </div>
    </div>
    <div className="space-y-8">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="p-6 bg-white/[0.02] border border-white/10 rounded-3xl shadow-lg">
          <div className="mx-auto mb-6 w-1/2 h-7 rounded-lg bg-white/10"></div>
          <div className="h-64 rounded-lg bg-white/5"></div>
        </div>
      ))}
    </div>

    <div className="p-8 text-center bg-white/[0.02] border border-white/10 rounded-2xl shadow-lg">
      <div className="mx-auto mb-6 w-1/2 h-8 rounded-lg bg-white/10"></div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        <div className="h-24 rounded-lg bg-white/10"></div>
        <div className="h-24 rounded-lg bg-white/10"></div>
        <div className="h-24 rounded-lg bg-white/10"></div>
        <div className="h-24 rounded-lg bg-white/10"></div>
      </div>
    </div>
  </div>
);

type ModalType = 'goal' | 'dailyProgress' | 'confirmation' | null;

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appState, setAppState] = useState<AppState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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
    const unsubscribe = firebaseService.onAuthChange(user => {
      if (user) {
        setCurrentUser(user);
        firebaseService.getUserData(user.uid).then(data => {
          setAppState(data);
          setIsLoading(false);
        });
      } else {
        router.replace('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleSetGoal = useCallback(
    async (goalName: string, endDateStr: string, description?: string) => {
      if (!currentUser) return;
      const goalEndDate = new Date(endDateStr);
      const newGoal: Goal = {
        name: goalName,
        description: description || '',
        startDate: isEditMode && appState?.goal ? appState.goal.startDate : Timestamp.now(),
        endDate: Timestamp.fromDate(goalEndDate),
      };
      await firebaseService.updateGoal(currentUser.uid, newGoal);
      const updatedUserData = await firebaseService.getUserData(currentUser.uid);
      setAppState(updatedUserData);
      setActiveModal(null);
      showMessage(isEditMode ? 'Goal updated successfully!' : 'Goal set successfully!', 'success');
    },
    [currentUser, appState, isEditMode, showMessage]
  );

  const handleOpenGoalModal = (isEditing = false) => {
    setIsEditMode(isEditing);
    setActiveModal('goal');
  };

  const handleDayClick = (date: Date) => {
    if (isToday(date)) {
      setSelectedDate(date);
      setActiveModal('dailyProgress');
    }
  };

  const handleSaveProgress = async (progressData: DailyProgress) => {
    if (!currentUser) return;
    await firebaseService.saveDailyProgress(currentUser.uid, progressData);
    setAppState(prev => {
      if (!prev) return null;
      const newProgressList = prev.dailyProgress.filter(
        p => p.date.toDate().toDateString() !== progressData.date.toDate().toDateString()
      );
      newProgressList.push(progressData);
      newProgressList.sort((a, b) => a.date.toMillis() - b.date.toMillis());
      return { ...prev, dailyProgress: newProgressList };
    });
    setActiveModal(null);
    showMessage('Progress saved successfully!', 'success');
  };

  const promptForNewGoal = () => {
    if (appState?.goal) {
      setConfirmationProps({
        title: 'Create New Goal?',
        message:
          'This will erase your current goal and all associated data. This action is irreversible. The confirm button will be enabled in 10 seconds.',
        action: () => {
          if (!currentUser) return;
          firebaseService.resetUserData(currentUser.uid).then(() => {
            setAppState(null);
            handleOpenGoalModal(false);
            setActiveModal('goal');
          });
        },
        actionDelayMs: 10000,
      });
      setActiveModal('confirmation');
    } else {
      handleOpenGoalModal(false);
    }
  };

  const handleImportChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;
    event.target.value = '';

    const reader = new FileReader();
    reader.onload = async e => {
      try {
        const importedRawData = JSON.parse(e.target?.result as string);
        const importedState = firebaseService.deserializeForImport(importedRawData);

        const confirmImport = () => {
          handleConfirmImport(importedState);
        };

        setConfirmationProps({
          title: 'Overwrite All Data?',
          message:
            'Importing will replace all your current data. This action is irreversible. The confirm button will be enabled in 10 seconds.',
          action: confirmImport,
          actionDelayMs: 10000,
        });
        setActiveModal('confirmation');
      } catch {
        showMessage('Import failed: Invalid file format.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async (importedState: AppState) => {
    if (!currentUser) return;
    try {
      await firebaseService.setUserData(currentUser.uid, importedState);
      showMessage('Data imported successfully. Refreshing...', 'success');
      setActiveModal(null);
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      showMessage(`Failed to save imported data: ${(error as Error).message}`, 'error');
      setActiveModal(null);
    }
  };

  const handleExport = async () => {
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

  if (isLoading || !appState) {
    return (
      <div className="container p-4 mx-auto max-w-4xl">
        <section className="py-8">
          <DashboardSkeletonLoader />
        </section>
      </div>
    );
  }

  const initialProgress = appState?.dailyProgress.find(
    p =>
      selectedDate && format(p.date.toDate(), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
  );
  const transformedGoalForModal = appState.goal
    ? {
        name: appState.goal.name,
        description: appState.goal.description || '',
        startDate: appState.goal.startDate.toDate().toISOString(),
        endDate: appState.goal.endDate.toDate().toISOString(),
      }
    : null;

  return (
    <div className="container p-4 mx-auto max-w-4xl">
      <ToastMessage message={toastMessage} type={toastType} />
      <input
        type="file"
        id="dashboardImportFile"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleImportChange}
      />

      <section className="py-8">
        {appState.goal ? (
          <div className="space-y-12">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-white sm:text-5xl">
                <span className="text-white/70">Welcome back,</span>{' '}
                {currentUser?.displayName?.split(' ')[0] || 'Explorer'}.
              </h2>
            </div>

            <section>
              <div className="mb-8 text-center">
                <h3 className="mb-2 text-2xl font-bold">Your Mission Control</h3>
                <p className="mx-auto max-w-2xl text-white/60">
                  This is your command center. Monitor your progress, track your time, and stay
                  focused on the one thing that matters most right now.
                </p>
              </div>
              <CountdownCard goal={appState.goal} />
            </section>

            <section>
              <div className="mb-8 text-center">
                <h3 className="mb-2 text-2xl font-bold">Progress Calendar</h3>
                <p className="mx-auto max-w-2xl text-white/60">
                  Visualize your daily satisfaction and log today&apos;s progress with a single
                  click.
                </p>
              </div>
              <ProgressCalendar
                goal={appState.goal}
                dailyProgress={appState.dailyProgress}
                onDayClick={handleDayClick}
              />
            </section>

            <section>
              <div className="mb-8 text-center">
                <h3 className="mb-2 text-2xl font-bold">Performance Insights</h3>
                <p className="mx-auto max-w-2xl text-white/60">
                  Analyze trends in your effort and satisfaction to understand what works best for
                  you.
                </p>
              </div>
              {/* --- MODIFIED: Passing the goal prop to Charts --- */}
              <Charts dailyProgress={appState.dailyProgress} goal={appState.goal} />
            </section>

            <section>
              <div className="p-8 text-center bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg">
                <h3 className="mb-2 text-2xl font-bold">Manage Your Goal</h3>
                <p className="mx-auto mb-6 max-w-2xl text-white/60">
                  Need to make changes? You can update your goal, start fresh, or manage your data
                  backups here.
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                  <div
                    onClick={() => handleOpenGoalModal(true)}
                    className="flex flex-col justify-center items-center p-4 text-white rounded-lg border transition-all cursor-pointer border-blue-400/30 hover:bg-blue-400/10 hover:border-blue-400/50"
                  >
                    <FiEdit size={24} className="mb-2 text-blue-400" />
                    <span className="font-semibold">Update Goal</span>
                  </div>
                  <div
                    onClick={promptForNewGoal}
                    className="flex flex-col justify-center items-center p-4 text-white rounded-lg border transition-all cursor-pointer border-red-400/30 hover:bg-red-400/10 hover:border-red-400/50"
                  >
                    <FiPlusCircle size={24} className="mb-2 text-red-400" />
                    <span className="font-semibold">New Goal</span>
                  </div>
                  <label
                    htmlFor="dashboardImportFile"
                    className="flex flex-col justify-center items-center p-4 text-white rounded-lg border transition-all cursor-pointer border-white/20 hover:bg-white/10"
                  >
                    <FiUpload size={24} className="mb-2 text-green-400" />
                    <span className="font-semibold">Import Data</span>
                  </label>
                  <div
                    onClick={handleExport}
                    className="flex flex-col justify-center items-center p-4 text-white rounded-lg border transition-all cursor-pointer border-white/20 hover:bg-white/10"
                  >
                    <FiDownload size={24} className="mb-2 text-purple-400" />
                    <span className="font-semibold">Export Data</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        ) : (
          <div className="p-10 text-center bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg">
            <MdRocketLaunch className="mx-auto mb-6 w-20 h-20 text-white/70" />
            <h2 className="mb-4 text-3xl font-bold text-white">Start Your Journey</h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-white/70">
              Define your primary objective or import existing data to begin.
            </p>
            <div className="flex flex-col gap-4 justify-center sm:flex-row">
              <button
                onClick={() => handleOpenGoalModal(false)}
                className="inline-flex gap-3 items-center px-8 py-4 font-semibold text-black bg-white rounded-full transition-all duration-200 cursor-pointer group hover:bg-white/90 hover:scale-105"
              >
                <FiTarget size={20} />
                Set Your First Goal
              </button>
              <label
                htmlFor="dashboardImportFile"
                className="inline-flex gap-3 items-center px-8 py-4 font-semibold text-white rounded-full transition-all duration-200 cursor-pointer bg-white/10 group hover:bg-white/20 hover:scale-105"
              >
                <FiUpload size={20} />
                Import Data
              </label>
            </div>
          </div>
        )}
      </section>

      <GoalModal
        isOpen={activeModal === 'goal'}
        onClose={() => setActiveModal(null)}
        onSetGoal={handleSetGoal}
        showMessage={showMessage}
        initialGoalData={isEditMode ? transformedGoalForModal : null}
        isEditMode={isEditMode}
      />

      {selectedDate && (
        <DailyProgressModal
          isOpen={activeModal === 'dailyProgress'}
          onClose={() => setActiveModal(null)}
          date={selectedDate}
          initialProgress={initialProgress}
          onSave={handleSaveProgress}
        />
      )}

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
    </div>
  );
}
