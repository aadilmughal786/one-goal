// app/components/goal/ResourceCard.tsx
'use client';

import { Resource, ResourceType } from '@/types';
import Image from 'next/image';
import React from 'react';
import {
  FiAlertTriangle,
  FiFile,
  FiFileText,
  FiImage,
  FiLink,
  FiMusic,
  FiVideo,
} from 'react-icons/fi';

const ResourceCard: React.FC<{ resource: Resource; onClick: () => void }> = ({
  resource,
  onClick,
}) => {
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
          : resource.type === ResourceType.AUDIO
            ? FiMusic
            : resource.type === ResourceType.DOC
              ? FiFile
              : resource.type === ResourceType.OTHER
                ? FiLink
                : FiAlertTriangle;

  return (
    <button
      onClick={onClick}
      className="flex overflow-hidden relative flex-col w-full h-full text-left rounded-xl border shadow-lg backdrop-blur-sm transition-all duration-300 cursor-pointer bg-bg-secondary border-border-primary hover:border-border-secondary"
    >
      {resource.type === ResourceType.IMAGE ? (
        <div className="relative w-full h-48">
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
        <div className="flex flex-col justify-center p-4 h-24">
          <p className="font-semibold text-text-primary line-clamp-2">{resource.title}</p>
          <p className="mt-1 text-xs truncate text-text-muted">{getDomain(resource.url)}</p>
        </div>
      )}

      <div
        className="flex absolute top-3 right-3 justify-center items-center p-2 rounded-full backdrop-blur-sm bg-black/50"
        title={resource.type}
      >
        <Icon className="w-4 h-4 text-white" />
      </div>
    </button>
  );
};

export default ResourceCard;
