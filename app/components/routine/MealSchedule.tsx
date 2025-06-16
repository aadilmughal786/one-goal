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
import { AppState, ScheduledRoutineBase } from '@/types';
import { firebaseService } from '@/services/firebaseService';
import { User } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';

// Import the new RoutineSectionCard component
import RoutineSectionCard from '@/components/routine/RoutineSectionCard';

interface MealScheduleProps {
  currentUser: User | null;
  appState: AppState | null;
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
}

// Define the IconComponents map here (in the parent) to pass to RoutineSectionCard
// All referenced icons MUST be imported above.
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

const MealSchedule: React.FC<MealScheduleProps> = ({ currentUser, appState, showMessage }) => {
  // `meals` is guaranteed to be an array or null from AppState, init to empty array if null
  const [meals, setMeals] = useState<ScheduledRoutineBase[]>(
    appState?.routineSettings?.meals || []
  );
  const [, setCurrentTime] = useState(new Date());

  // States for new meal input fields (passed to RoutineSectionCard)
  const [newMealLabel, setNewMealLabel] = useState('');
  const [newMealScheduledTime, setNewMealScheduledTime] = useState(format(new Date(), 'HH:mm'));
  const [newMealDurationMinutes, setNewMealDurationMinutes] = useState(30);
  const [newMealIcon, setNewMealIcon] = useState(mealIcons[0]); // Default icon for new meals

  // Effect to update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync local state with appState from Firebase
  useEffect(() => {
    // `appState.routineSettings.meals` is guaranteed to be an array or null
    setMeals(appState?.routineSettings?.meals || []);
  }, [appState]);

  const toggleMealCompletion = useCallback(
    async (index: number) => {
      if (!currentUser) {
        showMessage('You must be logged in to update schedules.', 'error');
        return;
      }
      // Create a new array to ensure immutability before updating Firestore
      const updatedMeals = meals.map((meal, i) => {
        if (i === index) {
          return { ...meal, completed: !meal.completed, updatedAt: Timestamp.now() };
        }
        return meal;
      });
      setMeals(updatedMeals); // Update local state immediately

      try {
        // Use the dedicated update function for meal schedules
        await firebaseService.updateMealRoutineSchedules(currentUser.uid, updatedMeals);
        showMessage('Meal schedule updated!', 'success');
      } catch (error: unknown) {
        console.error('Failed to save meal settings:', error);
        showMessage('Failed to save meal settings.', 'error');
      }
    },
    [currentUser, meals, showMessage]
  );

  const addMealSchedule = useCallback(async () => {
    const mealDuration = parseInt(String(newMealDurationMinutes));
    if (!newMealLabel.trim() || !newMealScheduledTime || isNaN(mealDuration) || mealDuration < 5) {
      showMessage('Please provide a valid label, time, and duration (min 5 min).', 'error');
      return;
    }
    if (!currentUser) {
      showMessage('You must be logged in to add schedules.', 'error');
      return;
    }

    const newMeal: ScheduledRoutineBase = {
      scheduledTime: newMealScheduledTime,
      durationMinutes: mealDuration,
      label: newMealLabel.trim(),
      icon: newMealIcon, // Use selected icon
      completed: null, // New schedule starts as not completed (null)
      updatedAt: Timestamp.now(),
    };

    const updatedMeals = [...meals, newMeal];
    setMeals(updatedMeals); // Update local state immediately

    try {
      // Use the dedicated update function for meal schedules
      await firebaseService.updateMealRoutineSchedules(currentUser.uid, updatedMeals);
      showMessage('Meal schedule added!', 'success');
      // Reset form fields
      setNewMealLabel('');
      setNewMealScheduledTime(format(new Date(), 'HH:mm'));
      setNewMealDurationMinutes(30);
      setNewMealIcon(mealIcons[0]); // Reset to first icon
    } catch (error: unknown) {
      console.error('Failed to add meal schedule:', error);
      showMessage('Failed to add meal schedule.', 'error');
    }
  }, [
    currentUser,
    meals,
    newMealLabel,
    newMealScheduledTime,
    newMealDurationMinutes,
    newMealIcon,
    showMessage,
  ]);

  const removeMealSchedule = useCallback(
    async (indexToRemove: number) => {
      if (!currentUser) {
        showMessage('You must be logged in to remove schedules.', 'error');
        return;
      }
      const updatedMeals = meals.filter((_, index) => index !== indexToRemove);
      setMeals(updatedMeals); // Update local state immediately

      try {
        // Use the dedicated update function for meal schedules
        await firebaseService.updateMealRoutineSchedules(currentUser.uid, updatedMeals);
        showMessage('Meal schedule removed!', 'info');
      } catch (error: unknown) {
        console.error('Failed to remove meal schedule:', error);
        showMessage('Failed to remove meal schedule.', 'error');
      }
    },
    [currentUser, meals, showMessage]
  );

  const completedMealsCount = meals.filter(meal => meal.completed).length;

  // Prevent scroll for number inputs
  const handleWheel = useCallback((e: React.WheelEvent<HTMLInputElement>) => {
    if (e.currentTarget instanceof HTMLInputElement) {
      e.currentTarget.blur();
    }
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <RoutineSectionCard
      sectionTitle="Daily Meal Plan"
      summaryCount={`${completedMealsCount}/${meals.length}`}
      summaryLabel="Meals Completed Today"
      progressPercentage={meals.length > 0 ? (completedMealsCount / meals.length) * 100 : 0} // Ensure no NaN if meals is empty
      listTitle="Your Meal Schedules"
      listEmptyMessage="No meals scheduled. Add one below!"
      schedules={meals} // Pass the actual list for rendering
      onToggleCompletion={toggleMealCompletion} // Pass the toggle handler
      onRemoveSchedule={removeMealSchedule} // Pass the remove handler
      // Removed getTimeUntilSchedule prop as it's now internal to RoutineSectionCard
      newInputLabelPlaceholder="Meal Label"
      newInputValue={newMealLabel}
      onNewInputChange={setNewMealLabel}
      newTimeValue={newMealScheduledTime}
      onNewTimeChange={setNewMealScheduledTime}
      newDurationPlaceholder="Duration (min)"
      newDurationValue={newMealDurationMinutes === 0 ? '' : String(newMealDurationMinutes)}
      onNewDurationChange={value => {
        const val = parseInt(value);
        setNewMealDurationMinutes(isNaN(val) ? 0 : val);
      }}
      onNewDurationWheel={handleWheel}
      newCurrentIcon={newMealIcon}
      newIconOptions={mealIcons}
      onNewSelectIcon={setNewMealIcon}
      iconComponentsMap={IconComponents} // Pass the IconComponents map from here
      buttonLabel="Add & Save Meal"
      onAddSchedule={addMealSchedule}
    />
  );
};

export default MealSchedule;
