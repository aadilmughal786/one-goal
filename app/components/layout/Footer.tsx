// app/components/layout/Footer.tsx
'use client'; // Marks this component as a Client Component in Next.js

import React from 'react'; // Import React

/**
 * Footer Component
 *
 * This component renders the application's footer. It displays a copyright notice
 * with the current year and a simple, consistent design.
 */
const Footer: React.FC = () => {
  return (
    // The footer element.
    // It's styled with Tailwind CSS to be a flex container, centered, with padding,
    // a blurred background (backdrop-blur-md) and a semi-transparent black background.
    <footer className="flex justify-center items-center p-4 backdrop-blur-md bg-black/50">
      {/* Copyright text. */}
      {/* Uses text-sm for small font size and text-white/40 for a subtle white color. */}
      <p className="text-sm text-white/40">
        &copy; {new Date().getFullYear()} One Goal. Built with focus and dedication.
      </p>
    </footer>
  );
};

export default Footer; // Export the Footer component for use in other parts of the application
