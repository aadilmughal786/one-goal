// app/(root)/dashboard/page.tsx
'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { User } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { IconType } from 'react-icons';
import { FiGrid, FiBarChart2, FiSettings, FiFeather } from 'react-icons/fi'; // <-- Import an icon
import { AppState } from '@/types';
import { firebaseService } from '@/services/firebaseService';
import ToastMessage from '@/components/ToastMessage';
import DashboardMain from './DashboardMain';
import DashboardAnalytics from './DashboardAnalytics';
import DashboardSettings from './DashboardSettings';
import DashboardQuotes from './DashboardQuotes'; // <-- Import the new component

interface SidebarItem {
  id: string;
  label: string;
  icon: IconType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>;
}

const sidebarItems: SidebarItem[] = [
  { id: 'main', label: 'Dashboard', icon: FiGrid, component: DashboardMain },
  { id: 'analytics', label: 'Analytics', icon: FiBarChart2, component: DashboardAnalytics },
  { id: 'quotes', label: 'Quotes', icon: FiFeather, component: DashboardQuotes }, // <-- ADDED THIS LINE
  { id: 'settings', label: 'Manage', icon: FiSettings, component: DashboardSettings },
];

const DashboardPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appState, setAppState] = useState<AppState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTabInternal] = useState<string>(() => {
    const tabFromUrl = searchParams.get('tab');
    return sidebarItems.find(item => item.id === tabFromUrl)?.id || sidebarItems[0].id;
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

  const handleAppStateUpdate = (newAppState: AppState) => {
    setAppState(newAppState);
  };

  const handleTabChange = useCallback(
    (tabId: string) => {
      setActiveTabInternal(tabId);
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set('tab', tabId);
      router.replace(`?${newSearchParams.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && activeTab !== tabFromUrl) {
      if (sidebarItems.some(item => item.id === tabFromUrl)) {
        setActiveTabInternal(tabFromUrl);
      }
    }
  }, [searchParams, activeTab]);

  const ActiveComponent = sidebarItems.find(item => item.id === activeTab)?.component;

  return (
    <div className="flex min-h-screen text-white bg-black border-b border-white/10 font-poppins">
      <ToastMessage message={toastMessage} type={toastType} />
      <nav className="sticky top-0 flex-col flex-shrink-0 items-center py-4 w-20 h-screen border-r backdrop-blur-md sm:w-24 bg-black/50 border-white/10">
        <div className="overflow-y-auto flex-grow px-2 pb-4 space-y-4 w-full">
          {isLoading
            ? [...Array(sidebarItems.length)].map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col justify-center items-center px-1 py-3 w-full h-20 rounded-lg animate-pulse bg-white/10"
                >
                  <div className="mb-1 w-8 h-8 rounded-full bg-white/10"></div>
                  <div className="w-12 h-3 rounded-md bg-white/10"></div>
                </div>
              ))
            : sidebarItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`flex flex-col items-center justify-center w-full py-3 px-1 rounded-md transition-all duration-200 focus:outline-none cursor-pointer
                    ${isActive ? 'text-white shadow-md bg-blue-500/70' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
                    aria-label={item.label}
                    title={item.label}
                  >
                    <Icon size={24} className="sm:text-2xl lg:text-3xl" />
                    <span className="hidden mt-1 text-xs font-medium sm:block">{item.label}</span>
                  </button>
                );
              })}
        </div>
      </nav>
      <main className="flex-grow p-4 mx-auto max-w-4xl md:p-8">
        {isLoading ? (
          <div className="w-full  h-full rounded-2xl animate-pulse bg-white/[0.02]"></div>
        ) : (
          ActiveComponent && (
            <ActiveComponent
              currentUser={currentUser}
              appState={appState}
              showMessage={showMessage}
              onAppStateUpdate={handleAppStateUpdate}
            />
          )
        )}
      </main>
    </div>
  );
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardPageContent />
    </Suspense>
  );
}
