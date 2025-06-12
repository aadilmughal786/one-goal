// app/(root)/stop-watch/page.tsx
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';

// Component imports
import ToastMessage from '@/components/ToastMessage';
import Stopwatch from '@/components/Stopwatch'; // Import the standalone Stopwatch component
import { firebaseService } from '@/services/firebaseService'; // Import firebaseService

export default function StopwatchPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const showMessage = useCallback((text: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(text);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 6000);
  }, []);

  // Effect to manage auth state and redirect if not authenticated
  useEffect(() => {
    const unsubscribeAuth = firebaseService.onAuthChange(user => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (!user) {
        router.replace('/login');
      }
    });
    return () => unsubscribeAuth();
  }, [router]);

  if (authLoading) {
    return (
      <main className="flex justify-center items-center min-h-screen text-white bg-black font-poppins">
        <p className="text-xl text-white/70">Authenticating...</p>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main className="flex justify-center items-center min-h-screen text-white bg-black font-poppins">
        <p className="text-xl text-white/70">Redirecting to login...</p>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen text-white bg-black font-poppins">
      <ToastMessage message={toastMessage} type={toastType} duration={5000} />

      <div className="container flex flex-grow justify-center items-center p-4 mx-auto max-w-4xl">
        <section className="py-8 w-full">
          <h2 className="mb-8 text-3xl font-bold text-center text-white">Focus Timer</h2>
          {/* Render the Stopwatch component */}
          <Stopwatch showMessage={showMessage} />
        </section>
      </div>
    </main>
  );
}
