// app/(root)/goal/page.tsx
'use client';

import { User } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'; // Ensure useState is imported
import { FiSearch } from 'react-icons/fi';

import GoalSummaryModal from '@/components/archive/GoalSummaryModal';
import GoalModal from '@/components/goal/GoalModal';
import { AppState, Goal, GoalStatus } from '@/types';

// --- REFLECTING THE REFACTOR ---
// We now import specific functions from our new, focused service modules.
import { onAuthChange } from '@/services/authService';
import { createGoal, getUserData, updateGoal } from '@/services/goalService';
// NEW: Import useNotificationStore to use showToast and showConfirmation
import { useNotificationStore } from '@/store/useNotificationStore';

// Components for this page
import CreateGoalCard from '@/components/goal/CreateGoalCard';
import GoalList from '@/components/goal/GoalList';

// Page-level Skeleton Loader
const GoalPageSkeletonLoader = () => (
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

/**
 * GoalPageContent Component
 * This is the main component for the /goal route, now refactored to use the new service layer.
 */
const GoalPageContent = () => {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appState, setAppState] = useState<AppState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // NEW: Access showToast and showConfirmation from the global notification store
  const showToast = useNotificationStore(state => state.showToast);

  // States for GoalModal (create/edit goal)
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [selectedGoalForModal, setSelectedGoalForModal] = useState<Goal | null>(null);
  const [isGoalModalEditMode, setIsGoalModalEditMode] = useState(false);

  // States for GoalSummaryModal
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [selectedGoalForSummary, setSelectedGoalForSummary] = useState<Goal | null>(null);

  // State for search query - THIS IS WHERE 'searchQuery' IS DECLARED
  const [searchQuery, setSearchQuery] = useState('');
  // State for filter status
  const [filterStatus, setFilterStatus] = useState<GoalStatus | 'all'>('all');

  // Renamed from showMessage to displayMessage for clarity, and now uses global showToast
  const displayMessage = useCallback(
    (text: string, type: 'success' | 'error' | 'info') => {
      showToast(text, type);
    },
    [showToast] // Dependency on the global showToast
  );

  // --- Authentication and Initial Data Fetching ---
  useEffect(() => {
    const unsubscribe = onAuthChange(user => {
      if (user) {
        setCurrentUser(user);
        getUserData(user.uid)
          .then(data => {
            setAppState(data);
            setIsLoading(false);
          })
          .catch(error => {
            console.error('Error fetching user data:', error);
            displayMessage('Failed to load goals.', 'error');
            setIsLoading(false);
          });
      } else {
        router.replace('/login');
      }
    });
    return () => unsubscribe();
  }, [router, displayMessage]);

  // --- Goal Modal Handlers (Create/Edit) ---
  const handleOpenGoalModal = useCallback((goal: Goal | null, isEditMode: boolean) => {
    setSelectedGoalForModal(goal);
    setIsGoalModalEditMode(isEditMode);
    setIsGoalModalOpen(true);
  }, []);

  const handleSetGoal = useCallback(
    async (name: string, endDate: Date, description: string) => {
      if (!currentUser || !appState) return;
      try {
        if (isGoalModalEditMode && selectedGoalForModal) {
          await updateGoal(currentUser.uid, selectedGoalForModal.id, {
            name,
            description,
            endDate: Timestamp.fromDate(endDate),
          });
          displayMessage('Goal updated successfully!', 'success');
        } else {
          const newGoalData = {
            name,
            description,
            startDate: Timestamp.now(),
            endDate: Timestamp.fromDate(endDate),
            status: GoalStatus.ACTIVE,
          };
          await createGoal(currentUser.uid, newGoalData);
          displayMessage('Goal created successfully!', 'success');
        }
        const newAppState = await getUserData(currentUser.uid);
        setAppState(newAppState);
        setIsGoalModalOpen(false);
      } catch {
        displayMessage('Failed to save goal.', 'error');
      }
    },
    [currentUser, appState, isGoalModalEditMode, selectedGoalForModal, displayMessage]
  );

  // --- Goal Summary Modal Handlers ---
  const handleOpenSummaryModal = useCallback((goal: Goal) => {
    setSelectedGoalForSummary(goal);
    setIsSummaryModalOpen(true);
  }, []);

  const transformedGoalForModal = useMemo(() => {
    return selectedGoalForModal
      ? {
          name: selectedGoalForModal.name,
          description: selectedGoalForModal.description,
          startDate: selectedGoalForModal.startDate.toDate().toISOString(),
          endDate: selectedGoalForModal.endDate.toDate().toISOString(),
        }
      : null;
  }, [selectedGoalForModal]);

  const getStatusText = useCallback((status: GoalStatus | 'all') => {
    switch (status) {
      case 'all':
        return 'All';
      case GoalStatus.ACTIVE:
        return 'Active';
      case GoalStatus.COMPLETED:
        return 'Completed';
      case GoalStatus.PAUSED:
        return 'Paused';
      case GoalStatus.CANCELLED:
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  }, []);

  if (isLoading) {
    return (
      <main className="px-6 py-8 mx-auto max-w-4xl sm:px-8 lg:px-12">
        <GoalPageSkeletonLoader />
      </main>
    );
  }

  if (!currentUser) return null;

  return (
    <main className="flex flex-col min-h-screen text-white bg-black font-poppins">
      {/* ToastMessage and ConfirmationModal are now handled globally in RootLayout */}
      <nav className="flex flex-col px-4 pt-3 border-b backdrop-blur-md bg-black/50 border-white/10">
        <div className="mb-4 text-center">
          <h2 className="mb-1 text-2xl font-bold text-white">Your Goal Hub</h2>
          <p className="text-sm text-white/70">
            Manage all your past, present, and future goals in one place.
          </p>
        </div>
        <div className="relative mx-auto mb-3 w-full max-w-xl">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={20} />
          <input
            type="text"
            placeholder="Search goals by name or description..."
            value={searchQuery} // Usage of searchQuery
            onChange={e => setSearchQuery(e.target.value)}
            className="p-3 pl-10 w-full h-12 text-lg text-white rounded-md border border-white/10 bg-black/20 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-wrap gap-2 justify-center w-full">
          {(
            [
              'all',
              GoalStatus.ACTIVE,
              GoalStatus.COMPLETED,
              GoalStatus.PAUSED,
              GoalStatus.CANCELLED,
            ] as const
          ).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-3 text-sm font-medium transition-colors duration-200 border-b-2 focus:outline-none ${filterStatus === status ? 'text-white border-blue-500 bg-transparent' : 'border-transparent text-white/60 hover:bg-white/10 hover:border-white/5'}`}
            >
              {getStatusText(status)}
            </button>
          ))}
        </div>
      </nav>
      <div className="container p-4 mx-auto max-w-5xl md:p-8">
        <section className="py-8 space-y-8">
          <GoalList
            currentUser={currentUser}
            appState={appState}
            onAppStateUpdate={setAppState}
            onOpenGoalModal={handleOpenGoalModal}
            onOpenSummaryModal={handleOpenSummaryModal}
            searchQuery={searchQuery} // Usage of searchQuery
            filterStatus={filterStatus}
          />
          <CreateGoalCard
            currentUser={currentUser}
            appState={appState}
            onAppStateUpdate={setAppState}
            onOpenGoalModal={handleOpenGoalModal}
          />
        </section>
      </div>
      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSetGoal={handleSetGoal}
        initialGoalData={transformedGoalForModal}
        isEditMode={isGoalModalEditMode}
      />
      <GoalSummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        goal={selectedGoalForSummary}
      />
    </main>
  );
};

export default function GoalPage() {
  return (
    <Suspense fallback={<GoalPageSkeletonLoader />}>
      <GoalPageContent />
    </Suspense>
  );
}
