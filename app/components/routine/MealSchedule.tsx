// app/components/routine/MealSchedule.tsx
'use client';

import { RoutineType, ScheduledRoutineBase } from '@/types';
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

// --- REFACTOR: Import the global Zustand stores ---
import { useGoalStore } from '@/store/useGoalStore';
import { useNotificationStore } from '@/store/useNotificationStore';

// Import the reusable components
import RoutineCalendar from '@/components/routine/RoutineCalendar';
import RoutineSectionCard from '@/components/routine/RoutineSectionCard';

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
 * This component has been refactored to fetch its own data from the useGoalStore.
 */
const MealSchedule: React.FC = () => {
  // --- REFACTOR: Get all necessary state and actions from the stores ---
  // FIX: Select each piece of state individually to prevent infinite loops.
  const appState = useGoalStore(state => state.appState);
  const updateRoutineSettings = useGoalStore(state => state.updateRoutineSettings);
  const showToast = useNotificationStore(state => state.showToast);

  const activeGoal = appState?.goals[appState?.activeGoalId || ''];

  const [meals, setMeals] = useState<ScheduledRoutineBase[]>([]);

  useEffect(() => {
    // Update local schedules state when the global store changes
    setMeals(activeGoal?.routineSettings?.meal || []);
  }, [activeGoal]);

  const toggleMealCompletion = useCallback(
    async (index: number) => {
      if (!activeGoal) return;
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
      const newSettings = { ...activeGoal.routineSettings, meal: updatedMeals };
      try {
        await updateRoutineSettings(newSettings);
        showToast('Meal schedule updated!', 'success');
      } catch (error) {
        console.error('Failed to save meal settings:', error);
      }
    },
    [meals, activeGoal, updateRoutineSettings, showToast]
  );

  const handleSaveSchedule = useCallback(
    async (schedule: ScheduledRoutineBase, index: number | null) => {
      if (!activeGoal) return;
      let updatedMeals: ScheduledRoutineBase[];
      const messageType = index !== null ? 'updated' : 'added';

      if (index !== null) {
        updatedMeals = meals.map((m, i) => (i === index ? schedule : m));
      } else {
        updatedMeals = [...meals, schedule];
      }
      const newSettings = { ...activeGoal.routineSettings, meal: updatedMeals };
      try {
        await updateRoutineSettings(newSettings);
        showToast(messageType === 'updated' ? 'Meal updated!' : 'Meal added!', 'success');
      } catch (error) {
        console.error('Failed to save meal schedule:', error);
      }
    },
    [meals, activeGoal, updateRoutineSettings, showToast]
  );

  const handleRemoveSchedule = useCallback(
    async (indexToRemove: number) => {
      if (!activeGoal) return;
      const updatedMeals = meals.filter((_, index) => index !== indexToRemove);
      const newSettings = { ...activeGoal.routineSettings, meal: updatedMeals };
      try {
        await updateRoutineSettings(newSettings);
        showToast('Meal schedule removed.', 'info');
      } catch (error) {
        console.error('Failed to remove meal schedule:', error);
      }
    },
    [meals, activeGoal, updateRoutineSettings, showToast]
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
        newInputLabelPlaceholder="e.g., Lunch"
        newIconOptions={mealIcons}
        iconComponentsMap={IconComponents}
      />
      <RoutineCalendar
        routineType={RoutineType.MEAL}
        title="Meal Log"
        icon={MdOutlineRestaurantMenu}
      />
    </div>
  );
};

export default MealSchedule;
