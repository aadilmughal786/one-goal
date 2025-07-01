// app/(root)/tools/page.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { IconType } from 'react-icons';
import { FaCalculator } from 'react-icons/fa';
import { FiEdit, FiWatch } from 'react-icons/fi';

// Import only the components we are keeping
import ChatCalculator from '@/components/tools/ChatCalculator';
import DrawingTool from '@/components/tools/DrawingTool'; // Import the new DrawingTool
import TimeEstimator from '@/components/tools/TimeEstimator';

// Import the skeleton loader
import PageContentSkeleton from '@/components/common/PageContentSkeleton';

// ======== Main Page Component ========
const tabItems: {
  id: string;
  label: string;
  icon: IconType;
  component: React.FC;
}[] = [
  { id: 'calculator', label: 'Calculator', icon: FaCalculator, component: ChatCalculator },
  { id: 'estimator', label: 'Time Estimator', icon: FiWatch, component: TimeEstimator },
  { id: 'drawing', label: 'Drawing Pad', icon: FiEdit, component: DrawingTool }, // Add the new drawing tool tab
];

const ToolsPageContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<string>(() => {
    const tabFromUrl = searchParams.get('tab');
    return tabItems.find(item => item.id === tabFromUrl)?.id || 'calculator';
  });

  const [isTabContentLoading, setIsTabContentLoading] = useState(false);

  // Effect to show skeleton on tab switch
  useEffect(() => {
    setIsTabContentLoading(true);
    const timer = setTimeout(() => {
      setIsTabContentLoading(false);
    }, 300); // 300ms delay for a smooth transition feel
    return () => clearTimeout(timer);
  }, [activeTab]);

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

  return (
    <main className="flex flex-col min-h-screen text-white bg-black font-poppins">
      <nav className="flex sticky top-0 z-30 justify-center px-4 border-b backdrop-blur-md bg-black/50 border-white/10">
        <div className="flex flex-wrap justify-center space-x-1 sm:space-x-2">
          {tabItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium transition-colors duration-200 border-b-2 focus:outline-none ${
                  isActive
                    ? 'text-white border-blue-500'
                    : 'border-transparent text-white/60 hover:text-white'
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
        <section className="py-8 w-full">
          {isTabContentLoading ? <PageContentSkeleton /> : <ActiveComponent />}
        </section>
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
