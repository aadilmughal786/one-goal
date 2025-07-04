// app/components/routine/TeethCare.tsx
'use client';

import { RoutineType } from '@/types';
import React from 'react';
import { FaTeeth, FaTooth } from 'react-icons/fa6';
import {
  MdOutlineCleaningServices,
  MdOutlineHealthAndSafety,
  MdOutlineSentimentSatisfied,
} from 'react-icons/md';
import GenericRoutineTab from './GenericRoutineTab';

const IconComponents: { [key: string]: React.ElementType } = {
  FaTooth,
  FaTeeth,
  MdOutlineCleaningServices,
  MdOutlineHealthAndSafety,
  MdOutlineSentimentSatisfied,
};

const teethIcons: string[] = Object.keys(IconComponents);

const TeethCare: React.FC = () => {
  return (
    <GenericRoutineTab
      routineType={RoutineType.TEETH}
      sectionTitle="Dental Care Routine"
      summaryLabel="Sessions Completed Today"
      listEmptyMessage="No sessions scheduled. Add one below!"
      newInputLabelPlaceholder="e.g., Morning Brush"
      iconOptions={teethIcons}
      iconComponentsMap={IconComponents}
      calendarIcon={FaTooth}
    />
  );
};

export default TeethCare;
