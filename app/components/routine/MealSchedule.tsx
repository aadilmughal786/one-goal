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

// Import the new RoutineSectionCard component and its dependency types
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
  const [meals, setMeals] = useState<ScheduledRoutineBase[]>([]);
  const [, setCurrentTime] = useState(new Date());

  // States for new meal input fields (passed to RoutineSectionCard)
  const [newMealLabel, setNewMealLabel] = useState('');
  const [newMealScheduledTime, setNewMealScheduledTime] = useState(format(new Date(), 'HH:mm'));
  const [newMealDurationMinutes, setNewMealDurationMinutes] = useState(30);
  const [newMealIcon, setNewMealIcon] = useState(mealIcons[0]); // Default icon for new meals

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync local state with appState from Firebase
  useEffect(() => {
    if (appState?.routineSettings?.meals) {
      setMeals(appState.routineSettings.meals);
    } else {
      setMeals([]); // Initialize to empty array if no data from Firebase
    }
  }, [appState]);

  const getTimeUntilSchedule = useCallback(
    (scheduledTime: string): { hours: number; minutes: number; total: number; isPast: boolean } => {
      const now = new Date();
      const [targetH, targetM] = scheduledTime.split(':').map(Number);
      const targetDate = new Date();
      targetDate.setHours(targetH, targetM, 0, 0);

      let isPastToday = false;
      if (targetDate <= now) {
        isPastToday = true;
        targetDate.setDate(targetDate.getDate() + 1);
      }

      const diff = targetDate.getTime() - now.getTime();
      const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
      const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      return { hours: hoursLeft, minutes: minutesLeft, total: diff, isPast: isPastToday };
    },
    []
  );

  // Function to save meal settings to Firebase - now triggered on state changes/actions
  const saveMealSettings = useCallback(async () => {
    if (!currentUser) {
      showMessage('You must be logged in to save settings.', 'error');
      return;
    }

    try {
      await firebaseService.updateSpecificRoutineSetting(currentUser.uid, 'meals', meals);
    } catch (error: unknown) {
      console.error('Failed to save meal settings:', error);
      showMessage('Failed to save meal settings.', 'error');
    }
  }, [currentUser, meals, showMessage]);

  const toggleMealCompletion = useCallback(
    (index: number) => {
      setMeals(prevMeals => {
        const newMeals = [...prevMeals];
        const mealToUpdate = { ...newMeals[index] };
        mealToUpdate.completed = !mealToUpdate.completed;
        mealToUpdate.updatedAt = Timestamp.now();
        newMeals[index] = mealToUpdate;
        return newMeals;
      });
      setTimeout(saveMealSettings, 0);
    },
    [saveMealSettings]
  );

  const addMealSchedule = useCallback(() => {
    const mealDuration = parseInt(String(newMealDurationMinutes));
    if (!newMealLabel.trim() || !newMealScheduledTime || isNaN(mealDuration) || mealDuration < 5) {
      showMessage('Please provide a valid label, time, and duration (min 5 min).', 'error');
      return;
    }

    const newMeal: ScheduledRoutineBase = {
      scheduledTime: newMealScheduledTime,
      durationMinutes: mealDuration,
      label: newMealLabel.trim(),
      icon: newMealIcon, // Use selected icon
      completed: false,
      updatedAt: Timestamp.now(),
    };

    const updatedMeals = [...meals, newMeal];
    setMeals(updatedMeals);
    setNewMealLabel('');
    setNewMealScheduledTime(format(new Date(), 'HH:mm'));
    setNewMealDurationMinutes(30);
    setNewMealIcon('MdOutlineRestaurant'); // Reset icon to default
    saveMealSettings();
  }, [
    meals,
    newMealLabel,
    newMealScheduledTime,
    newMealDurationMinutes,
    newMealIcon,
    saveMealSettings,
    showMessage,
  ]);

  const removeMealSchedule = useCallback(
    (indexToRemove: number) => {
      const updatedMeals = meals.filter((_, index) => index !== indexToRemove);
      setMeals(updatedMeals);
      saveMealSettings();
    },
    [meals, saveMealSettings]
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
      getTimeUntilSchedule={getTimeUntilSchedule} // Pass the time until helper for list rendering
      // Props for the new schedule form, passed to RoutineSectionCard
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
