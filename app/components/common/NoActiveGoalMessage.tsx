// app/components/common/NoActiveGoalMessage.tsx
'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { FiActivity, FiCheckSquare, FiEdit, FiHome, FiStar, FiTarget } from 'react-icons/fi';
import { MdOutlineNightlight, MdOutlineRestaurant, MdOutlineWaterDrop } from 'react-icons/md';

const cyclingIconsWithContext = [
  { icon: FiHome, label: 'Dashboard Overview' },
  { icon: FiCheckSquare, label: 'Manage Tasks' },
  { icon: FiTarget, label: 'Define Your Goal' },
  { icon: MdOutlineWaterDrop, label: 'Track Hydration' },
  { icon: MdOutlineNightlight, label: 'Log Sleep' },
  { icon: MdOutlineRestaurant, label: 'Plan Meals' },
  { icon: FiActivity, label: 'Analyze Progress' },
  { icon: FiStar, label: 'Discover Quotes' },
];

const NoActiveGoalMessage: React.FC = () => {
  const [currentIconIndex, setCurrentIconIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const cycleInterval = setInterval(() => {
      setFade(false);

      const changeContentTimeout = setTimeout(() => {
        setCurrentIconIndex(prevIndex => (prevIndex + 1) % cyclingIconsWithContext.length);
        setFade(true);
      }, 300);

      return () => clearTimeout(changeContentTimeout);
    }, 2000);

    return () => clearInterval(cycleInterval);
  }, []);

  const { icon: CurrentIcon, label: currentContextLabel } =
    cyclingIconsWithContext[currentIconIndex];

  return (
    <div className="flex flex-col justify-center items-center p-10 h-full text-center card">
      <div className="flex flex-col justify-center items-center mb-6 h-24">
        <CurrentIcon
          className={`w-20 h-20 text-text-secondary transition-opacity duration-300 ${
            fade ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <p
          className={`mt-2 text-lg font-semibold text-text-secondary transition-opacity duration-300 ${
            fade ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {currentContextLabel}
        </p>
      </div>

      <h2 className="mb-4 text-3xl font-bold text-text-primary">No Active Goal Found</h2>
      <p className="mx-auto mb-8 max-w-2xl text-lg text-text-secondary">
        You need to set a primary goal to unlock all the features and begin your tracking journey.
        All your goal management is in one convenient place.
      </p>
      <Link
        href="/goal"
        className="inline-flex gap-3 items-center px-8 py-4 font-semibold rounded-full transition-all duration-200 cursor-pointer text-bg-primary bg-text-primary group hover:opacity-90"
      >
        <FiEdit size={20} />
        Go to Goals Page
      </Link>
    </div>
  );
};

export default NoActiveGoalMessage;
