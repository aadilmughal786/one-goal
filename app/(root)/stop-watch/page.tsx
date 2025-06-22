// app/(root)/stop-watch/page.tsx
'use client';

import SessionLog from '@/components/stop-watch/SessionLog';
import Stopwatch from '@/components/stop-watch/Stopwatch';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { IconType } from 'react-icons';
import { FiCalendar } from 'react-icons/fi';
import { GoStopwatch } from 'react-icons/go';

import NoActiveGoalMessage from '@/components/common/NoActiveGoalMessage';
import { onAuthChange } from '@/services/authService';
import { useGoalStore } from '@/store/useGoalStore';
import { useNotificationStore } from '@/store/useNotificationStore';

interface TabItem {
  id: string;
  label: string;
  icon: IconType;
}

const tabItems: TabItem[] = [
  { id: 'stopwatch', label: 'Stopwatch', icon: GoStopwatch },
  { id: 'log', label: 'Session Log', icon: FiCalendar },
];

// Page-level Skeleton Loader for main content area
const PageMainContentSkeletonLoader = () => (
  <div className="space-y-8 animate-pulse">
    <div className="p-8 bg-white/[0.02] border border-white/10 rounded-2xl shadow-lg">
      <div className="mb-2 w-1/3 h-8 rounded-lg bg-white/10"></div>
      <div className="mb-6 w-full h-4 rounded-lg bg-white/10"></div>
      <div className="space-y-3">
        <div className="w-full h-12 rounded-lg bg-white/5"></div>
        <div className="w-full h-12 rounded-lg bg-white/5"></div>
        <div className="w-full h-12 rounded-lg bg-white/5"></div>
      </div>
    </div>
  </div>
);

const StopwatchPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // isLoading for the initial page load (auth + initial data fetch)
  const [isLoading, setIsLoading] = useState(true);
  // isTabContentLoading for when switching between internal tabs.
  const [isTabContentLoading, setIsTabContentLoading] = useState(false);

  const currentUser = useGoalStore(state => state.currentUser);
  const appState = useGoalStore(state => state.appState);
  const fetchInitialData = useGoalStore(state => state.fetchInitialData);
  const showToast = useNotificationStore(state => state.showToast);

  const [activeTab, setActiveTabInternal] = useState<string>(() => {
    const tabFromUrl = searchParams.get('tab');
    return tabFromUrl || 'stopwatch';
  });

  // Effect for initial page load and authentication
  useEffect(() => {
    const unsubscribe = onAuthChange(async user => {
      if (user) {
        await fetchInitialData(user);
      } else {
        setIsLoading(false);
        router.replace('/login');
      }
    });

    const initialLoadTimeout = setTimeout(() => {
      if (isLoading && currentUser === undefined && appState === undefined) {
        setIsLoading(false);
      }
    }, 2000);

    return () => {
      unsubscribe();
      clearTimeout(initialLoadTimeout);
    };
  }, [router, fetchInitialData, showToast, currentUser, isLoading, appState]);

  // Effect to manage the main 'isLoading' state based on currentUser and appState being loaded from the store
  useEffect(() => {
    if (currentUser !== undefined && appState !== undefined) {
      setIsLoading(false);
    }
  }, [currentUser, appState]);

  // Effect to manage 'isTabContentLoading' when the activeTab changes
  useEffect(() => {
    // Only trigger this effect if the main page has finished its initial loading
    if (!isLoading) {
      setIsTabContentLoading(true); // Immediately set loading to true for the new tab content
      const timer = setTimeout(() => {
        setIsTabContentLoading(false); // Reset loading state after a short delay
      }, 300); // Simulate a brief loading period (adjust as needed)

      return () => clearTimeout(timer); // Cleanup timer on unmount or tab change
    }
  }, [activeTab, isLoading]);

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
    const activeGoal = appState?.activeGoalId ? appState.goals[appState.activeGoalId] : null;

    // Show initial full page loader (for the entire page content)
    if (isLoading) {
      return <PageMainContentSkeletonLoader />;
    }

    // Show tab content loader ONLY when switching tabs (after initial page load)
    // The tabs themselves remain stable.
    if (isTabContentLoading) {
      return <PageMainContentSkeletonLoader />;
    }

    // If no active goal and not loading, show the No Active Goal message
    if (!activeGoal) {
      return <NoActiveGoalMessage />;
    }

    // Render the actual tab content
    switch (activeTab) {
      case 'stopwatch':
        return <Stopwatch />;
      case 'log':
        return <SessionLog appState={appState} isUpdatingId={null} />;
      default:
        return null;
    }
  };

  return (
    <main className="flex flex-col min-h-screen text-white bg-black font-poppins">
      <nav className="flex sticky top-0 z-30 justify-center px-4 border-b backdrop-blur-md bg-black/50 border-white/10">
        <div className="flex space-x-2">
          {/* MODIFIED: Tab buttons now only show skeleton during initial page load (isLoading) */}
          {/* They remain stable and interactive when only isTabContentLoading (content area) is true. */}
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
                    <span>{item.label}</span>
                  </button>
                );
              })}
        </div>
      </nav>

      <div className="container flex-grow p-4 mx-auto max-w-4xl">
        <section className="py-8 w-full">{renderActiveComponent()}</section>
      </div>
    </main>
  );
};

export default function StopwatchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-screen text-white/70">
          <div className="animate-pulse">Loading Focus Timers...</div>
        </div>
      }
    >
      <StopwatchPageContent />
    </Suspense>
  );
}
