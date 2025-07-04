// app/components/routine/BathSchedule.tsx
'use client';

import { RoutineType } from '@/types';
import React from 'react';
import { MdOutlineHotTub, MdOutlinePool, MdOutlineShower, MdOutlineWash } from 'react-icons/md';
import GenericRoutineTab from './GenericRoutineTab';

const IconComponents: { [key: string]: React.ElementType } = {
  MdOutlineShower,
  MdOutlineHotTub,
  MdOutlinePool,
  MdOutlineWash,
};

const bathIcons: string[] = Object.keys(IconComponents);

const BathSchedule: React.FC = () => {
  return (
    <GenericRoutineTab
      routineType={RoutineType.BATH}
      sectionTitle="Bath & Hygiene Routine"
      summaryLabel="Sessions Completed Today"
      listEmptyMessage="No bath times scheduled. Add one to get started!"
      newInputLabelPlaceholder="e.g., Evening Shower"
      iconOptions={bathIcons}
      iconComponentsMap={IconComponents}
      calendarIcon={MdOutlineShower}
    />
  );
};

export default BathSchedule;
