// app/(root)/stop-watch/page.tsx
'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { firebaseService } from '@/services/firebaseService';
import Stopwatch from '@/components/Stopwatch';
import { User } from 'firebase/auth';
import { AppState } from '@/types';
import { FiTrash2, FiX, FiCalendar } from 'react-icons/fi';
import { GoStopwatch } from 'react-icons/go';
import { Timestamp } from 'firebase/firestore';
import ToastMessage from '@/components/ToastMessage';
import ConfirmationModal from '@/components/ConfirmationModal';
import SessionLog from '@/components/stopwatch/SessionLog';
import { IconType } from 'react-icons';

interface SessionToDeleteInfo {
  dateKey: string;
  sessionStartTime: Timestamp;
}

interface TabItem {
  id: string;
  label: string;
  icon: IconType;
}

const StopwatchPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setUser] = useState<User | null>(null);
  const [appState, setAppState] = useState<AppState | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // --- SESSION LOG LOGIC (Remains local to this page) ---
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [sessionToDeleteInfo, setSessionToDeleteInfo] = useState<SessionToDeleteInfo | null>(null);

  // --- TABS & GENERIC LOGIC ---
  const [activeTab, setActiveTabInternal] = useState<string>(() => {
    const tabFromUrl = searchParams.get('tab');
    return tabFromUrl || 'stopwatch';
  });

  const showMessage = useCallback((text: string, _: 'success' | 'error' | 'info') => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const fetchUserData = useCallback(
    async (uid: string) => {
      try {
        const data = await firebaseService.getUserData(uid);
        setAppState(data);
      } catch {
        showMessage('Failed to load user data.', 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [showMessage]
  );

  useEffect(() => {
    const unsubscribe = firebaseService.onAuthChange(user => {
      if (user) {
        setUser(user);
        fetchUserData(user.uid);
      } else {
        router.replace('/login');
      }
    });
    return () => unsubscribe();
  }, [router, fetchUserData]);

  const handleDeleteSession = useCallback(async (dateKey: string, sessionStartTime: Timestamp) => {
    setSessionToDeleteInfo({ dateKey, sessionStartTime });
    setIsConfirmModalOpen(true);
  }, []);

  const handleUpdateSession = useCallback(
    async (dateKey: string, sessionStartTime: Timestamp, newLabel: string) => {
      if (!currentUser) return;
      setIsUpdatingId(sessionStartTime.toMillis().toString());
      try {
        await firebaseService.updateStopwatchSession(
          currentUser.uid,
          dateKey,
          sessionStartTime,
          newLabel
        );
        await fetchUserData(currentUser.uid);
        showMessage('Session updated!', 'success');
      } catch {
        showMessage('Failed to update session.', 'error');
      } finally {
        setIsUpdatingId(null);
      }
    },
    [currentUser, fetchUserData, showMessage]
  );

  const confirmDeleteSession = async () => {
    if (!currentUser || !sessionToDeleteInfo) return;
    try {
      await firebaseService.deleteStopwatchSession(
        currentUser.uid,
        sessionToDeleteInfo.dateKey,
        sessionToDeleteInfo.sessionStartTime
      );
      await fetchUserData(currentUser.uid);
      showMessage('Session deleted.', 'info');
    } catch {
      showMessage('Failed to delete session.', 'error');
    } finally {
      setIsConfirmModalOpen(false);
      setSessionToDeleteInfo(null);
    }
  };

  // --- TABS & RENDER LOGIC ---
  const handleTabChange = useCallback(
    (tabId: string) => {
      setActiveTabInternal(tabId);
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set('tab', tabId);
      router.replace(`?${newSearchParams.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const tabItems: TabItem[] = [
    { id: 'stopwatch', label: 'Stopwatch', icon: GoStopwatch },
    { id: 'log', label: 'Session Log', icon: FiCalendar },
  ];

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'stopwatch':
        return <Stopwatch />;
      case 'log':
        return (
          <SessionLog
            appState={appState}
            onDeleteSession={handleDeleteSession}
            onUpdateSession={handleUpdateSession}
            isUpdatingId={isUpdatingId}
          />
        );
      default:
        return null;
    }
  };

  return (
    <main className="flex flex-col min-h-screen text-white bg-black font-poppins">
      <ToastMessage
        message={toastMessage}
        type={
          toastMessage?.includes('saved') || toastMessage?.includes('updated') ? 'success' : 'info'
        }
      />

      <nav className="flex sticky top-0 z-30 justify-center px-4 border-b backdrop-blur-md bg-black/50 border-white/10">
        <div className="flex space-x-2">
          {tabItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-200 border-b-2 focus:outline-none
                        ${isActive ? 'text-white border-blue-500' : 'border-transparent text-white/60 hover:text-white'}`}
                aria-label={item.label}
              >
                <Icon size={18} />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="container flex-grow p-4 mx-auto max-w-4xl">
        <section className="py-8 w-full">
          {isLoading ? <div>Loading...</div> : renderActiveComponent()}
        </section>
      </div>

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Delete Session?"
        message="Are you sure you want to permanently delete this logged session? This action cannot be undone."
        confirmButton={{
          text: 'Delete',
          onClick: confirmDeleteSession,
          className: 'bg-red-600 text-white hover:bg-red-700',
          icon: <FiTrash2 />,
        }}
        cancelButton={{
          text: 'Cancel',
          onClick: () => setIsConfirmModalOpen(false),
          icon: <FiX />,
        }}
      />
    </main>
  );
};

export default function StopwatchPage() {
  return (
    <Suspense fallback={<div>Loading Focus Timers...</div>}>
      <StopwatchPageContent />
    </Suspense>
  );
}
