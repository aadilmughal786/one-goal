// app/components/goal/ResourceViewer.tsx
'use client';

import { Resource, ResourceType } from '@/types';
import Image from 'next/image';
import React from 'react';
import {
  FiAlertTriangle,
  FiArrowRight,
  FiExternalLink,
  FiFile,
  FiFileText,
  FiImage,
  FiLink,
  FiMusic,
  FiVideo,
  FiX,
} from 'react-icons/fi';

interface ResourceViewerProps {
  resource: Resource | null;
  onClose: () => void;
}

const ResourceViewer: React.FC<ResourceViewerProps> = ({ resource, onClose }) => {
  if (!resource) return null;

  const getYoutubeEmbedUrl = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  const getVimeoEmbedUrl = (url: string) => {
    const regExp =
      /https?:\/\/(?:www\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
    const match = url.match(regExp);
    return match ? `https://player.vimeo.com/video/${match[3]}` : null;
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'Invalid URL';
    }
  };

  const typeInfo = {
    [ResourceType.IMAGE]: { icon: FiImage, label: 'Image' },
    [ResourceType.VIDEO]: { icon: FiVideo, label: 'Video' },
    [ResourceType.ARTICLE]: { icon: FiFileText, label: 'Article' },
    [ResourceType.AUDIO]: { icon: FiMusic, label: 'Audio' },
    [ResourceType.DOC]: { icon: FiFile, label: 'Document' },
    [ResourceType.OTHER]: { icon: FiLink, label: 'Link' },
  };

  const { icon: TypeIcon, label: typeLabel } = typeInfo[resource.type] || {
    icon: FiAlertTriangle,
    label: 'Unknown',
  };

  const renderContent = () => {
    switch (resource.type) {
      case ResourceType.IMAGE:
        return (
          <div className="relative w-full h-full max-w-full max-h-[80vh] aspect-video overflow-hidden rounded-lg">
            <Image
              src={resource.url}
              alt={resource.title}
              layout="fill"
              objectFit="contain"
              className="rounded-lg"
              unoptimized
            />
            <div className="absolute right-0 bottom-0 left-0 p-4 bg-gradient-to-t to-transparent from-black/80">
              <h3 className="text-lg font-bold text-white drop-shadow-md">{resource.title}</h3>
            </div>
          </div>
        );
      case ResourceType.VIDEO:
        const youtubeUrl = getYoutubeEmbedUrl(resource.url);
        if (youtubeUrl) {
          return (
            <iframe
              width="560"
              height="315"
              src={youtubeUrl}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full rounded-lg aspect-video"
            ></iframe>
          );
        }
        const vimeoUrl = getVimeoEmbedUrl(resource.url);
        if (vimeoUrl) {
          return (
            <iframe
              src={vimeoUrl}
              width="640"
              height="360"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              className="w-full rounded-lg aspect-video"
            ></iframe>
          );
        }
        return (
          <div className="p-4 text-center text-white/70">
            <FiVideo className="mx-auto mb-4 text-4xl" />
            <p>Unsupported video provider.</p>
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center mt-2 text-blue-400 hover:underline"
            >
              Watch on original site <FiExternalLink className="ml-1" />
            </a>
          </div>
        );
      case ResourceType.ARTICLE:
      case ResourceType.AUDIO:
      case ResourceType.DOC:
      case ResourceType.OTHER:
        return (
          <div className="flex flex-col justify-between p-8 h-full">
            <div>
              <h3 className="mb-2 text-2xl font-bold text-white">{resource.title}</h3>
              <p className="text-sm text-gray-400 break-all">{getDomain(resource.url)}</p>
            </div>
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex gap-2 justify-center items-center px-6 py-3 mt-8 font-semibold text-black bg-white rounded-full"
            >
              Visit Link <FiArrowRight />
            </a>
          </div>
        );
      default:
        return (
          <div className="p-4 text-center text-white/70">
            <FiLink className="mx-auto mb-4 text-4xl" />
            <p>Unsupported resource type.</p>
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center mt-2 text-blue-400 hover:underline"
            >
              Visit the link directly <FiExternalLink className="ml-1" />
            </a>
          </div>
        );
    }
  };

  return (
    <div
      className="flex fixed inset-0 z-50 justify-center items-center p-4 backdrop-blur-sm bg-black/60 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-2xl bg-white/[0.05] backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <div className="flex gap-3 items-center font-semibold text-white">
            <TypeIcon size={20} />
            <span>{typeLabel}</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 rounded-full transition-colors cursor-pointer hover:bg-white/10 hover:text-white"
            aria-label="Close viewer"
          >
            <FiX size={20} />
          </button>
        </div>
        <div className="p-4">{renderContent()}</div>
      </div>
    </div>
  );
};

export default ResourceViewer;
