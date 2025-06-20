// app/components/dashboard/DashboardMain.tsx
'use client';

import React, { useMemo } from 'react';
import { User } from 'firebase/auth';
import { AppState, DailyProgress } from '@/types';
import { format } from 'date-fns';
import { MdRocketLaunch } from 'react-icons/md'; // For no-goal message
import Link from 'next/link'; // For linking to dashboard settings

import CountdownCard from '@/components/dashboard/CountdownCard';
import ProgressCalendar from '@/components/dashboard/ProgressCalendar';
import DailyProgressModal from '@/components/dashboard/DailyProgressModal';
import RoutineTimeline from '@/components/dashboard/RoutineTimeline'; // Import the RoutineTimeline component
import { FiDownload, FiEdit, FiPlusCircle, FiTarget, FiUpload } from 'react-icons/fi';

// Import DashboardSettings to be rendered directly here when no goal is set.
// Let's define the props this component expects from its parent (page.tsx)
interface DashboardMainProps {
  currentUser: User | null;
  appState: AppState | null;
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
  onAppStateUpdate: (newAppState: AppState) => void;
  // DashboardMain specific props, managed at page level (passed from DashboardPageContent)
  isDailyProgressModalOpen: boolean;
  selectedDate: Date | null;
  handleDayClick: (date: Date) => void;
  handleSaveProgress: (progressData: Partial<DailyProgress>) => Promise<void>;
  setIsDailyProgressModalOpen: (isOpen: boolean) => void; // Added for modal control

  // DashboardSettings specific props, managed at page level (passed from DashboardPageContent)
  handleOpenGoalModal: (isEditing?: boolean) => void;
  promptForArchiveAndNewGoal: () => void;
  handleExport: () => Promise<void>;
  handleImportChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  transformedGoalForModal: {
    name: string;
    description: string | null;
    startDate: string;
    endDate: string;
  } | null;
  isEditMode: boolean; // Indicates if GoalModal should open in edit mode
}

const DashboardMain: React.FC<DashboardMainProps> = ({
  appState,
  showMessage,
  // Destructure DashboardMain specific props
  isDailyProgressModalOpen,
  selectedDate,
  handleDayClick,
  handleSaveProgress,
  setIsDailyProgressModalOpen, // Destructure for direct use

  // Destructure DashboardSettings specific props
  handleOpenGoalModal,
  promptForArchiveAndNewGoal,
  handleExport,
  handleImportChange,
}) => {
  // `isDailyProgressModalOpen` and `selectedDate` are now passed as props, no longer local state.
  // `handleDayClick` and `handleSaveProgress` are also passed as props.

  // Get the currently active goal from appState
  const activeGoal = useMemo(() => {
    if (!appState?.activeGoalId || !appState.goals) return null;
    return appState.goals[appState.activeGoalId];
  }, [appState]);

  // Memoized initialProgress for DailyProgressModal (relies on props now)
  const initialProgress = useMemo(() => {
    return selectedDate && activeGoal
      ? activeGoal.dailyProgress[format(selectedDate, 'yyyy-MM-dd')] || null
      : null;
  }, [selectedDate, activeGoal]); // Dependencies: selectedDate or activeGoal changes

  // Handle the case where no goal is set yet.
  // This section is now part of DashboardMain to be rendered as the default view.
  if (!activeGoal) {
    return (
      <div className="space-y-12">
        <section>
          <div className="p-10 text-center bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg">
            <MdRocketLaunch className="mx-auto mb-6 w-20 h-20 text-white/70" />
            <h2 className="mb-4 text-3xl font-bold text-white">Start Your Journey</h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-white/70">
              Define your primary objective or import existing data using the management options
              below.
            </p>
            <Link
              href="/dashboard?tab=settings"
              className="inline-flex gap-3 items-center px-8 py-4 font-semibold text-black bg-white rounded-full transition-all duration-200 cursor-pointer group hover:bg-white/90 hover:scale-105"
            >
              <FiTarget size={20} />
              Go to Settings to Set Goal
            </Link>
          </div>
        </section>

        {/* Render settings management actions directly when no goal is set */}
        <section>
          <input
            type="file"
            id="dashboardImportFile" // ID must be unique
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImportChange} // Use handleImportChange from props
          />
          <div className="p-8 text-center bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg">
            <h3 className="mb-2 text-2xl font-bold">Manage Your Goal</h3>
            <p className="mx-auto mb-6 max-w-2xl text-white/60">
              Update your current goal, archive it to start a new one, or manage your data backups.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
              <button
                onClick={() => handleOpenGoalModal(true)} // Use handleOpenGoalModal from props
                disabled={!activeGoal} // Disable if no goal to edit
                className="flex flex-col justify-center items-center p-4 text-white rounded-lg border transition-all cursor-pointer border-blue-400/30 hover:bg-blue-400/10 hover:border-blue-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiEdit size={24} className="mb-2 text-blue-400" />
                <span className="font-semibold">Update Goal</span>
              </button>
              <button
                onClick={promptForArchiveAndNewGoal} // Use promptForArchiveAndNewGoal from props
                className="flex flex-col justify-center items-center p-4 text-white rounded-lg border transition-all cursor-pointer border-green-400/30 hover:bg-green-400/10 hover:border-green-400/50"
              >
                <FiPlusCircle size={24} className="mb-2 text-green-400" />
                <span className="font-semibold">New Goal</span>
              </button>
              <button
                onClick={handleExport} // Use handleExport from props
                disabled={!activeGoal} // Disable if no goal to export
                className="flex flex-col justify-center items-center p-4 text-white rounded-lg border transition-all cursor-pointer border-white/20 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiDownload size={24} className="mb-2 text-purple-400" />
                <span className="font-semibold">Export Data</span>
              </button>
              <label
                htmlFor="dashboardImportFile" // Link to the hidden file input
                className="flex flex-col justify-center items-center p-4 text-white rounded-lg border transition-all cursor-pointer border-white/20 hover:bg-white/10"
              >
                <FiUpload size={24} className="mb-2 text-teal-400" />
                <span className="font-semibold">Import Data</span>
              </label>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Normal view when a goal exists
  return (
    <div className="space-y-12">
      <section>
        <div className="mb-8 text-center">
          <h3 className="mb-2 text-2xl font-bold">Your Mission Control</h3>
          <p className="mx-auto max-w-2xl text-white/60">
            This is your command center. Monitor your progress, track your time, and stay focused on
            the one thing that matters most right now.
          </p>
        </div>
        <CountdownCard goal={activeGoal} />
      </section>

      {/* Routine Timeline Section */}
      <section>
        <RoutineTimeline appState={appState} />
      </section>

      <section>
        <div className="mb-8 text-center">
          <h3 className="mb-2 text-2xl font-bold">Progress Calendar</h3>
          <p className="mx-auto max-w-2xl text-white/60">
            Visualize your daily satisfaction and log today&apos;s progress with a single click.
          </p>
        </div>
        <ProgressCalendar
          goal={activeGoal}
          dailyProgress={activeGoal.dailyProgress}
          onDayClick={handleDayClick} // Use handleDayClick from props
        />
      </section>

      {/* Daily Progress Modal (only rendered if selectedDate is set and modal is open) */}
      {selectedDate && (
        <DailyProgressModal
          isOpen={isDailyProgressModalOpen} // Use isDailyProgressModalOpen from props
          onClose={() => setIsDailyProgressModalOpen(false)} // Use setIsDailyProgressModalOpen from props
          date={selectedDate} // Use selectedDate from props
          initialProgress={initialProgress}
          onSave={handleSaveProgress} // Use handleSaveProgress from props
          showMessage={showMessage}
        />
      )}
    </div>
  );
};

export default DashboardMain;
