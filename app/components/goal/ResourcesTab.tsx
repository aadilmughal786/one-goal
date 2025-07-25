// app/components/goal/ResourcesTab.tsx
'use client';

import React, { useMemo, useState } from 'react';
import {
  FiFile,
  FiFileText,
  FiGrid,
  FiImage,
  FiLink,
  FiMusic,
  FiPlus,
  FiSearch,
  FiVideo,
} from 'react-icons/fi';

import FilterDropdown, { FilterOption } from '@/components/common/FilterDropdown';
import NoActiveGoalMessage from '@/components/common/NoActiveGoalMessage';
import { useGoalStore } from '@/store/useGoalStore';
import { Resource, ResourceType } from '@/types';
import AddResourceModal from './AddResourceModal';
import ResourceGrid from './ResourceGrid';
import ResourceViewer from './ResourceViewer';

const resourceFilterOptions: FilterOption[] = [
  { value: 'all', label: 'All Types', icon: FiGrid },
  { value: ResourceType.IMAGE, label: 'Images', icon: FiImage },
  { value: ResourceType.VIDEO, label: 'Videos', icon: FiVideo },
  { value: ResourceType.ARTICLE, label: 'Articles', icon: FiFileText },
  { value: ResourceType.AUDIO, label: 'Audio', icon: FiMusic },
  { value: ResourceType.DOC, label: 'Documents', icon: FiFile },
  { value: ResourceType.OTHER, label: 'Other', icon: FiLink },
];

const ResourcesTab: React.FC = () => {
  const { appState } = useGoalStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  const activeGoal = useMemo(() => {
    if (!appState?.activeGoalId || !appState.goals) return null;
    return appState.goals[appState.activeGoalId];
  }, [appState]);

  const resources = useMemo(() => activeGoal?.resources || [], [activeGoal]);

  const filteredResources = useMemo(() => {
    return resources
      .filter(resource => {
        if (filterType === 'all') return true;
        return resource.type === filterType;
      })
      .filter(resource => {
        if (!searchQuery) return true;
        const lowerCaseQuery = searchQuery.toLowerCase();
        return resource.title.toLowerCase().includes(lowerCaseQuery);
      });
  }, [resources, searchQuery, filterType]);

  if (!activeGoal) {
    return <NoActiveGoalMessage />;
  }

  return (
    <div className="relative">
      <div className="pb-28">
        <ResourceGrid resources={filteredResources} onResourceClick={setSelectedResource} />
      </div>

      <div className="fixed right-0 bottom-0 left-16 z-20 p-4 border-t backdrop-blur-md bg-bg-primary/50 border-border-primary">
        <div className="flex flex-col gap-4 items-center mx-auto max-w-6xl sm:flex-row">
          <div className="flex-shrink-0">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex gap-2 items-center px-4 py-2 font-semibold rounded-full transition-all duration-200 cursor-pointer text-bg-primary bg-text-primary hover:opacity-90"
            >
              <FiPlus />
              Add Resource
            </button>
          </div>
          <div className="flex flex-col gap-4 w-full sm:flex-row sm:w-auto sm:flex-grow">
            <div className="relative flex-grow">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search resources..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="py-3 pr-4 pl-12 w-full rounded-full border text-text-primary border-border-primary bg-bg-secondary focus:outline-none focus:ring-2 focus:ring-border-accent"
              />
            </div>
            <FilterDropdown
              options={resourceFilterOptions}
              selectedValue={filterType}
              onSelect={setFilterType}
            />
          </div>
        </div>
      </div>

      <AddResourceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <ResourceViewer resource={selectedResource} onClose={() => setSelectedResource(null)} />
    </div>
  );
};

export default ResourcesTab;
