// app/components/common/NoActiveGoalMessage.tsx
'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { FiActivity, FiCheckSquare, FiEdit, FiHome, FiStar, FiTarget } from 'react-icons/fi'; // Added FiActivity for analytics context
import { MdOutlineNightlight, MdOutlineRestaurant, MdOutlineWaterDrop } from 'react-icons/md';

/**
 * An array of objects, each containing an icon component and its contextual label.
 * These will cycle one at a time to provide a dynamic representation.
 */
const cyclingIconsWithContext = [
  { icon: FiHome, label: 'Dashboard Overview' },
  { icon: FiCheckSquare, label: 'Manage Tasks' },
  { icon: FiTarget, label: 'Define Your Goal' }, // Direct context for setting a goal
  { icon: MdOutlineWaterDrop, label: 'Track Hydration' },
  { icon: MdOutlineNightlight, label: 'Log Sleep' },
  { icon: MdOutlineRestaurant, label: 'Plan Meals' },
  { icon: FiActivity, label: 'Analyze Progress' }, // Analytics context
  { icon: FiStar, label: 'Discover Quotes' },
];

/**
 * NoActiveGoalMessage Component
 *
 * A reusable component to display a fixed message when no active goal is found.
 * It guides the user to the Goals page to set or create a new goal.
 * This version features a single icon cycling through a predefined sequence with animations,
 * accompanied by contextual text to better represent the app's features.
 * This component does NOT take any props and renders a static message.
 */
const NoActiveGoalMessage: React.FC = () => {
  // State to keep track of the current icon's index in the `cyclingIconsWithContext` array.
  const [currentIconIndex, setCurrentIconIndex] = useState(0);
  // State to control the fade-out/fade-in animation of the icon and text.
  const [fade, setFade] = useState(true);

  // Effect to cycle through the icons and their contexts.
  useEffect(() => {
    const cycleInterval = setInterval(() => {
      setFade(false); // Start fading out

      // After a short delay (for fade-out to complete), change the content and fade in.
      const changeContentTimeout = setTimeout(() => {
        setCurrentIconIndex(prevIndex => (prevIndex + 1) % cyclingIconsWithContext.length);
        setFade(true); // Start fading in
      }, 300); // This should be less than or equal to your CSS transition duration

      return () => clearTimeout(changeContentTimeout); // Cleanup inner timeout
    }, 2000); // Change content every 2 seconds (2000ms)

    return () => clearInterval(cycleInterval); // Cleanup main interval on unmount
  }, []); // Empty dependency array ensures this effect runs only once on mount.

  // Get the current icon component and its label based on `currentIconIndex`.
  const { icon: CurrentIcon, label: currentContextLabel } =
    cyclingIconsWithContext[currentIconIndex];

  return (
    <div className="flex flex-col justify-center items-center p-10 h-full text-center bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg">
      {/* Cycling Icon and Context Text */}
      <div className="flex flex-col justify-center items-center mb-6 h-24">
        {' '}
        {/* Added fixed height to prevent layout shift */}
        <CurrentIcon
          className={`w-20 h-20 text-white/70 transition-opacity duration-300 ${
            fade ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <p
          className={`mt-2 text-lg font-semibold text-white/80 transition-opacity duration-300 ${
            fade ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {currentContextLabel}
        </p>
      </div>

      <h2 className="mb-4 text-3xl font-bold text-white">No Active Goal Found</h2>
      <p className="mx-auto mb-8 max-w-2xl text-lg text-white/70">
        You need to set a primary goal to unlock all the features and begin your tracking journey.
        All your goal management is in one convenient place.
      </p>
      <Link
        href="/goal" // Fixed link to the /goal page
        className="inline-flex gap-3 items-center px-8 py-4 font-semibold text-black bg-white rounded-full transition-all duration-200 cursor-pointer group hover:bg-white/90 hover:scale-105"
      >
        <FiEdit size={20} /> {/* Fixed icon for the button */}
        Go to Goals Page
      </Link>
    </div>
  );
};

export default NoActiveGoalMessage;
