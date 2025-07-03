// app/(root)/goal/page.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { FiGrid, FiPaperclip } from 'react-icons/fi';

import PageContentSkeleton from '@/components/common/PageContentSkeleton';
import GoalHub from '@/components/goal/GoalHub';
import ResourcesTab from '@/components/goal/ResourcesTab';
import { useAuth } from '@/hooks/useAuth';

const tabItems = [
  { id: 'hub', label: 'Goal Hub', icon: FiGrid, component: GoalHub },
  { id: 'resources', label: 'Resources', icon: FiPaperclip, component: ResourcesTab },
];

const PageSkeletonLoader = () => (
  <div className="flex justify-center items-center h-screen text-text-secondary">
    <div className="animate-pulse">Loading Goal Hub...</div>
  </div>
);

const GoalPageContent = () => {
  const { isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState(tabItems[0].id);
  const [isTabContentLoading, setIsTabContentLoading] = useState(false);

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    const targetTab = tabItems.find(item => item.id === tabFromUrl)?.id || tabItems[0].id;
    setActiveTab(targetTab);
  }, [searchParams]);

  useEffect(() => {
    if (!isLoading) {
      setIsTabContentLoading(true);
      const timer = setTimeout(() => setIsTabContentLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [activeTab, isLoading]);

  const handleTabChange = useCallback(
    (tabId: string) => {
      setActiveTab(tabId);
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set('tab', tabId);
      router.replace(`?${newSearchParams.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const ActiveComponent = tabItems.find(item => item.id === activeTab)?.component || GoalHub;

  return (
    <main className="flex flex-col min-h-screen text-text-primary bg-bg-primary font-poppins">
      <nav className="flex sticky top-0 z-30 justify-center px-4 border-b backdrop-blur-md bg-bg-primary/50 border-border-primary">
        <div className="flex space-x-2">
          {isLoading
            ? [...Array(tabItems.length)].map((_, i) => (
                <div key={i} className="px-4 py-3 animate-pulse">
                  <div className="w-24 h-6 rounded-md bg-bg-tertiary"></div>
                </div>
              ))
            : tabItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-200 border-b-2 focus:outline-none ${
                      isActive
                        ? 'text-text-primary border-border-accent'
                        : 'border-transparent text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
        </div>
      </nav>
      <div className="container flex-grow p-4 mx-auto max-w-6xl md:p-8">
        <section className="w-full">
          {isLoading || isTabContentLoading ? <PageContentSkeleton /> : <ActiveComponent />}
        </section>
      </div>
    </main>
  );
};

export default function GoalPage() {
  return (
    <Suspense fallback={<PageSkeletonLoader />}>
      <GoalPageContent />
    </Suspense>
  );
}
