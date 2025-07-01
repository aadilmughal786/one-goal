// app/(root)/stop-watch/page.tsx
'use client';

import NoActiveGoalMessage from '@/components/common/NoActiveGoalMessage';
import PageContentSkeleton from '@/components/common/PageContentSkeleton';
import SessionLog from '@/components/stop-watch/SessionLog';
import Stopwatch from '@/components/stop-watch/Stopwatch';
import { useAuth } from '@/hooks/useAuth';
import { useGoalStore } from '@/store/useGoalStore';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { IconType } from 'react-icons';
import { FiCalendar } from 'react-icons/fi';
import { GoStopwatch } from 'react-icons/go';

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

  const { isLoading } = useAuth();
  // FIX: Read appState directly here to determine if an active goal exists.
  const appState = useGoalStore(state => state.appState);

  const [isTabContentLoading, setIsTabContentLoading] = useState(false);
  const [activeTab, setActiveTabInternal] = useState<string>(() => {
    const tabFromUrl = searchParams.get('tab');
    return tabItems.find(item => item.id === tabFromUrl)?.id || 'stopwatch';
  });

  useEffect(() => {
    if (!isLoading) {
      setIsTabContentLoading(true);
      const timer = setTimeout(() => {
        setIsTabContentLoading(false);
      }, 300);
      return () => clearTimeout(timer);
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

    if (isLoading || isTabContentLoading) {
      return <PageContentSkeleton />;
    }

    if (!activeGoal) {
      return <NoActiveGoalMessage />;
    }

    switch (activeTab) {
      case 'stopwatch':
        return <Stopwatch />;
      case 'log':
        // FIX: SessionLog is now self-sufficient and doesn't need props.
        return <SessionLog />;
      default:
        return null;
    }
  };

  return (
    <main className="flex flex-col min-h-screen text-white bg-black font-poppins">
      <nav className="flex sticky top-0 z-30 justify-center px-4 border-b backdrop-blur-md bg-black/50 border-white/10">
        <div className="flex space-x-2">
          {isLoading
            ? [...Array(tabItems.length)].map((_, i) => (
                <div key={i} className="px-4 py-3 animate-pulse">
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
                    className={`flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-200 border-b-2 focus:outline-none
                          ${isActive ? 'text-white border-white' : 'border-transparent text-white/60 hover:text-white'}`}
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
