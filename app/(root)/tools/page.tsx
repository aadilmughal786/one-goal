// app/(root)/tools/page.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { IconType } from 'react-icons';
import { FaCalculator } from 'react-icons/fa';
import { FiEdit, FiWatch } from 'react-icons/fi';

import ChatCalculator from '@/components/tools/ChatCalculator';
import DrawingTool from '@/components/tools/DrawingTool';
import TimeEstimator from '@/components/tools/TimeEstimator';

import PageContentSkeleton from '@/components/common/PageContentSkeleton';
import { useAuth } from '@/hooks/useAuth';

const tabItems: {
  id: string;
  label: string;
  icon: IconType;
  component: React.FC;
}[] = [
  { id: 'calculator', label: 'Calculator', icon: FaCalculator, component: ChatCalculator },
  { id: 'estimator', label: 'Time Estimator', icon: FiWatch, component: TimeEstimator },
  { id: 'drawing', label: 'Drawing Pad', icon: FiEdit, component: DrawingTool },
];

const ToolsPageContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<string>(tabItems[0].id);
  const [isTabContentLoading, setIsTabContentLoading] = useState(false);

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    const targetTab = tabItems.find(item => item.id === tabFromUrl)?.id || tabItems[0].id;
    setActiveTab(targetTab);
  }, [searchParams]);

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
      setActiveTab(tabId);
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set('tab', tabId);
      router.replace(`?${newSearchParams.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const ActiveComponent = useMemo(
    () => tabItems.find(item => item.id === activeTab)?.component || ChatCalculator,
    [activeTab]
  );

  const renderActiveTabContent = () => {
    if (isLoading || isTabContentLoading) {
      return <PageContentSkeleton />;
    }
    return <ActiveComponent />;
  };

  return (
    <main className="flex flex-col min-h-screen text-text-primary bg-bg-primary font-poppins">
      <nav className="flex sticky top-0 z-30 justify-center px-4 border-b backdrop-blur-md bg-bg-primary/50 border-border-primary">
        <div className="flex flex-wrap justify-center space-x-1 sm:space-x-2">
          {isLoading
            ? [...Array(tabItems.length)].map((_, i) => (
                <div key={i} className="px-3 py-3 animate-pulse sm:px-4">
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
                    className={`flex items-center cursor-pointer gap-2 px-3 sm:px-4 py-3 text-sm font-medium transition-colors duration-200 border-b-2 focus:outline-none ${
                      isActive
                        ? 'text-text-primary border-border-accent'
                        : 'border-transparent text-text-secondary hover:text-text-primary'
                    }`}
                    aria-label={`Switch to ${item.label} tab`}
                  >
                    <Icon size={18} />
                    <span className="hidden sm:inline">{item.label}</span>
                  </button>
                );
              })}
        </div>
      </nav>
      <div className="container flex-grow p-4 mx-auto max-w-5xl">
        <section className="py-8 w-full">{renderActiveTabContent()}</section>
      </div>
    </main>
  );
};

export default function ToolsPage() {
  return (
    <Suspense fallback={<PageContentSkeleton />}>
      <ToolsPageContent />
    </Suspense>
  );
}
