// app/components/common/PageContentSkeleton.tsx
'use client';

/**
 * A reusable skeleton loader for main page content areas.
 * Provides a consistent "loading" visual across different pages like
 * Dashboard, To-Do, Routines, etc.
 */
const PageContentSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    <div className="p-8 bg-white/[0.02] border border-white/10 rounded-2xl shadow-lg">
      {/* Title Placeholder */}
      <div className="mb-2 w-1/3 h-8 rounded-lg bg-white/10"></div>
      {/* Subtitle Placeholder */}
      <div className="mb-6 w-full h-4 rounded-lg bg-white/10"></div>
      {/* Content Placeholder */}
      <div className="space-y-3">
        <div className="w-full h-12 rounded-lg bg-white/5"></div>
        <div className="w-full h-12 rounded-lg bg-white/5"></div>
        <div className="w-full h-12 rounded-lg bg-white/5"></div>
      </div>
    </div>
  </div>
);

export default PageContentSkeleton;
