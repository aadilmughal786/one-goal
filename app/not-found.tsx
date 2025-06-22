// app/not-found.tsx
'use client';

import { User } from 'firebase/auth';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FiArrowRight, FiGrid, FiHome } from 'react-icons/fi';

// --- REFLECTING THE REFACTOR ---
// We now import the specific onAuthChange function from our new, focused authService.
import { onAuthChange } from '@/services/authService';

/**
 * A custom 404 "Not Found" page.
 * It provides a user-friendly message and a context-aware action button that
 * links to the dashboard for logged-in users or the home page for guests.
 */
export default function NotFoundPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // This effect subscribes to authentication state changes using the new authService.
  useEffect(() => {
    const unsubscribe = onAuthChange(user => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  /**
   * Renders the primary call-to-action button, which varies based on
   * the user's authentication status (loading, logged in, or guest).
   */
  const renderActionLink = () => {
    if (authLoading) {
      return (
        <button
          disabled
          className="inline-flex gap-3 items-center px-8 py-4 font-semibold text-black bg-white rounded-full opacity-60 cursor-not-allowed"
        >
          <svg
            className="w-5 h-5 text-black animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Loading...
        </button>
      );
    }

    if (currentUser) {
      return (
        <Link
          href="/dashboard"
          className="inline-flex gap-3 items-center py-2 pr-6 pl-2 font-semibold text-black bg-white rounded-full transition-all duration-200 cursor-pointer group hover:bg-white/90 hover:scale-105 hover:shadow-xl"
        >
          {currentUser.photoURL ? (
            <Image
              src={currentUser.photoURL}
              alt="Your profile picture"
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <span className="flex justify-center items-center w-8 h-8 bg-gray-200 rounded-full">
              <FiGrid size={20} />
            </span>
          )}
          <span className="mx-2">Go to Dashboard</span>
          <FiArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </Link>
      );
    }

    return (
      <Link
        href="/"
        className="inline-flex gap-3 items-center px-8 py-4 font-semibold text-black bg-white rounded-full transition-all duration-200 cursor-pointer group hover:bg-white/90 hover:scale-105 hover:shadow-xl"
      >
        <FiHome size={20} />
        Go to Home
      </Link>
    );
  };

  return (
    <div className="relative z-10 px-6 mx-auto max-w-4xl text-center py-15">
      {/* 404 Text */}
      <h1 className="text-8xl sm:text-9xl lg:text-[12rem] font-bold tracking-tight mb-4 leading-none text-white/20">
        404
      </h1>

      {/* Error Message */}
      <h2 className="mb-6 text-3xl font-bold tracking-tight leading-tight sm:text-4xl lg:text-5xl">
        Page Not Found
      </h2>

      <p className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed sm:text-xl text-white/70">
        The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you
        back on track to achieving your goals.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col gap-4 justify-center items-center h-16 sm:flex-row sm:gap-6">
        {renderActionLink()}
      </div>
    </div>
  );
}
