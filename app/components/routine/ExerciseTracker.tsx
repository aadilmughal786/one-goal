// app/components/routine/ExerciseTracker.tsx
'use client';

import { RoutineType } from '@/types';
import React from 'react';
import { FaDumbbell } from 'react-icons/fa6';
import {
  MdOutlineAccessibility,
  MdOutlineDirectionsBike,
  MdOutlineDirectionsRun,
  MdOutlineFitnessCenter,
  MdOutlineSportsBasketball,
  MdOutlineSportsHandball,
  MdSportsCricket,
  MdSportsGymnastics,
} from 'react-icons/md';
import GenericRoutineTab from './GenericRoutineTab';

const IconComponents: { [key: string]: React.ElementType } = {
  MdOutlineDirectionsRun,
  MdOutlineFitnessCenter,
  MdOutlineSportsHandball,
  MdOutlineSportsBasketball,
  MdOutlineDirectionsBike,
  FaDumbbell,
  MdSportsCricket,
  MdOutlineAccessibility,
  MdSportsGymnastics,
};

const exerciseIcons: string[] = Object.keys(IconComponents);

const ExerciseTracker: React.FC = () => {
  return (
    <GenericRoutineTab
      routineType={RoutineType.EXERCISE}
      sectionTitle="Exercise Routine"
      summaryLabel="Workouts Completed Today"
      listEmptyMessage="No workouts scheduled. Add one to get started!"
      newInputLabelPlaceholder="e.g., Morning Run"
      iconOptions={exerciseIcons}
      iconComponentsMap={IconComponents}
      calendarIcon={MdOutlineDirectionsRun}
    />
  );
};

export default ExerciseTracker;
