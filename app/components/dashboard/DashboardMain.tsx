// app/components/dashboard/DashboardMain.tsx
'use client';

import { AppState, DailyProgress } from '@/types';
import { format } from 'date-fns';
import { User } from 'firebase/auth';
import Link from 'next/link'; // For linking to dashboard settings
import React, { useMemo } from 'react';
import { MdRocketLaunch } from 'react-icons/md'; // For no-goal message

import CountdownCard from '@/components/dashboard/CountdownCard';
import DailyProgressModal from '@/components/dashboard/DailyProgressModal';
import ProgressCalendar from '@/components/dashboard/ProgressCalendar';
import RoutineTimeline from '@/components/dashboard/RoutineTimeline'; // Import the RoutineTimeline component
import { FiTarget } from 'react-icons/fi';
// NEW: Import useNotificationStore to use showToast and showConfirmation

// No longer importing ToastMessage or ConfirmationModal directly as they are global

// Let's define the props this component expects from its parent (page.tsx)
interface DashboardMainProps {
  currentUser: User | null;
  appState: AppState | null;
  // REMOVED: UPDATED: Renamed prop to showToast from showMessage
  // REMOVED: showToast: (text: string, type: 'success' | 'error' | 'info') => void;
  // REMOVED: NEW: Add showConfirmation prop
  // REMOVED: showConfirmation: (props: {
  // REMOVED:   title: string;
  // REMOVED:   message: string;
  // REMOVED:   action: () => void | Promise<void>;
  // REMOVED:   actionDelayMs?: number;
  // REMOVED: }) => void;
  onAppStateUpdate: (newAppState: AppState) => void;
  // DashboardMain specific props, managed at page level (passed from DashboardPageContent)
  isDailyProgressModalOpen: boolean;
  selectedDate: Date | null;
  handleDayClick: (date: Date) => void;
  handleSaveProgress: (progressData: Partial<DailyProgress>) => Promise<void>;
  setIsDailyProgressModalOpen: (isOpen: boolean) => void; // Added for modal control

  // DashboardSettings specific props, managed at page level (passed from DashboardPageContent)
  // These props were previously used by a child component that no longer exists here.
  // We will keep them for now, but they will likely be removed if not used by any actual elements below.
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
  // REMOVED: showToast, // Destructure showToast from props
  // REMOVED: showConfirmation, // Destructure showConfirmation from props
  // Destructure DashboardMain specific props
  isDailyProgressModalOpen,
  selectedDate,
  handleDayClick,
  handleSaveProgress,
  setIsDailyProgressModalOpen, // Destructure for direct use
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
              href="/dashboard?tab=settings" // Note: This link might need adjustment if settings are moved
              className="inline-flex gap-3 items-center px-8 py-4 font-semibold text-black bg-white rounded-full transition-all duration-200 cursor-pointer group hover:bg-white/90 hover:scale-105"
            >
              <FiTarget size={20} />
              Go to Settings to Set Goal
            </Link>
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
          // REMOVED: showToast prop is no longer needed, ProgressCalendar gets it directly
        />
      </section>

      {/* Daily Progress Modal (only rendered if selectedDate is set and modal is open) */}
      {/* DailyProgressModal's showMessage prop is now handled internally by showToast */}
      {selectedDate && (
        <DailyProgressModal
          isOpen={isDailyProgressModalOpen} // Use isDailyProgressModalOpen from props
          onClose={() => setIsDailyProgressModalOpen(false)} // Use setIsDailyProgressModalOpen from props
          date={selectedDate} // Use selectedDate from props
          initialProgress={initialProgress}
          onSave={handleSaveProgress}
          // REMOVED: The DailyProgressModal now gets its showToast internally, so showMessage prop is removed.
        />
      )}
    </div>
  );
};

export default DashboardMain;
