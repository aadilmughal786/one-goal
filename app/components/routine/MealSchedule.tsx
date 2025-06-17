// app/components/routine/MealSchedule.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
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
} from 'react-icons/md';
import { AppState, RoutineType, ScheduledRoutineBase } from '@/types';
import { firebaseService } from '@/services/firebaseService';
import { User } from 'firebase/auth';

// Import the reusable components
import RoutineSectionCard from '@/components/routine/RoutineSectionCard';
import RoutineCalendar from '@/components/routine/RoutineCalendar';

interface MealScheduleProps {
  currentUser: User | null;
  appState: AppState | null;
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
  onAppStateUpdate: (newAppState: AppState) => void;
}

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

const mealIcons: string[] = [
  'MdOutlineLocalCafe',
  'MdOutlineFastfood',
  'MdOutlineLocalPizza',
  'MdOutlineIcecream',
  'MdOutlineCake',
  'MdOutlineRestaurantMenu',
  'MdOutlineRamenDining',
  'MdOutlineKebabDining',
  'MdOutlineLiquor',
  'MdOutlineCookie',
  'MdOutlineLocalDining',
  'MdOutlineSetMeal',
  'MdOutlineLocalBar',
];

const MealSchedule: React.FC<MealScheduleProps> = ({
  currentUser,
  appState,
  showMessage,
  onAppStateUpdate,
}) => {
  const [meals, setMeals] = useState<ScheduledRoutineBase[]>(
    appState?.routineSettings?.meals || []
  );

  useEffect(() => {
    setMeals(appState?.routineSettings?.meals || []);
  }, [appState]);

  const toggleMealCompletion = useCallback(
    async (index: number) => {
      if (!currentUser) {
        showMessage('You must be logged in to update schedules.', 'error');
        return;
      }
      const updatedMeals = meals.map((meal, i) =>
        i === index ? { ...meal, completed: !meal.completed } : meal
      );
      setMeals(updatedMeals);

      try {
        await firebaseService.updateMealRoutineSchedules(currentUser.uid, updatedMeals);
        const newAppState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(newAppState);
        showMessage('Meal schedule updated!', 'success');
      } catch {
        showMessage('Failed to save meal settings.', 'error');
        const oldState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(oldState);
      }
    },
    [currentUser, meals, showMessage, onAppStateUpdate]
  );

  const handleSaveSchedule = useCallback(
    async (schedule: ScheduledRoutineBase, index: number | null) => {
      if (!currentUser) return;
      const updatedMeals =
        index !== null ? meals.map((m, i) => (i === index ? schedule : m)) : [...meals, schedule];
      setMeals(updatedMeals);

      try {
        await firebaseService.updateMealRoutineSchedules(currentUser.uid, updatedMeals);
        showMessage(index !== null ? 'Meal updated!' : 'Meal added!', 'success');
        const newAppState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(newAppState);
      } catch {
        showMessage('Failed to save meal schedule.', 'error');
        const oldState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(oldState);
      }
    },
    [currentUser, meals, showMessage, onAppStateUpdate]
  );

  const handleRemoveSchedule = useCallback(
    async (indexToRemove: number) => {
      if (!currentUser) return;
      const updatedMeals = meals.filter((_, index) => index !== indexToRemove);
      setMeals(updatedMeals);

      try {
        await firebaseService.updateMealRoutineSchedules(currentUser.uid, updatedMeals);
        showMessage('Meal schedule removed.', 'info');
        const newAppState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(newAppState);
      } catch {
        showMessage('Failed to remove meal schedule.', 'error');
        const oldState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(oldState);
      }
    },
    [currentUser, meals, showMessage, onAppStateUpdate]
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
        appState={appState}
        currentUser={currentUser}
        showMessage={showMessage}
        onAppStateUpdate={onAppStateUpdate}
        routineType={RoutineType.MEALS}
        title="Meal Log"
        icon={MdOutlineRestaurantMenu}
      />
    </div>
  );
};

export default MealSchedule;
