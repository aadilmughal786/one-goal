// app/components/resources/ResourceCard.tsx
'use client';

import { useGoalStore } from '@/store/useGoalStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { Resource, ResourceType } from '@/types';
import Image from 'next/image';
import React, { useState } from 'react';
import { FiAlertTriangle, FiEdit, FiExternalLink, FiImage, FiLink, FiTrash2 } from 'react-icons/fi';
import AddResourceModal from './AddResourceModal'; // Re-use the modal for editing

const ResourceCard: React.FC<{ resource: Resource }> = ({ resource }) => {
  const { deleteResource } = useGoalStore();
  const { showConfirmation } = useNotificationStore();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleDelete = () => {
    showConfirmation({
      title: 'Delete Resource?',
      message: `Are you sure you want to delete "${resource.title}"? This action cannot be undone.`,
      action: () => deleteResource(resource.id),
    });
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  };

  const Icon =
    resource.type === ResourceType.IMAGE
      ? FiImage
      : resource.type === ResourceType.VIDEO
        ? FiExternalLink
        : resource.type === ResourceType.ARTICLE
          ? FiLink
          : FiAlertTriangle;

  return (
    <>
      <div className="group relative bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:border-white/20 hover:scale-[1.02]">
        {resource.type === ResourceType.IMAGE ? (
          <a href={resource.url} target="_blank" rel="noopener noreferrer">
            <Image
              src={resource.url}
              alt={resource.title}
              width={500}
              height={500}
              className="object-cover w-full h-auto"
              unoptimized // Use if images are from various external sources
            />
          </a>
        ) : (
          <a href={resource.url} target="_blank" rel="noopener noreferrer" className="block p-4">
            <div className="flex gap-3 items-center mb-2">
              <Icon className="w-5 h-5 text-blue-400" />
              <span className="text-xs font-semibold tracking-wider text-blue-400 uppercase">
                {resource.type}
              </span>
            </div>
            <p className="font-semibold text-white">{resource.title}</p>
            <p className="mt-3 text-xs text-white/50">{getDomain(resource.url)}</p>
          </a>
        )}

        <div className="flex absolute top-2 right-2 gap-2 p-1 rounded-full opacity-0 transition-opacity duration-300 bg-black/50 group-hover:opacity-100">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="p-2 rounded-full text-white/80 hover:bg-white/20"
            title="Edit Resource"
          >
            <FiEdit size={16} />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 rounded-full text-red-400/80 hover:bg-red-500/20"
            title="Delete Resource"
          >
            <FiTrash2 size={16} />
          </button>
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
