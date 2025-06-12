// app/stop-watch/page.tsx
'use client';

import React, { useState, useCallback } from 'react';

// Component imports
import ToastMessage from '@/components/ToastMessage';
import Stopwatch from '@/components/Stopwatch'; // Import the standalone Stopwatch component

export default function StopwatchPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const showMessage = useCallback((text: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(text);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 6000);
  }, []);

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
