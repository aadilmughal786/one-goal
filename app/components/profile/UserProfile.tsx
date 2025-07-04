// app/components/profile/UserProfile.tsx
'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { format as formatDate } from 'date-fns';
import Image from 'next/image';
import React from 'react';
import { FiEdit } from 'react-icons/fi';

interface UserProfileTabProps {
  onAvatarModalOpen: () => void;
}

const UserProfileTab: React.FC<UserProfileTabProps> = ({ onAvatarModalOpen }) => {
  const { currentUser } = useAuthStore();

  if (!currentUser) return null;

  return (
    <div className="space-y-8">
      <div className="card">
        <div className="flex flex-col gap-6 items-center text-center">
          <div className="relative group">
            <Image
              src={currentUser.photoURL || `https://placehold.co/120x120/1a1a1a/ffffff?text=U`}
              alt="Profile picture"
              width={120}
              height={120}
              className="rounded-full border-2 border-border-secondary"
            />
            <button
              onClick={onAvatarModalOpen}
              className="flex absolute inset-0 justify-center items-center text-white rounded-full opacity-0 transition-opacity duration-300 cursor-pointer bg-black/50 group-hover:opacity-100"
              aria-label="Change profile picture"
            >
              <FiEdit size={32} />
            </button>
          </div>
          <div className="flex-grow">
            <h1 className="text-2xl font-bold text-text-primary md:text-3xl">
              {currentUser.displayName || 'Anonymous User'}
            </h1>
            <p className="mt-2 text-text-secondary">{currentUser.email}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-6 text-2xl font-bold text-text-primary">Account Information</h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2">
            <span className="text-text-secondary">User ID</span>
            <span className="font-mono text-sm text-text-tertiary">{currentUser.uid}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-text-secondary">Account Created</span>
            <span className="text-text-tertiary">
              {currentUser.metadata.creationTime
                ? formatDate(new Date(currentUser.metadata.creationTime), 'MMM d, yyyy')
                : 'Unknown'}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-text-secondary">Last Sign In</span>
            <span className="text-text-tertiary">
              {currentUser.metadata.lastSignInTime
                ? formatDate(new Date(currentUser.metadata.lastSignInTime), 'MMM d, yyyy')
                : 'Unknown'}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-text-secondary">Email Verified</span>
            <span className={`${currentUser.emailVerified ? 'text-green-400' : 'text-red-400'}`}>
              {currentUser.emailVerified ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileTab;
