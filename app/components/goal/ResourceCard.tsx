// app/components/goal/ResourceCard.tsx
'use client';

import { useGoalStore } from '@/store/useGoalStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { Resource, ResourceType } from '@/types';
import Image from 'next/image';
import React, { useState } from 'react';
import {
  FiAlertTriangle,
  FiEdit,
  FiFileText,
  FiImage,
  FiLink,
  FiTrash2,
  FiVideo,
} from 'react-icons/fi';
import AddResourceModal from './AddResourceModal'; // Re-use the modal for editing

const ResourceCard: React.FC<{ resource: Resource }> = ({ resource }) => {
  const { deleteResource } = useGoalStore();
  const { showConfirmation } = useNotificationStore();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the viewer
    showConfirmation({
      title: 'Delete Resource?',
      message: `Are you sure you want to delete "${resource.title}"? This action cannot be undone.`,
      action: () => deleteResource(resource.id),
    });
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the viewer
    setIsEditModalOpen(true);
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return '';
    }
  };

  const Icon =
    resource.type === ResourceType.IMAGE
      ? FiImage
      : resource.type === ResourceType.VIDEO
        ? FiVideo
        : resource.type === ResourceType.ARTICLE
          ? FiFileText
          : resource.type === ResourceType.OTHER
            ? FiLink
            : FiAlertTriangle;

  return (
    <>
      <div className="flex flex-col bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:border-white/20">
        {/* Main Content Area - Clickable to open the viewer */}
        <div className="flex-grow cursor-pointer">
          {resource.type === ResourceType.IMAGE ? (
            <div className="relative w-full h-48 group">
              <Image
                src={resource.url}
                alt={resource.title}
                layout="fill"
                objectFit="cover"
                className="w-full h-full"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t via-transparent to-transparent from-black/80"></div>
              <div className="absolute right-0 bottom-0 left-0 p-4">
                <p className="font-semibold text-white truncate drop-shadow-lg">{resource.title}</p>
              </div>
            </div>
          ) : (
            <div className="p-4">
              <p className="font-semibold text-white">{resource.title}</p>
              <p className="mt-2 text-xs text-white/50">{getDomain(resource.url)}</p>
            </div>
          )}
        </div>

        {/* Action Footer with always-visible buttons */}
        <div className="flex gap-2 justify-between items-center p-2 border-t bg-black/20 border-white/10">
          <div>
            <Icon className="w-5 h-5 text-blue-400" title={resource.type} />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              className="p-2 rounded-md transition-colors cursor-pointer text-white/70 hover:bg-white/10 hover:text-white"
              title="Edit Resource"
            >
              <FiEdit size={16} />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 rounded-md transition-colors cursor-pointer text-red-400/70 hover:bg-red-500/20 hover:text-red-400"
              title="Delete Resource"
            >
              <FiTrash2 size={16} />
            </button>
          </div>
        </div>
      </div>
      <AddResourceModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        resourceToEdit={resource}
      />
    </>
  );
};

export default ResourceCard;
