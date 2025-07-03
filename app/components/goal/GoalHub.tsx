// app/components/goal/GoalHub.tsx
'use client';

import { Timestamp } from 'firebase/firestore';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  FiCheckCircle,
  FiGrid,
  FiPauseCircle,
  FiPlayCircle,
  FiPlus,
  FiSearch,
  FiUpload,
  FiXCircle,
} from 'react-icons/fi';

import FilterDropdown, { FilterOption } from '@/components/common/FilterDropdown';
import { useGoalStore } from '@/store/useGoalStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { Goal, GoalStatus } from '@/types';

import GoalList from '@/components/goal/GoalList';
import GoalModal from '@/components/goal/GoalModal';
import GoalSummaryModal from '@/components/goal/GoalSummaryModal';
import ImportSelectionModal from '@/components/profile/ImportSelectionModal';
import { deserializeGoalsForImport } from '@/services/dataService';
import { serializableGoalsArraySchema } from '@/utils/schemas';

const goalFilterOptions: FilterOption[] = [
  { value: 'all', label: 'All Goals', icon: FiGrid },
  { value: GoalStatus.ACTIVE.toString(), label: 'Active', icon: FiPlayCircle },
  { value: GoalStatus.COMPLETED.toString(), label: 'Completed', icon: FiCheckCircle },
  { value: GoalStatus.PAUSED.toString(), label: 'Paused', icon: FiPauseCircle },
  { value: GoalStatus.CANCELLED.toString(), label: 'Cancelled', icon: FiXCircle },
];

const GoalHub: React.FC = () => {
  const { currentUser, createGoal, updateGoal, importGoals } = useGoalStore();
  const showToast = useNotificationStore(state => state.showToast);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [selectedGoalForModal, setSelectedGoalForModal] = useState<Goal | null>(null);
  const [isGoalModalEditMode, setIsGoalModalEditMode] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [selectedGoalForSummary, setSelectedGoalForSummary] = useState<Goal | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<GoalStatus | 'all'>('all');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [stagedGoalsForImport, setStagedGoalsForImport] = useState<Goal[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleGoalsImported = useCallback((goals: Goal[]) => {
    setStagedGoalsForImport(goals);
    setIsImportModalOpen(true);
  }, []);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !currentUser) {
        showToast('No file selected or user not authenticated.', 'error');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showToast('File is too large (max 5MB).', 'error');
        if (event.target) event.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = async e => {
        try {
          const importedRawData = JSON.parse(e.target?.result as string);
          const validation = serializableGoalsArraySchema.safeParse(importedRawData);
          if (!validation.success) {
            showToast('Import failed. Invalid file format.', 'error');
            return;
          }
          const deserializedGoals = deserializeGoalsForImport(validation.data);
          if (deserializedGoals.length > 0) {
            handleGoalsImported(deserializedGoals);
          } else {
            showToast('No goals found in the selected file.', 'info');
          }
        } catch {
          showToast('Import failed. Please check file format.', 'error');
        } finally {
          if (event.target) event.target.value = '';
        }
      };
      reader.readAsText(file);
    },
    [currentUser, showToast, handleGoalsImported]
  );

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

  return (
    <div className="relative">
      <div className="pb-28 space-y-8">
        <GoalList
          onOpenGoalModal={handleOpenGoalModal}
          onOpenSummaryModal={handleOpenSummaryModal}
          searchQuery={searchQuery}
          filterStatus={filterStatus}
        />
      </div>

      <div className="fixed right-0 bottom-0 left-16 z-20 p-4 border-t backdrop-blur-md bg-bg-primary/50 border-border-primary">
        <div className="flex flex-col gap-4 items-center mx-auto max-w-6xl sm:flex-row">
          <div className="flex flex-shrink-0 gap-2">
            <button
              onClick={() => handleOpenGoalModal(null, false)}
              className="flex gap-2 items-center px-4 py-2 font-semibold rounded-full transition-all duration-200 cursor-pointer text-bg-primary bg-text-primary hover:opacity-90"
            >
              <FiPlus />
              New Goal
            </button>
            <button
              onClick={handleImportClick}
              className="flex gap-2 items-center px-4 py-2 font-semibold rounded-full transition-all duration-200 cursor-pointer text-text-primary bg-bg-tertiary hover:bg-border-primary"
            >
              <FiUpload />
              Import
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelected}
              accept=".json"
              className="hidden"
            />
          </div>
          <div className="flex flex-col gap-4 w-full sm:flex-row sm:w-auto sm:flex-grow">
            <div className="relative flex-grow">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search goals..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="py-3 pr-4 pl-12 w-full rounded-full border text-text-primary border-border-primary bg-bg-secondary focus:outline-none focus:ring-2 focus:ring-border-accent"
              />
            </div>
            <FilterDropdown
              options={goalFilterOptions}
              selectedValue={filterStatus === 'all' ? 'all' : filterStatus.toString()}
              onSelect={value => setFilterStatus(value === 'all' ? 'all' : parseInt(value))}
            />
          </div>
        </div>
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
      <ImportSelectionModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        goalsToImport={stagedGoalsForImport}
        onConfirmImport={importGoals}
      />
    </div>
  );
};

export default GoalHub;
