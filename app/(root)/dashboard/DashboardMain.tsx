// app/(root)/dashboard/DashboardMain.tsx
'use client';

import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { AppState, DailyProgress } from '@/types';
import { isToday, format } from 'date-fns';
import { MdRocketLaunch } from 'react-icons/md';
import CountdownCard from '@/components/dashboard/CountdownCard';
import ProgressCalendar from '@/components/dashboard/ProgressCalendar';
import DailyProgressModal from '@/components/dashboard/DailyProgressModal';
import { firebaseService } from '@/services/firebaseService';
import DashboardSettings from './DashboardSettings'; // Import settings component
import RoutineTimeline from './RoutineTimeline'; // Import the new component

interface DashboardMainProps {
  currentUser: User | null;
  appState: AppState | null;
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
  onAppStateUpdate: (newAppState: AppState) => void;
}

const DashboardMain: React.FC<DashboardMainProps> = ({
  currentUser,
  appState,
  showMessage,
  onAppStateUpdate,
}) => {
  const [isDailyProgressModalOpen, setIsDailyProgressModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleDayClick = (date: Date) => {
    if (isToday(date)) {
      setSelectedDate(date);
      setIsDailyProgressModalOpen(true);
    }
  };

  const handleSaveProgress = async (progressData: Partial<DailyProgress>) => {
    if (!currentUser || !appState) return;

    // Ensure the date is included in the progress data
    const completeProgressData = {
      ...appState.dailyProgress[progressData.date!],
      ...progressData,
      date: progressData.date || format(new Date(), 'yyyy-MM-dd'),
    } as DailyProgress;

    await firebaseService.saveDailyProgress(currentUser.uid, completeProgressData);

    const newAppState = {
      ...appState,
      dailyProgress: {
        ...appState.dailyProgress,
        [completeProgressData.date]: completeProgressData,
      },
    };
    onAppStateUpdate(newAppState);
    setIsDailyProgressModalOpen(false);
    showMessage('Progress saved successfully!', 'success');
  };

  const initialProgress =
    selectedDate && appState
      ? appState.dailyProgress[format(selectedDate, 'yyyy-MM-dd')] || null
      : null;

  // Handle the case where no goal is set yet.
  if (!appState?.goal) {
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
          </div>
        </section>

        {/* Render settings so the user can create a new goal */}
        <section>
          <DashboardSettings
            currentUser={currentUser}
            appState={appState}
            showMessage={showMessage}
            onAppStateUpdate={onAppStateUpdate}
          />
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
        <CountdownCard goal={appState.goal} />
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
          goal={appState.goal}
          dailyProgress={appState.dailyProgress}
          onDayClick={handleDayClick}
        />
      </section>

      {/* Add the settings component at the end of the main dashboard view */}
      <section>
        <DashboardSettings
          currentUser={currentUser}
          appState={appState}
          showMessage={showMessage}
          onAppStateUpdate={onAppStateUpdate}
        />
      </section>

      {selectedDate && (
        <DailyProgressModal
          isOpen={isDailyProgressModalOpen}
          onClose={() => setIsDailyProgressModalOpen(false)}
          date={selectedDate}
          initialProgress={initialProgress}
          onSave={handleSaveProgress}
          showMessage={showMessage}
        />
      )}
    </div>
  );
};

export default DashboardMain;
