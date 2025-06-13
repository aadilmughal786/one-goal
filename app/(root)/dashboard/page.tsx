// app/(root)/dashboard/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Timestamp } from 'firebase/firestore';

import { firebaseService } from '@/services/firebaseService';
import { AppState, Goal, DailyProgress } from '@/types';

import GoalModal from '@/components/GoalModal';
import ToastMessage from '@/components/ToastMessage';
import CountdownCard from '@/components/dashboard/CountdownCard';
import ProgressCalendar from '@/components/dashboard/ProgressCalendar';
import DailyProgressModal from '@/components/dashboard/DailyProgressModal';
import Charts from '@/components/dashboard/Charts';

import { MdRocketLaunch } from 'react-icons/md';
import { FiTarget, FiPlusCircle } from 'react-icons/fi';
import { isToday, format } from 'date-fns';

const DashboardSkeletonLoader = () => (
  <div className="space-y-8 animate-pulse">
    <div className="p-8 bg-white/[0.02] border border-white/10 rounded-3xl shadow-lg">
      <div className="flex flex-col gap-8 items-center md:flex-row">
        <div className="flex-shrink-0 w-48 h-48 rounded-full sm:w-56 sm:h-56 bg-white/10"></div>
        <div className="flex-1 w-full">
          <div className="mb-4 w-3/4 h-8 rounded-lg bg-white/10"></div>
          <div className="mb-8 w-full h-4 rounded-lg bg-white/10"></div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="w-full h-20 rounded-lg bg-white/5"></div>
            <div className="w-full h-20 rounded-lg bg-white/5"></div>
            <div className="w-full h-20 rounded-lg bg-white/5"></div>
            <div className="w-full h-20 rounded-lg bg-white/5"></div>
          </div>
        </div>
      </div>
    </div>
    <div className="p-6 h-96 bg-white/[0.02] border border-white/10 rounded-3xl shadow-lg"></div>
    <div className="p-6 h-80 bg-white/[0.02] border border-white/10 rounded-3xl shadow-lg"></div>
  </div>
);

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appState, setAppState] = useState<AppState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [isDailyProgressModalOpen, setIsDailyProgressModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [initialProgress, setInitialProgress] = useState<DailyProgress | undefined>(undefined);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const showMessage = useCallback((text: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(text);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  }, []);

  const openConfirmationModal = useCallback(
    (title: string, message: string, action: () => void) => {
      action();
    },
    []
  );

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
      setIsGoalModalOpen(false);
      showMessage(isEditMode ? 'Goal updated successfully!' : 'Goal set successfully!', 'success');
    },
    [currentUser, appState, isEditMode, showMessage]
  );

  const handleOpenEditModal = () => {
    setIsEditMode(true);
    setIsGoalModalOpen(true);
  };

  const handleOpenNewGoalModal = () => {
    const action = () => {
      if (!currentUser) return;
      firebaseService.resetUserData(currentUser.uid).then(() => {
        setAppState({
          goal: null,
          dailyProgress: [],
          notToDoList: [],
          contextList: [],
          toDoList: [],
        });
        setIsEditMode(false);
        setIsGoalModalOpen(true);
      });
    };

    if (appState?.goal) {
      openConfirmationModal(
        'Create New Goal?',
        'This will erase your current goal and all associated data. This action cannot be undone.',
        action
      );
    } else {
      setIsEditMode(false);
      setIsGoalModalOpen(true);
    }
  };

  const handleDayClick = (date: Date) => {
    if (isToday(date)) {
      const dateKey = format(date, 'yyyy-MM-dd');
      const progress = appState?.dailyProgress.find(
        p => format(p.date.toDate(), 'yyyy-MM-dd') === dateKey
      );
      setSelectedDate(date);
      setInitialProgress(progress);
      setIsDailyProgressModalOpen(true);
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
    setIsDailyProgressModalOpen(false);
    showMessage('Progress saved successfully!', 'success');
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
      <section className="py-8">
        {appState.goal ? (
          <div className="space-y-8">
            <CountdownCard goal={appState.goal} onEdit={handleOpenEditModal} />
            <ProgressCalendar
              goal={appState.goal}
              dailyProgress={appState.dailyProgress}
              onDayClick={handleDayClick}
            />
            <Charts dailyProgress={appState.dailyProgress} />
          </div>
        ) : (
          <div className="p-10 text-center bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg">
            <MdRocketLaunch className="mx-auto mb-6 w-20 h-20 text-white/70" />
            <h2 className="mb-4 text-3xl font-bold text-white">Start Your Journey</h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-white/70">
              Define your primary objective and begin tracking your progress toward success.
            </p>
            <button
              onClick={handleOpenNewGoalModal}
              className="inline-flex gap-3 items-center px-8 py-4 font-semibold text-black bg-white rounded-full transition-all duration-200 cursor-pointer group hover:bg-white/90 hover:scale-105"
            >
              <FiTarget size={20} />
              Set Your First Goal
            </button>
          </div>
        )}
      </section>

      {appState.goal && (
        <section className="py-8 text-center">
          <button
            onClick={handleOpenNewGoalModal}
            className="inline-flex gap-3 items-center px-8 py-4 font-semibold text-white bg-red-600 rounded-full transition-all duration-200 cursor-pointer group hover:bg-red-700 hover:scale-105"
          >
            <FiPlusCircle size={20} />
            Set New Goal
          </button>
        </section>
      )}

      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSetGoal={handleSetGoal}
        showMessage={showMessage}
        initialGoalData={isEditMode ? transformedGoalForModal : null}
        isEditMode={isEditMode}
      />

      {selectedDate && (
        <DailyProgressModal
          isOpen={isDailyProgressModalOpen}
          onClose={() => setIsDailyProgressModalOpen(false)}
          date={selectedDate}
          initialProgress={initialProgress}
          onSave={handleSaveProgress}
        />
      )}
    </div>
  );
}
