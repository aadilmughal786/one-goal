// app/(root)/stop-watch/page.tsx
'use client';

import ConfirmationModal from '@/components/common/ConfirmationModal';
import ToastMessage from '@/components/common/ToastMessage';
import SessionLog from '@/components/stop-watch/SessionLog';
import Stopwatch from '@/components/stop-watch/Stopwatch';
import { firebaseService } from '@/services/firebaseService';
import { AppState } from '@/types';
import { User } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { IconType } from 'react-icons';
import { FiCalendar, FiTrash2, FiX } from 'react-icons/fi'; // FiTarget and FiEdit removed as they are in NoActiveGoalMessage
import { GoStopwatch } from 'react-icons/go';

// Import the new common component
import NoActiveGoalMessage from '@/components/common/NoActiveGoalMessage';

// Updated interface to reflect the change from sessionStartTime (Timestamp) to sessionId (string)
interface SessionToDeleteInfo {
  dateKey: string;
  sessionId: string; // Changed from sessionStartTime: Timestamp
}

interface TabItem {
  id: string;
  label: string;
  icon: IconType;
}

const tabItems: TabItem[] = [
  { id: 'stopwatch', label: 'Stopwatch', icon: GoStopwatch },
  { id: 'log', label: 'Session Log', icon: FiCalendar },
];

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
      } catch (error) {
        console.error("Error fetching user's active goal:", error);
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

  /**
   * Handles the initiation of a session deletion.
   * Stores the session info and opens the confirmation modal.
   * @param goalId The ID of the goal the session belongs to.
   * @param dateKey The date string (YYYY-MM-DD) of the daily progress.
   * @param sessionId The ID of the session to delete.
   */
  const handleDeleteSession = useCallback(
    async (goalId: string, dateKey: string, sessionId: string) => {
      setSessionToDeleteInfo({ dateKey, sessionId });
      setIsConfirmModalOpen(true);
    },
    []
  );

  /**
   * Handles the update of a stopwatch session's label.
   * @param goalId The ID of the goal the session belongs to.
   * @param dateKey The date string (YYYY-MM-DD) of the daily progress.
   * @param sessionId The ID of the session to update.
   * @param newLabel The new label for the session.
   */
  const handleUpdateSession = useCallback(
    async (goalId: string, dateKey: string, sessionId: string, newLabel: string) => {
      if (!currentUser) {
        showMessage('Authentication required to update session.', 'error');
        return;
      }
      setIsUpdatingId(sessionId);
      try {
        await firebaseService.updateStopwatchSession(goalId, currentUser.uid, dateKey, sessionId, {
          label: newLabel,
        });
        await fetchUserData(currentUser.uid); // Re-fetch for consistency
        showMessage('Session updated.', 'success');
      } catch (error) {
        console.error('Error updating session:', error);
        showMessage('Failed to update session.', 'error');
      } finally {
        setIsUpdatingId(null);
      }
    },
    [currentUser, fetchUserData, showMessage]
  );

  /**
   * Confirms and proceeds with deleting the stored session.
   */
  const confirmDeleteSession = async () => {
    // Get the active goal from the current appState
    const activeGoalId = appState?.activeGoalId;

    if (!currentUser || !sessionToDeleteInfo || !activeGoalId) {
      console.error('Attempted to delete session without complete info or active goal.');
      showMessage('Cannot delete session: Missing information or no active goal.', 'error');
      setIsConfirmModalOpen(false);
      setSessionToDeleteInfo(null);
      return;
    }

    try {
      await firebaseService.deleteStopwatchSession(
        activeGoalId, // Pass activeGoalId
        currentUser.uid,
        sessionToDeleteInfo.dateKey,
        sessionToDeleteInfo.sessionId // Use sessionId here
      );
      await fetchUserData(currentUser.uid); // Re-fetch data to update UI
      showMessage('Session deleted.', 'info');
    } catch (error) {
      console.error('Error deleting session:', error);
      showMessage('Failed to delete session.', 'error');
    } finally {
      setIsConfirmModalOpen(false); // Close the modal
      setSessionToDeleteInfo(null); // Clear session info
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

  const renderActiveComponent = () => {
    // Get the active goal for conditional rendering within the tabs' content
    const activeGoal = appState?.activeGoalId ? appState.goals[appState.activeGoalId] : null;

    if (isLoading) {
      return <div className="text-center text-white/70">Loading...</div>;
    }

    // If no active goal, display the reusable NoActiveGoalMessage component
    if (!activeGoal) {
      return <NoActiveGoalMessage />;
    }

    // Render the active tab content if an active goal exists
    switch (activeTab) {
      case 'stopwatch':
        return <Stopwatch />;
      case 'log':
        return (
          <SessionLog
            appState={appState} // Pass appState (which contains the active goal)
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

      {/* Navigation tabs always visible */}
      <nav className="flex sticky top-0 z-30 justify-center px-4 border-b backdrop-blur-md bg-black/50 border-white/10">
        <div className="flex space-x-2">
          {isLoading
            ? [...Array(tabItems.length)].map((_, i) => (
                <div key={i} className="px-4 py-4 animate-pulse">
                  <div className="w-20 h-6 rounded-md bg-white/10"></div>
                </div>
              ))
            : tabItems.map(item => {
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
        <section className="py-8 w-full">{renderActiveComponent()}</section>
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
