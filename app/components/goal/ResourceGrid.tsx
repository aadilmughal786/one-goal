// app/components/resources/ResourceGrid.tsx
'use client';

import { Resource } from '@/types';
import React from 'react';
import { FiInbox } from 'react-icons/fi';
import ResourceCard from './ResourceCard';

interface ResourceGridProps {
  resources: Resource[];
}

const ResourceGrid: React.FC<ResourceGridProps> = ({ resources }) => {
  if (resources.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center py-20 text-center text-white/50">
        <FiInbox size={48} className="mb-4" />
        <h3 className="text-xl font-semibold">No Resources Found</h3>
        <p>Add a resource using the button above to get started.</p>
      </div>
    );
  }

  return (
    <div
      className="gap-6 [column-fill:_balance] sm:columns-2 lg:columns-3 xl:columns-4"
      style={{
        // Fallback for browsers that might not support the Tailwind utility perfectly
        columnGap: '1.5rem',
      }}
    >
      {resources.map(resource => (
        <div key={resource.id} className="mb-6 break-inside-avoid">
          <ResourceCard resource={resource} />
        </div>
      ))}
    </div>
  );
};

export default ResourceGrid;
