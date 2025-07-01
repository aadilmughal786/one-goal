// app/(root)/profile/page.tsx
'use client';

import AvatarSelectionModal from '@/components/profile/AvatarSelectionModal';
import DataManagementTab from '@/components/profile/DataManagement'; // New component
import ImportSelectionModal from '@/components/profile/ImportSelectionModal';
import UserProfileTab from '@/components/profile/UserProfile'; // New component
import WellnessSettings from '@/components/profile/WellnessSettings';
import { useAuth } from '@/hooks/useAuth';
import { updateUserProfile } from '@/services/authService';
import { useGoalStore } from '@/store/useGoalStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { Goal } from '@/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useState } from 'react';
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

  const [activeTab, setActiveTab] = useState(() => {
    return searchParams.get('tab') || 'profile';
  });

  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [stagedGoalsForImport, setStagedGoalsForImport] = useState<Goal[]>([]);

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

  if (isLoading) {
    return <PageSkeletonLoader />;
  }
  if (!currentUser) return null;

  return (
    <main className="flex flex-col min-h-screen text-white bg-black font-poppins">
      <nav className="flex sticky top-0 z-30 justify-center px-4 border-b backdrop-blur-md bg-black/50 border-white/10">
        <div className="flex space-x-2">
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
        </div>
      </nav>

      <div className="container flex-grow p-4 mx-auto max-w-4xl md:p-8">
        <section className="w-full">
          {activeTab === 'profile' && (
            <UserProfileTab onAvatarModalOpen={() => setIsAvatarModalOpen(true)} />
          )}
          {activeTab === 'data' && <DataManagementTab onGoalsImported={handleGoalsImported} />}
          {activeTab === 'wellness' && <WellnessSettings />}
        </section>
      </div>

      <ImportSelectionModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        goalsToImport={stagedGoalsForImport}
        onConfirmImport={importGoals}
      />

      {isAvatarModalOpen && (
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
