// app/components/goal/ResourceGrid.tsx
'use client';

import { Resource } from '@/types';
import React from 'react';
import { FiInbox } from 'react-icons/fi';
import Masonry from 'react-masonry-css';
import ResourceCard from './ResourceCard';

interface ResourceGridProps {
  resources: Resource[];
  onResourceClick: (resource: Resource) => void;
}

const breakpointColumnsObj = {
  default: 4,
  1100: 3,
  700: 2,
  500: 1,
};

const ResourceGrid: React.FC<ResourceGridProps> = ({ resources, onResourceClick }) => {
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
    <Masonry
      breakpointCols={breakpointColumnsObj}
      className="flex -ml-6 w-auto"
      columnClassName="pl-6 bg-clip-padding"
    >
      {resources.map(resource => (
        <div key={resource.id} className="mb-6" onClick={() => onResourceClick(resource)}>
          <ResourceCard resource={resource} />
        </div>
      ))}
    </Masonry>
  );
};

export default ResourceGrid;
