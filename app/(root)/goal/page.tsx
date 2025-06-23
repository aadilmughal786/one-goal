// app/(root)/goal/page.tsx
'use client';

import { Timestamp } from 'firebase/firestore';
import { Suspense, useCallback, useMemo, useState } from 'react';
import { FiSearch } from 'react-icons/fi';

import { useAuth } from '@/hooks/useAuth';
import { useGoalStore } from '@/store/useGoalStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { Goal, GoalStatus } from '@/types';

import GoalSummaryModal from '@/components/archive/GoalSummaryModal';
import CreateGoalCard from '@/components/goal/CreateGoalCard';
import GoalList from '@/components/goal/GoalList';
import GoalModal from '@/components/goal/GoalModal';

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

const GoalPageContent = () => {
  const { isLoading } = useAuth();

  // FIX: Select actions individually to prevent infinite loops.
  const createGoal = useGoalStore(state => state.createGoal);
  const updateGoal = useGoalStore(state => state.updateGoal);
  const showToast = useNotificationStore(state => state.showToast);

  // Local UI State
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [selectedGoalForModal, setSelectedGoalForModal] = useState<Goal | null>(null);
  const [isGoalModalEditMode, setIsGoalModalEditMode] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [selectedGoalForSummary, setSelectedGoalForSummary] = useState<Goal | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<GoalStatus | 'all'>('all');

  const handleOpenGoalModal = useCallback((goal: Goal | null, isEditMode: boolean) => {
    setSelectedGoalForModal(goal);
    setIsGoalModalEditMode(isEditMode);
    setIsGoalModalOpen(true);
  }, []);

  const handleSetGoal = useCallback(
    async (name: string, endDate: Date, description: string) => {
      try {
        if (isGoalModalEditMode && selectedGoalForModal) {
          const updates = { name, description, endDate: Timestamp.fromDate(endDate) };
          await updateGoal(selectedGoalForModal.id, updates);
          showToast('Goal updated successfully!', 'success');
        } else {
          await createGoal(name, endDate, description);
          showToast('Goal created successfully!', 'success');
        }
        setIsGoalModalOpen(false);
      } catch {
        showToast('Failed to save goal.', 'error');
      }
    },
    [isGoalModalEditMode, selectedGoalForModal, createGoal, updateGoal, showToast]
  );

  const handleOpenSummaryModal = useCallback((goal: Goal) => {
    setSelectedGoalForSummary(goal);
    setIsSummaryModalOpen(true);
  }, []);

  const transformedGoalForModal = useMemo(() => {
    return selectedGoalForModal
      ? {
          name: selectedGoalForModal.name,
          description: selectedGoalForModal.description ?? '',
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

  return (
    <main className="flex flex-col min-h-screen text-white bg-black font-poppins">
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
            value={searchQuery}
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
            onOpenGoalModal={handleOpenGoalModal}
            onOpenSummaryModal={handleOpenSummaryModal}
            searchQuery={searchQuery}
            filterStatus={filterStatus}
          />
          <CreateGoalCard onOpenGoalModal={handleOpenGoalModal} />
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
