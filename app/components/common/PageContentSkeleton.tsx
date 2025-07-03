// app/components/common/PageContentSkeleton.tsx
'use client';

const PageContentSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    <div className="p-8 rounded-2xl border shadow-lg bg-bg-secondary border-border-primary">
      <div className="mb-2 w-1/3 h-8 rounded-lg bg-bg-tertiary"></div>
      <div className="mb-6 w-full h-4 rounded-lg bg-bg-tertiary"></div>
      <div className="space-y-3">
        <div className="w-full h-12 rounded-lg bg-bg-tertiary"></div>
        <div className="w-full h-12 rounded-lg bg-bg-tertiary"></div>
        <div className="w-full h-12 rounded-lg bg-bg-tertiary"></div>
      </div>
    </div>
  </div>
);

export default PageContentSkeleton;
