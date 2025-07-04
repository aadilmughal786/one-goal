// app/components/routine/MealSchedule.tsx
'use client';

import { RoutineType } from '@/types';
import React, { useMemo } from 'react';
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

import { useGoalStore } from '@/store/useGoalStore';

import GenericRoutineTab from './GenericRoutineTab';
import WeightTrendChart from './WeightTrendChart';

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

const MealSchedule: React.FC = () => {
  const { appState } = useGoalStore();
  const activeGoal = appState?.goals[appState?.activeGoalId || ''];

  const dailyProgress = useMemo(() => {
    return activeGoal ? Object.values(activeGoal.dailyProgress) : [];
  }, [activeGoal]);

  return (
    <div className="space-y-8">
      <GenericRoutineTab
        routineType={RoutineType.MEAL}
        sectionTitle="Daily Meal Plan"
        summaryLabel="Meals Completed Today"
        listEmptyMessage="No meals scheduled. Add one below!"
        newInputLabelPlaceholder="e.g., Lunch"
        iconOptions={mealIcons}
        iconComponentsMap={IconComponents}
        calendarIcon={MdOutlineRestaurantMenu}
      />

      <WeightTrendChart dailyProgress={dailyProgress} />
    </div>
  );
};

export default MealSchedule;
