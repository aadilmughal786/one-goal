// app/(root)/stop-watch/page.tsx
'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { firebaseService } from '@/services/firebaseService';
import Stopwatch from '@/components/stop-watch/Stopwatch';
import { User } from 'firebase/auth';
import { AppState } from '@/types';
import { FiTrash2, FiX, FiCalendar } from 'react-icons/fi';
import { GoStopwatch } from 'react-icons/go';
// Removed Timestamp import as it's no longer directly used in SessionToDeleteInfo,
// now using sessionId string.
// import { Timestamp } from 'firebase/firestore';
import ToastMessage from '@/components/common/ToastMessage';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import SessionLog from '@/components/stop-watch/SessionLog';
import { IconType } from 'react-icons';

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

const StopwatchPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setUser] = useState<User | null>(null);
  const [appState, setAppState] = useState<AppState | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // State to track if an item is being updated (for loading spinners)
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);
  // State for the confirmation modal for session deletion
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  // State to store information about the session to be deleted
  const [sessionToDeleteInfo, setSessionToDeleteInfo] = useState<SessionToDeleteInfo | null>(null);

  // --- TABS & GENERIC LOGIC ---
  // Controls the currently active tab, initialized from URL search params or defaults to 'stopwatch'
  const [activeTab, setActiveTabInternal] = useState<string>(() => {
    const tabFromUrl = searchParams.get('tab');
    return tabFromUrl || 'stopwatch';
  });

  /**
   * Displays a toast message to the user.
   * @param text The message to display.
   * @param type The type of message ('success', 'error', 'info') - currently inferred.
   */
  const showMessage = useCallback((text: string, _: 'success' | 'error' | 'info') => {
    setToastMessage(text);
    // Automatically clear the message after 3 seconds
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  /**
   * Fetches user data from Firebase and updates the appState.
   * @param uid The user's Firebase UID.
   */
  const fetchUserData = useCallback(
    async (uid: string) => {
      try {
        const data = await firebaseService.getUserData(uid);
        setAppState(data);
      } catch (error) {
        console.error('Error fetching user data:', error);
        showMessage('Failed to load user data.', 'error');
      } finally {
        setIsLoading(false); // Set loading to false regardless of success or failure
      }
    },
    [showMessage]
  );

  // Effect to listen for Firebase authentication state changes
  useEffect(() => {
    const unsubscribe = firebaseService.onAuthChange(user => {
      if (user) {
        setUser(user);
        fetchUserData(user.uid); // Fetch data when user is authenticated
      } else {
        router.replace('/login'); // Redirect to login if no user is found
      }
    });
    return () => unsubscribe(); // Cleanup the auth listener on component unmount
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
      // Store information about the session to be deleted in state
      setSessionToDeleteInfo({ dateKey, sessionId });
      setIsConfirmModalOpen(true); // Open the confirmation modal
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
      // Set the updating ID to show a loading spinner on the specific session
      setIsUpdatingId(sessionId);
      try {
        await firebaseService.updateStopwatchSession(
          goalId, // Pass goalId
          currentUser.uid,
          dateKey,
          sessionId,
          { label: newLabel } // Pass only the label update
        );
        await fetchUserData(currentUser.uid); // Re-fetch data to update UI
        showMessage('Session updated!', 'success');
      } catch (error) {
        console.error('Error updating session:', error);
        showMessage('Failed to update session.', 'error');
      } finally {
        setIsUpdatingId(null); // Clear the updating ID
      }
    },
    [currentUser, fetchUserData, showMessage]
  );

  /**
   * Confirms and proceeds with deleting the stored session.
   */
  const confirmDeleteSession = async () => {
    if (!currentUser || !sessionToDeleteInfo || !appState?.activeGoalId) {
      console.error('Attempted to delete session without complete info or active goal.');
      showMessage('Cannot delete session: Missing information.', 'error');
      setIsConfirmModalOpen(false);
      setSessionToDeleteInfo(null);
      return;
    }

    try {
      await firebaseService.deleteStopwatchSession(
        appState.activeGoalId, // Pass activeGoalId
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
  /**
   * Handles changing the active tab and updates the URL search parameters.
   * @param tabId The ID of the tab to activate.
   */
  const handleTabChange = useCallback(
    (tabId: string) => {
      setActiveTabInternal(tabId);
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set('tab', tabId);
      // Replace the current URL without a full page reload or scroll
      router.replace(`?${newSearchParams.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  // Defines the available tabs for the page
  const tabItems: TabItem[] = [
    { id: 'stopwatch', label: 'Stopwatch', icon: GoStopwatch },
    { id: 'log', label: 'Session Log', icon: FiCalendar },
  ];

  /**
   * Renders the component corresponding to the currently active tab.
   */
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
      {/* Toast message display component */}
      <ToastMessage
        message={toastMessage}
        // Dynamically set toast type based on message content (can be improved with explicit type passing)
        type={
          toastMessage?.includes('saved') || toastMessage?.includes('updated') ? 'success' : 'info'
        }
      />

      {/* Navigation bar for tabs */}
      <nav className="flex sticky top-0 z-30 justify-center px-4 border-b backdrop-blur-md bg-black/50 border-white/10">
        <div className="flex space-x-2">
          {tabItems.map(item => {
            const Icon = item.icon; // Get the icon component
            const isActive = activeTab === item.id; // Check if the current tab is active
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-200 border-b-2 focus:outline-none
                        ${isActive ? 'text-white border-blue-500' : 'border-transparent text-white/60 hover:text-white'}`}
                aria-label={item.label} // Accessibility label for the button
              >
                <Icon size={18} />
                <span className="hidden sm:inline">{item.label}</span>{' '}
                {/* Label visible on larger screens */}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main content area */}
      <div className="container flex-grow p-4 mx-auto max-w-4xl">
        <section className="py-8 w-full">
          {isLoading ? (
            <div className="text-center text-white/70">Loading...</div>
          ) : (
            renderActiveComponent()
          )}
        </section>
      </div>

      {/* Confirmation Modal for deleting sessions */}
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

// Wrapper component to use React.Suspense for components using `useSearchParams`
export default function StopwatchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col justify-center items-center min-h-screen text-white bg-black font-poppins">
          Loading Focus Timers...
        </div>
      }
    >
      <StopwatchPageContent />
    </Suspense>
  );
}
