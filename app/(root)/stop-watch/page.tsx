// app/(root)/stop-watch/page.tsx
'use client';

import React from 'react';
import Stopwatch from '@/components/Stopwatch';

export default function StopwatchPage() {
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
