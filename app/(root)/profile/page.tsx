// app/(root)/profile/page.tsx
'use client';

import PageContentSkeleton from '@/components/common/PageContentSkeleton';
import AvatarSelectionModal from '@/components/profile/AvatarSelectionModal';
import DataManagementTab from '@/components/profile/DataManagement';
import ImportSelectionModal from '@/components/profile/ImportSelectionModal';
import UserProfileTab from '@/components/profile/UserProfile';
import WellnessSettings from '@/components/profile/WellnessSettings';
import { useAuth } from '@/hooks/useAuth';
import { updateUserProfile } from '@/services/authService';
import { useGoalStore } from '@/store/useGoalStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { Goal } from '@/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { FiDatabase, FiHeart, FiUser } from 'react-icons/fi';

const PageSkeletonLoader = () => (
  <div className="flex justify-center items-center h-screen text-white/70">
    <div className="animate-pulse">Loading Profile...</div>
  </div>
);

const ProfilePageContent = () => {
  const { isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentUser = useGoalStore(state => state.currentUser);
  const importGoals = useGoalStore(state => state.importGoals);
  const showToast = useNotificationStore(state => state.showToast);

  const [activeTab, setActiveTab] = useState('profile');
  const [isTabContentLoading, setIsTabContentLoading] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [stagedGoalsForImport, setStagedGoalsForImport] = useState<Goal[]>([]);

  useEffect(() => {
    const validTabs = ['profile', 'data', 'wellness'];
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && validTabs.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    } else {
      setActiveTab('profile');
    }
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

  const handleGoalsImported = useCallback((goals: Goal[]) => {
    setStagedGoalsForImport(goals);
    setIsImportModalOpen(true);
  }, []);

  const handleAvatarSelect = async (avatarUrl: string) => {
    if (!currentUser) return;
    try {
      await updateUserProfile({ photoURL: avatarUrl });
      showToast('Avatar updated! Refreshing to see changes...', 'success');
      setIsAvatarModalOpen(false);
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      showToast('Failed to update avatar. Please try again.', 'error');
    }
  };

  const renderActiveTabContent = () => {
    if (isLoading || isTabContentLoading) {
      return <PageContentSkeleton />;
    }

    if (!currentUser) {
      return null;
    }

    switch (activeTab) {
      case 'profile':
        return <UserProfileTab onAvatarModalOpen={() => setIsAvatarModalOpen(true)} />;
      case 'data':
        return <DataManagementTab onGoalsImported={handleGoalsImported} />;
      case 'wellness':
        return <WellnessSettings />;
      default:
        return <UserProfileTab onAvatarModalOpen={() => setIsAvatarModalOpen(true)} />;
    }
  };

  return (
    <main className="flex flex-col min-h-screen text-white bg-black font-poppins">
      <nav className="flex sticky top-0 z-30 justify-center px-4 border-b backdrop-blur-md bg-black/50 border-white/10">
        <div className="flex space-x-2">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="px-4 py-3 animate-pulse">
                <div className="w-24 h-6 rounded-md bg-white/10"></div>
              </div>
            ))
          ) : (
            <>
              <button
                onClick={() => handleTabChange('profile')}
                className={`flex items-center cursor-pointer gap-2 px-4 py-3 text-sm font-medium transition-colors duration-200 border-b-2 focus:outline-none ${
                  activeTab === 'profile'
                    ? 'text-white border-white'
                    : 'border-transparent text-white/60 hover:text-white'
                }`}
              >
                <FiUser /> Profile
              </button>
              <button
                onClick={() => handleTabChange('data')}
                className={`flex items-center cursor-pointer gap-2 px-4 py-3 text-sm font-medium transition-colors duration-200 border-b-2 focus:outline-none ${
                  activeTab === 'data'
                    ? 'text-white border-white'
                    : 'border-transparent text-white/60 hover:text-white'
                }`}
              >
                <FiDatabase /> Data Management
              </button>
              <button
                onClick={() => handleTabChange('wellness')}
                className={`flex items-center cursor-pointer gap-2 px-4 py-3 text-sm font-medium transition-colors duration-200 border-b-2 focus:outline-none ${
                  activeTab === 'wellness'
                    ? 'text-white border-white'
                    : 'border-transparent text-white/60 hover:text-white'
                }`}
              >
                <FiHeart /> Wellness
              </button>
            </>
          )}
        </div>
      </nav>

      <div className="container flex-grow p-4 mx-auto max-w-4xl md:p-8">
        <section className="w-full">{renderActiveTabContent()}</section>
      </div>

      <ImportSelectionModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        goalsToImport={stagedGoalsForImport}
        onConfirmImport={importGoals}
      />

      {isAvatarModalOpen && currentUser && (
        <AvatarSelectionModal
          isOpen={isAvatarModalOpen}
          onClose={() => setIsAvatarModalOpen(false)}
          onAvatarSelect={handleAvatarSelect}
          currentUser={currentUser}
          showToast={showToast}
        />
      )}
    </main>
  );
};

export default function ProfilePage() {
  return (
    <Suspense fallback={<PageSkeletonLoader />}>
      <ProfilePageContent />
    </Suspense>
  );
}
