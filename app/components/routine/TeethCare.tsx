// app/components/routine/TeethCare.tsx
'use client';

import { RoutineType, ScheduledRoutineBase } from '@/types';
import { Timestamp } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { FaTeeth, FaTooth } from 'react-icons/fa6';
import {
  MdOutlineCleaningServices,
  MdOutlineHealthAndSafety,
  MdOutlineSentimentSatisfied,
} from 'react-icons/md';

import { useGoalStore } from '@/store/useGoalStore';
import { useNotificationStore } from '@/store/useNotificationStore';

import RoutineCalendar from '@/components/routine/RoutineCalendar';
import RoutineSectionCard from '@/components/routine/RoutineSectionCard';

const IconComponents: { [key: string]: React.ElementType } = {
  MdOutlineSentimentSatisfied,
  MdOutlineCleaningServices,
  MdOutlineHealthAndSafety,
  FaTeeth,
  FaTooth,
};

const teethIcons: string[] = Object.keys(IconComponents);

const TeethCare: React.FC = () => {
  const appState = useGoalStore(state => state.appState);
  const updateRoutineSettings = useGoalStore(state => state.updateRoutineSettings);
  const showToast = useNotificationStore(state => state.showToast);

  const activeGoal = appState?.goals[appState?.activeGoalId || ''];

  const [schedules, setSchedules] = useState<ScheduledRoutineBase[]>([]);

  useEffect(() => {
    setSchedules(activeGoal?.routineSettings?.teeth || []);
  }, [activeGoal]);

  const toggleTeethCompletion = useCallback(
    async (index: number) => {
      if (!activeGoal) return;
      const updatedSchedules = schedules.map((session, i) =>
        i === index
          ? {
              ...session,
              completed: !session.completed,
              updatedAt: Timestamp.now(),
              completedAt: !session.completed ? Timestamp.now() : null,
            }
          : session
      );
      const newSettings = { ...activeGoal.routineSettings, teeth: updatedSchedules };
      try {
        await updateRoutineSettings(newSettings);
        showToast('Dental care schedule updated!', 'success');
      } catch (error) {
        console.error('Failed to save dental care settings:', error);
      }
    },
    [schedules, activeGoal, updateRoutineSettings, showToast]
  );

  const handleSaveSchedule = useCallback(
    async (schedule: ScheduledRoutineBase, index: number | null) => {
      if (!activeGoal) return;
      let updatedSchedules: ScheduledRoutineBase[];
      const messageType = index !== null ? 'updated' : 'added';

      if (index !== null) {
        updatedSchedules = schedules.map((s, i) => (i === index ? schedule : s));
      } else {
        updatedSchedules = [...schedules, schedule];
      }
      const newSettings = { ...activeGoal.routineSettings, teeth: updatedSchedules };
      try {
        await updateRoutineSettings(newSettings);
        showToast(messageType === 'updated' ? 'Schedule updated!' : 'Schedule added!', 'success');
      } catch (error) {
        console.error('Failed to save schedule:', error);
      }
    },
    [schedules, activeGoal, updateRoutineSettings, showToast]
  );

  const handleRemoveSchedule = useCallback(
    async (indexToRemove: number) => {
      if (!activeGoal) return;
      const updatedSchedules = schedules.filter((_, index) => index !== indexToRemove);
      const newSettings = { ...activeGoal.routineSettings, teeth: updatedSchedules };
      try {
        await updateRoutineSettings(newSettings);
        showToast('Schedule removed.', 'info');
      } catch (error) {
        console.error('Failed to remove schedule:', error);
      }
    },
    [schedules, activeGoal, updateRoutineSettings, showToast]
  );

  const completedSchedulesCount = schedules.filter(s => s.completed).length;

  return (
    <div className="space-y-8">
      <RoutineSectionCard
        sectionTitle="Dental Care Routine"
        summaryCount={`${completedSchedulesCount}/${schedules.length}`}
        summaryLabel="Sessions Completed Today"
        progressPercentage={
          schedules.length > 0 ? (completedSchedulesCount / schedules.length) * 100 : 0
        }
        listTitle="Your Dental Care Sessions"
        listEmptyMessage="No sessions scheduled. Add one below!"
        schedules={schedules}
        onToggleCompletion={toggleTeethCompletion}
        onRemoveSchedule={handleRemoveSchedule}
        onSaveSchedule={handleSaveSchedule}
        newInputLabelPlaceholder="e.g., Morning Brush"
        newIconOptions={teethIcons}
        iconComponentsMap={IconComponents}
      />

      <RoutineCalendar
        routineType={RoutineType.TEETH}
        title="Dental Care Log"
        icon={MdOutlineCleaningServices}
      />
    </div>
  );
};

export default TeethCare;
