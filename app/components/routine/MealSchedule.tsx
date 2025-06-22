// app/components/routine/MealSchedule.tsx
'use client';

import { AppState, RoutineType, ScheduledRoutineBase } from '@/types';
import { User } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import {
  MdOutlineCake,
  MdOutlineCookie,
  MdOutlineFastfood,
  MdOutlineIcecream,
  MdOutlineKebabDining,
  MdOutlineLiquor,
  MdOutlineLocalBar,
  MdOutlineLocalCafe,
  MdOutlineLocalDining,
  MdOutlineLocalPizza,
  MdOutlineRamenDining,
  MdOutlineRestaurantMenu,
  MdOutlineSetMeal,
} from 'react-icons/md';

// --- REFLECTING THE REFACTOR ---
// We now import specific functions from our new, focused service modules.
import { getUserData } from '@/services/goalService';
import { updateRoutineSettings } from '@/services/routineService';
// NEW: Import useNotificationStore to use showToast
import { useNotificationStore } from '@/store/useNotificationStore';

// Import the reusable components
import RoutineCalendar from '@/components/routine/RoutineCalendar';
import RoutineSectionCard from '@/components/routine/RoutineSectionCard';

interface MealScheduleProps {
  currentUser: User | null;
  appState: AppState | null;
  // REMOVED: showMessage is now handled internally via useNotificationStore, so it's removed from props
  onAppStateUpdate: (newAppState: AppState) => void;
}

// Map of icon names (strings) to their actual React component imports
const IconComponents: { [key: string]: React.ElementType } = {
  MdOutlineLocalCafe,
  MdOutlineFastfood,
  MdOutlineLocalPizza,
  MdOutlineIcecream,
  MdOutlineCake,
  MdOutlineRestaurantMenu,
  MdOutlineRamenDining,
  MdOutlineKebabDining,
  MdOutlineLiquor,
  MdOutlineCookie,
  MdOutlineLocalDining,
  MdOutlineSetMeal,
  MdOutlineLocalBar,
};

const mealIcons: string[] = Object.keys(IconComponents);

/**
 * MealSchedule Component
 *
 * Manages the display and functionality for user's meal routines.
 * This component has been refactored to use the new dedicated services.
 */
const MealSchedule: React.FC<MealScheduleProps> = ({ currentUser, appState, onAppStateUpdate }) => {
  const activeGoalId = appState?.activeGoalId;

  // NEW: Access showToast from the global notification store
  const showToast = useNotificationStore(state => state.showToast);

  const [meals, setMeals] = useState<ScheduledRoutineBase[]>(
    appState?.goals[activeGoalId || '']?.routineSettings?.meal || []
  );

  useEffect(() => {
    if (activeGoalId && appState?.goals[activeGoalId]?.routineSettings) {
      setMeals(appState.goals[activeGoalId].routineSettings.meal || []);
    } else {
      setMeals([]);
    }
  }, [appState, activeGoalId]);

  /**
   * A helper function to construct the new settings object and call the update service.
   */
  const callUpdateRoutineSettings = useCallback(
    async (updatedSchedules: ScheduledRoutineBase[]) => {
      if (!currentUser || !activeGoalId || !appState) {
        throw new Error('User or goal not available for updating settings.');
      }
      const currentSettings = appState.goals[activeGoalId]?.routineSettings;
      if (!currentSettings) {
        throw new Error('Routine settings not found for the active goal.');
      }

      const newSettings = {
        ...currentSettings,
        meal: updatedSchedules,
      };

      await updateRoutineSettings(currentUser.uid, activeGoalId, newSettings);
      const newAppState = await getUserData(currentUser.uid);
      onAppStateUpdate(newAppState);
    },
    [appState, currentUser, activeGoalId, onAppStateUpdate]
  );

  const toggleMealCompletion = useCallback(
    async (index: number) => {
      if (!currentUser || !activeGoalId) {
        showToast('You must be logged in and have an active goal to update schedules.', 'error');
        return;
      }
      const updatedMeals = meals.map((meal, i) =>
        i === index
          ? {
              ...meal,
              completed: !meal.completed,
              updatedAt: Timestamp.now(),
              completedAt: !meal.completed ? Timestamp.now() : null,
            }
          : meal
      );
      setMeals(updatedMeals); // Optimistic UI update

      try {
        await callUpdateRoutineSettings(updatedMeals);
        showToast('Meal schedule updated!', 'success'); // Use global showToast
      } catch (error) {
        console.error('Failed to save meal settings:', error);
        showToast('Failed to save meal settings.', 'error'); // Use global showToast
        const oldState = await getUserData(currentUser!.uid);
        onAppStateUpdate(oldState);
      }
    },
    [currentUser, activeGoalId, meals, showToast, onAppStateUpdate, callUpdateRoutineSettings] // Dependency on global showToast
  );

  const handleSaveSchedule = useCallback(
    async (schedule: ScheduledRoutineBase, index: number | null) => {
      if (!currentUser || !activeGoalId) {
        showToast('You must be logged in and have an active goal to save schedules.', 'error');
        return;
      }
      let updatedMeals: ScheduledRoutineBase[];
      const messageType = index !== null ? 'updated' : 'added';

      if (index !== null) {
        updatedMeals = meals.map((m, i) => (i === index ? schedule : m));
      } else {
        updatedMeals = [...meals, schedule];
      }
      setMeals(updatedMeals); // Optimistic update

      try {
        await callUpdateRoutineSettings(updatedMeals);
        showToast(messageType === 'updated' ? 'Meal updated!' : 'Meal added!', 'success'); // Use global showToast
      } catch (error) {
        console.error('Failed to save meal schedule:', error);
        showToast('Failed to save meal schedule.', 'error'); // Use global showToast
        const oldState = await getUserData(currentUser!.uid);
        onAppStateUpdate(oldState);
      }
    },
    [currentUser, activeGoalId, meals, showToast, onAppStateUpdate, callUpdateRoutineSettings] // Dependency on global showToast
  );

  const handleRemoveSchedule = useCallback(
    async (indexToRemove: number) => {
      if (!currentUser || !activeGoalId) {
        showToast('You must be logged in and have an active goal to remove schedules.', 'error');
        return;
      }
      const updatedMeals = meals.filter((_, index) => index !== indexToRemove);
      setMeals(updatedMeals); // Optimistic update

      try {
        await callUpdateRoutineSettings(updatedMeals);
        showToast('Meal schedule removed.', 'info'); // Use global showToast
      } catch (error) {
        console.error('Failed to remove meal schedule:', error);
        showToast('Failed to remove meal schedule.', 'error'); // Use global showToast
        const oldState = await getUserData(currentUser!.uid);
        onAppStateUpdate(oldState);
      }
    },
    [currentUser, activeGoalId, meals, showToast, onAppStateUpdate, callUpdateRoutineSettings] // Dependency on global showToast
  );

  const completedMealsCount = meals.filter(meal => meal.completed).length;

  return (
    <div className="space-y-8">
      <RoutineSectionCard
        sectionTitle="Daily Meal Plan"
        summaryCount={`${completedMealsCount}/${meals.length}`}
        summaryLabel="Meals Completed Today"
        progressPercentage={meals.length > 0 ? (completedMealsCount / meals.length) * 100 : 0}
        listTitle="Your Meal Schedules"
        listEmptyMessage="No meals scheduled. Add one below!"
        schedules={meals}
        onToggleCompletion={toggleMealCompletion}
        onRemoveSchedule={handleRemoveSchedule}
        onSaveSchedule={handleSaveSchedule}
        // REMOVED: showToast prop is no longer needed, RoutineSectionCard gets it directly
        newInputLabelPlaceholder="e.g., Lunch"
        newIconOptions={mealIcons}
        iconComponentsMap={IconComponents}
      />
      <RoutineCalendar
        appState={appState}
        currentUser={currentUser}
        onAppStateUpdate={onAppStateUpdate}
        routineType={RoutineType.MEAL}
        title="Meal Log"
        icon={MdOutlineRestaurantMenu}
      />
    </div>
  );
};

export default MealSchedule;
