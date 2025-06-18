// app/(root)/routine/page.tsx

import React, { Suspense } from 'react';
import RoutinePageContent from '@/components/routine/RoutinePageContent';

// A skeleton loader for the suspense fallback
const RoutinePageSkeleton = () => (
  <div className="flex min-h-screen text-white bg-black border-b animate-pulse font-poppins border-white/10">
    {/* Sidebar Skeleton */}
    <nav className="flex sticky top-0 flex-col flex-shrink-0 items-center py-4 w-20 h-screen border-r bg-black/50 border-white/10 sm:w-24">
      <div className="flex-grow px-2 pb-4 space-y-4 w-full">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="flex flex-col justify-center items-center px-1 py-3 w-full h-20 rounded-lg bg-white/10"
          >
            <div className="mb-1 w-8 h-8 rounded-full bg-white/10"></div>
            <div className="w-12 h-3 rounded-md bg-white/10"></div>
          </div>
        ))}
      </div>
    </nav>
    {/* Main Content Skeleton */}
    <main className="overflow-y-auto flex-grow p-4 md:p-8">
      <div className="px-4 py-6 mx-auto max-w-4xl text-center">
        <div className="mx-auto mb-2 w-3/4 h-10 rounded-md bg-white/10"></div>
        <div className="mx-auto w-1/2 h-6 rounded-md bg-white/10"></div>
      </div>
      <div className="mx-auto mt-8 max-w-4xl">
        <div className="p-6 bg-white/[0.02] border border-white/10 rounded-3xl">
          <div className="mb-6 h-8 rounded-md bg-white/10"></div>
          <div className="mb-6 h-10 rounded-md bg-white/10"></div>
          <div className="mb-8 h-3 rounded-full bg-white/20"></div>
          <div className="space-y-4">
            <div className="h-16 rounded-lg bg-white/5"></div>
            <div className="h-16 rounded-lg bg-white/5"></div>
          </div>
        </div>
      </div>
    </main>
  </div>
);

export default function RoutinePage() {
  return (
    <Suspense fallback={<RoutinePageSkeleton />}>
      <RoutinePageContent />
    </Suspense>
  );
}
