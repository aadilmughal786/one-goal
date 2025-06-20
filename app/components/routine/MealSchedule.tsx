// app/components/routine/MealSchedule.tsx
'use client';

import { firebaseService } from '@/services/firebaseService';
import { AppState, RoutineType, ScheduledRoutineBase } from '@/types';
import { User } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore'; // Import Timestamp
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

// Import the reusable components
import RoutineCalendar from '@/components/routine/RoutineCalendar';
import RoutineSectionCard from '@/components/routine/RoutineSectionCard';

interface MealScheduleProps {
  currentUser: User | null;
  appState: AppState | null;
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
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

// Array of icon names to be passed as options to the ScheduleEditModal
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

/**
 * MealSchedule Component
 *
 * Manages the display and functionality for user's meal routines.
 * It integrates with Firebase to store and retrieve scheduled routines and their completion status.
 *
 * Uses:
 * - RoutineSectionCard to display the list of scheduled meal times and their progress.
 * - RoutineCalendar to provide a calendar view for logging daily meal routine completion.
 */
const MealSchedule: React.FC<MealScheduleProps> = ({
  currentUser,
  appState,
  showMessage,
  onAppStateUpdate,
}) => {
  // Derive the active goal ID from the appState
  const activeGoalId = appState?.activeGoalId;

  // State to hold the meal schedules for the currently active goal.
  // Corrected to 'meal' property as per RoutineType and UserRoutineSettings.
  const [meals, setMeals] = useState<ScheduledRoutineBase[]>(
    appState?.goals[activeGoalId || '']?.routineSettings?.meal || []
  );

  // Effect to update local schedules state whenever appState changes,
  // specifically when the active goal's meal settings are updated from Firebase.
  useEffect(() => {
    if (activeGoalId && appState?.goals[activeGoalId]?.routineSettings) {
      // Corrected to 'meal' property
      setMeals(appState.goals[activeGoalId].routineSettings.meal || []);
    } else {
      setMeals([]); // Clear schedules if no active goal or settings
    }
  }, [appState, activeGoalId]);

  /**
   * Toggles the 'completed' status of a specific meal schedule.
   * Updates the local state and then persists the change to Firebase.
   * @param index The index of the schedule in the current `meals` array to toggle.
   */
  const toggleMealCompletion = useCallback(
    async (index: number) => {
      if (!currentUser || !activeGoalId) {
        showMessage('You must be logged in and have an active goal to update schedules.', 'error');
        return;
      }

      // Create a new array with the toggled schedule's completion status and updated timestamp
      const updatedMeals = meals.map((meal, i) =>
        i === index
          ? {
              ...meal,
              completed: !meal.completed,
              updatedAt: Timestamp.now(), // Update timestamp on modification
              completedAt: !meal.completed ? Timestamp.now() : null, // Set/clear completedAt
            }
          : meal
      );

      // Optimistically update local state for immediate UI feedback
      setMeals(updatedMeals);

      try {
        // Persist the updated schedules to Firebase for the active goal.
        // Corrected to 'meal' property
        await firebaseService.updateMealRoutineSchedules(
          activeGoalId,
          currentUser.uid,
          updatedMeals
        );
        // Re-fetch the entire appState to ensure all contexts are updated consistently
        const newAppState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(newAppState);
        showMessage('Meal schedule updated!', 'success');
      } catch (error) {
        console.error('Failed to save meal settings:', error);
        showMessage('Failed to save meal settings.', 'error');
        // Revert to old state if save fails by re-fetching from Firebase
        const oldState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(oldState);
      }
    },
    [currentUser, activeGoalId, meals, showMessage, onAppStateUpdate]
  );

  /**
   * Handles saving a new or updated meal schedule.
   * This function is passed to and called by the ScheduleEditModal.
   * @param schedule The ScheduledRoutineBase object to save/update.
   * @param index The original index if updating an existing schedule, or null if adding a new one.
   */
  const handleSaveSchedule = useCallback(
    async (schedule: ScheduledRoutineBase, index: number | null) => {
      if (!currentUser || !activeGoalId) {
        showMessage('You must be logged in and have an active goal to save schedules.', 'error');
        return;
      }

      let updatedMeals: ScheduledRoutineBase[];

      if (index !== null) {
        // If index is provided, it's an update operation
        updatedMeals = meals.map((m, i) => (i === index ? schedule : m));
      } else {
        // If no index, it's a new schedule
        updatedMeals = [...meals, schedule];
      }

      // Optimistically update local state
      setMeals(updatedMeals);

      try {
        // Persist the updated schedules to Firebase for the active goal.
        // Corrected to 'meal' property
        await firebaseService.updateMealRoutineSchedules(
          activeGoalId,
          currentUser.uid,
          updatedMeals
        );
        showMessage(index !== null ? 'Meal updated!' : 'Meal added!', 'success');
        // Re-fetch appState after successful save to ensure data consistency across the app
        const newAppState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(newAppState);
      } catch (error) {
        console.error('Failed to save meal schedule:', error);
        showMessage('Failed to save meal schedule.', 'error');
        // Revert local state by re-fetching original data from Firebase
        const oldState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(oldState);
      }
    },
    [currentUser, activeGoalId, meals, showMessage, onAppStateUpdate]
  );

  /**
   * Handles removing a specific meal schedule.
   * Updates the local state and then persists the change to Firebase.
   * @param indexToRemove The index of the schedule to remove from the current `meals` array.
   */
  const handleRemoveSchedule = useCallback(
    async (indexToRemove: number) => {
      if (!currentUser || !activeGoalId) {
        showMessage('You must be logged in and have an active goal to remove schedules.', 'error');
        return;
      }

      // Filter out the schedule to be removed
      const updatedMeals = meals.filter((_, index) => index !== indexToRemove);

      // Optimistically update local state
      setMeals(updatedMeals);

      try {
        // Persist the updated schedules to Firebase for the active goal.
        // Corrected to 'meal' property
        await firebaseService.updateMealRoutineSchedules(
          activeGoalId,
          currentUser.uid,
          updatedMeals
        );
        showMessage('Meal schedule removed.', 'info');
        // Re-fetch appState after successful removal
        const newAppState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(newAppState);
      } catch (error) {
        console.error('Failed to remove meal schedule:', error);
        showMessage('Failed to remove meal schedule.', 'error');
        const oldState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(oldState);
      }
    },
    [currentUser, activeGoalId, meals, showMessage, onAppStateUpdate]
  );

  // Calculate the number of completed schedules for the summary card
  const completedMealsCount = meals.filter(meal => meal.completed).length;

  return (
    <div className="space-y-8">
      {/* Routine Section Card for Meal Schedules */}
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
        showMessage={showMessage}
        newInputLabelPlaceholder="e.g., Lunch"
        newIconOptions={mealIcons}
        iconComponentsMap={IconComponents}
      />
      {/* Routine Calendar for Meal Routine Logging */}
      <RoutineCalendar
        appState={appState}
        currentUser={currentUser}
        showMessage={showMessage}
        onAppStateUpdate={onAppStateUpdate}
        routineType={RoutineType.MEAL} // Corrected to RoutineType.MEAL (singular)
        title="Meal Log"
        icon={MdOutlineRestaurantMenu} // Default icon for the calendar header
      />
    </div>
  );
};

export default MealSchedule;
