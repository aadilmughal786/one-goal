// app/(root)/stop-watch/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { firebaseService } from '@/services/firebaseService';
import Stopwatch from '@/components/Stopwatch';
import { User } from 'firebase/auth';

const StopwatchPageSkeleton = () => (
  <div className="mx-auto w-full max-w-xl animate-pulse">
    <div className="mb-12 text-center">
      <div className="mx-auto mb-4 w-3/4 h-8 rounded-lg bg-white/10"></div>
      <div className="mx-auto w-full h-5 rounded-lg bg-white/10"></div>
      <div className="mx-auto mt-2 w-5/6 h-5 rounded-lg bg-white/10"></div>
    </div>
    <div className="p-6 sm:p-8 bg-white/[0.02] border border-white/10 rounded-3xl shadow-2xl">
      <div className="mx-auto w-3/4 h-16 rounded-lg sm:h-20 bg-white/10"></div>
      <div className="mx-auto mt-2 w-1/4 h-6 rounded-lg bg-white/10"></div>
      <div className="flex gap-4 justify-center mt-8 sm:mt-10">
        <div className="w-16 h-16 rounded-full sm:w-20 sm:h-20 bg-white/10"></div>
        <div className="w-16 h-16 rounded-full sm:w-20 sm:h-20 bg-white/10"></div>
      </div>
    </div>
  </div>
);

export default function StopwatchPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [, setUser] = useState<User | null>(null);

  // --- NEW: Authentication Check ---
  useEffect(() => {
    const unsubscribe = firebaseService.onAuthChange(currentUser => {
      if (currentUser) {
        setUser(currentUser);
        setIsLoading(false);
      } else {
        // If no user is logged in, redirect to the login page.
        router.replace('/login');
      }
    });

    // Cleanup the subscription when the component unmounts.
    return () => unsubscribe();
  }, [router]);

  // Display a skeleton loader while verifying authentication.
  if (isLoading) {
    return (
      <main className="flex flex-col min-h-screen text-white bg-black font-poppins">
        <div className="container flex flex-grow justify-center items-center p-4 mx-auto max-w-4xl">
          <section className="py-8 w-full">
            <StopwatchPageSkeleton />
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen text-white bg-black font-poppins">
      <div className="container flex flex-grow justify-center items-center p-4 mx-auto max-w-4xl">
        <section className="py-8 w-full">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">The Focus Timer</h2>
            <p className="mx-auto max-w-2xl text-lg text-white/70">
              Deep work requires uninterrupted concentration. Use this timer to commit to a block of
              focused effort on your goal. Every second you track is a step forward.
            </p>
          </div>
          <Stopwatch />
        </section>
      </div>
    </main>
  );
}
