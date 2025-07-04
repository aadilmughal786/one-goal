// app/components/routine/GenericRoutineTab.tsx
'use client';

import {
  RoutineType,
  ScheduledRoutineBase,
  SleepRoutineSettings,
  UserRoutineSettings,
} from '@/types';
import { Timestamp } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { IconType } from 'react-icons';

import { useGoalStore } from '@/store/useGoalStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useRoutineStore } from '@/store/useRoutineStore';

import RoutineCalendar from '@/components/routine/RoutineCalendar';
import RoutineSectionCard from '@/components/routine/RoutineSectionCard';

interface GenericRoutineTabProps {
  routineType: RoutineType;
  sectionTitle: string;
  summaryLabel: string;
  listEmptyMessage: string;
  newInputLabelPlaceholder: string;
  iconOptions: string[];
  iconComponentsMap: { [key: string]: React.ElementType };
  calendarIcon: IconType;
  isNapSchedule?: boolean; // Flag to handle the special case for naps
}

const GenericRoutineTab: React.FC<GenericRoutineTabProps> = ({
  routineType,
  sectionTitle,
  summaryLabel,
  listEmptyMessage,
  newInputLabelPlaceholder,
  iconOptions,
  iconComponentsMap,
  calendarIcon,
  isNapSchedule = false,
}) => {
  const { appState } = useGoalStore();
  const { updateRoutineSettings } = useRoutineStore();
  const { showToast } = useNotificationStore();

  const activeGoal = appState?.goals[appState?.activeGoalId || ''];
  const [schedules, setSchedules] = useState<ScheduledRoutineBase[]>([]);

  useEffect(() => {
    if (activeGoal?.routineSettings) {
      let routines: ScheduledRoutineBase[] | undefined;
      if (isNapSchedule) {
        // Special handling for naps nested under the 'sleep' object
        routines = activeGoal.routineSettings.sleep?.naps;
      } else {
        // Standard handling for other routine types
        routines =
          activeGoal.routineSettings[
            routineType as keyof Omit<
              UserRoutineSettings,
              'sleep' | 'water' | 'lastRoutineResetDate'
            >
          ];
      }
      setSchedules(routines || []);
    }
  }, [activeGoal, routineType, isNapSchedule]);

  const handleSaveSchedules = useCallback(
    async (updatedSchedules: ScheduledRoutineBase[], successMessage: string) => {
      if (!activeGoal?.routineSettings) return;

      let newSettings: UserRoutineSettings;

      if (isNapSchedule) {
        const newSleepSettings: SleepRoutineSettings = {
          ...activeGoal.routineSettings.sleep!,
          naps: updatedSchedules,
        };
        newSettings = {
          ...activeGoal.routineSettings,
          sleep: newSleepSettings,
        };
      } else {
        newSettings = {
          ...activeGoal.routineSettings,
          [routineType]: updatedSchedules,
        };
      }

      try {
        await updateRoutineSettings(newSettings);
        showToast(successMessage, 'success');
      } catch (error) {
        console.error(`Failed to save ${routineType} schedule:`, error);
        showToast(`Failed to save ${routineType} schedule.`, 'error');
      }
    },
    [activeGoal, routineType, isNapSchedule, updateRoutineSettings, showToast]
  );

  const toggleCompletion = useCallback(
    async (index: number) => {
      const updatedSchedules = schedules.map((schedule, i) =>
        i === index
          ? {
              ...schedule,
              completed: !schedule.completed,
              updatedAt: Timestamp.now(),
              completedAt: !schedule.completed ? Timestamp.now() : null,
            }
          : schedule
      );
      await handleSaveSchedules(updatedSchedules, `${sectionTitle} schedule updated!`);
    },
    [schedules, handleSaveSchedules, sectionTitle]
  );

  const handleSaveSchedule = useCallback(
    async (schedule: ScheduledRoutineBase, index: number | null) => {
      let updatedSchedules: ScheduledRoutineBase[];
      const message = index !== null ? `${sectionTitle} updated!` : `${sectionTitle} added!`;

      if (index !== null) {
        updatedSchedules = schedules.map((s, i) => (i === index ? schedule : s));
      } else {
        updatedSchedules = [...schedules, schedule];
      }
      await handleSaveSchedules(updatedSchedules, message);
    },
    [schedules, handleSaveSchedules, sectionTitle]
  );

  const handleRemoveSchedule = useCallback(
    async (indexToRemove: number) => {
      const updatedSchedules = schedules.filter((_, index) => index !== indexToRemove);
      await handleSaveSchedules(updatedSchedules, `${sectionTitle} schedule removed.`);
    },
    [schedules, handleSaveSchedules, sectionTitle]
  );

  const completedSchedulesCount = schedules.filter(s => s.completed).length;

  return (
    <div className="space-y-8">
      <RoutineSectionCard
        sectionTitle={sectionTitle}
        summaryCount={`${completedSchedulesCount}/${schedules.length}`}
        summaryLabel={summaryLabel}
        progressPercentage={
          schedules.length > 0 ? (completedSchedulesCount / schedules.length) * 100 : 0
        }
        listTitle={`Your ${sectionTitle} Schedules`}
        listEmptyMessage={listEmptyMessage}
        schedules={schedules}
        onToggleCompletion={toggleCompletion}
        onRemoveSchedule={handleRemoveSchedule}
        onSaveSchedule={handleSaveSchedule}
        newInputLabelPlaceholder={newInputLabelPlaceholder}
        newIconOptions={iconOptions}
        iconComponentsMap={iconComponentsMap}
      />
      <RoutineCalendar
        routineType={routineType}
        title={`${sectionTitle} Log`}
        icon={calendarIcon}
      />
    </div>
  );
};

export default GenericRoutineTab;
