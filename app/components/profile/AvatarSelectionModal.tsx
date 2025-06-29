// app/components/profile/AvatarSelectionModal.tsx
'use client';

import { User } from 'firebase/auth';
import Image from 'next/image';
import React, { useMemo, useState } from 'react';
import { FiCheck, FiLoader, FiX } from 'react-icons/fi';

interface AvatarSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAvatarSelect: (avatarUrl: string) => Promise<void>;
  currentUser: User;
  // Change prop name to showToast to match the new convention from useNotificationStore
  showToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

const basePath = '/one-goal';

// Updated list of avatars based on your provided filenames.
const customAvatarFiles = [
  'bicycle.jpg',
  'book.jpg',
  'calculator.jpg',
  'cat.jpg',
  'coffee2.jpg',
  'flower2.jpg',
  'gamepad.jpg',
  'guitar2.jpg',
  'headphones.jpg',
  'hummingbird.jpg',
  'mountain.jpg',
  'plane.jpg',
  'surfer.jpg',
  'tomatoes.jpg',
  'tree.jpg',
];

const AvatarSelectionModal: React.FC<AvatarSelectionModalProps> = ({
  isOpen,
  onClose,
  onAvatarSelect,
  currentUser,
  showToast, // Destructure showToast from props
}) => {
  const [selectedAvatar, setSelectedAvatar] = useState<string>(currentUser.photoURL || '');
  const [isSaving, setIsSaving] = useState(false);

  // Get the original Google photo URL to allow reverting to default
  const originalGooglePhoto = useMemo(() => {
    const googleProvider = currentUser.providerData.find(p => p.providerId === 'google.com');
    return googleProvider?.photoURL || null;
  }, [currentUser.providerData]);

  // Combine custom avatars and the original Google avatar into one list
  const avatarOptions = useMemo(() => {
    const options = customAvatarFiles.map(file => ({
      type: 'custom',
      url: `${basePath}/avatars/${file}`,
      name: file.split('.')[0], // e.g., 'cat'
    }));

    if (originalGooglePhoto) {
      options.unshift({
        type: 'google',
        url: originalGooglePhoto,
        name: 'Default',
      });
    }

    return options;
  }, [originalGooglePhoto]);

  const handleSave = async () => {
    // Prevent saving if the selection hasn't changed
    if (selectedAvatar === currentUser.photoURL) {
      onClose();
      return;
    }
    setIsSaving(true);
    try {
      await onAvatarSelect(selectedAvatar);
      showToast('Profile image updated successfully. Refreshing...', 'success'); // Use showToast prop
      setTimeout(() => window.location.reload(), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    // The definitive fix: Increased z-index to a very high value (z-[100])
    // to ensure it is on top of all other stacking contexts, including the sticky navbar.
    <div
      className="flex fixed inset-0 justify-center items-center p-4 backdrop-blur-sm z-100 bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-white/[0.05] backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl w-full max-w-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Choose Your Avatar</h2>
          <button
            className="p-1.5 text-white/60 rounded-full hover:bg-white/10 hover:text-white cursor-pointer"
            onClick={onClose}
            aria-label="Close modal"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <p className="mb-6 text-center text-white/70">
            Select a new profile picture from the options below.
          </p>
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5">
            {avatarOptions.map(avatar => (
              <div key={avatar.url} className="flex flex-col items-center">
                <button
                  onClick={() => setSelectedAvatar(avatar.url)}
                  className={`relative p-1 rounded-full transition-all duration-200 aspect-square w-24 h-24 cursor-pointer
                    ${selectedAvatar === avatar.url ? 'ring-2 ring-blue-500' : 'ring-2 ring-transparent'}`}
                >
                  <Image
                    src={avatar.url}
                    alt={`Avatar: ${avatar.name}`}
                    width={100}
                    height={100}
                    className="object-cover w-full h-full rounded-full"
                    onError={e => {
                      // Fallback for image loading errors: display first letter of name
                      e.currentTarget.src = `https://placehold.co/100x100/1a1a1a/ffffff?text=${avatar.name.charAt(0).toUpperCase()}`;
                    }}
                  />
                  {selectedAvatar === avatar.url && (
                    <div className="flex absolute inset-0 justify-center items-center rounded-full bg-blue-500/50">
                      <FiCheck className="w-8 h-8 text-white" />
                    </div>
                  )}
                </button>
                <span className="mt-2 text-xs text-center capitalize text-white/80">
                  {avatar.name.replace(/2/g, '')}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-white/10">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex gap-2 justify-center items-center px-6 py-3 w-full text-lg font-semibold text-black bg-white rounded-full transition-all duration-200 hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-60 cursor-pointer"
          >
            {isSaving ? (
              <>
                <FiLoader className="w-5 h-5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <FiCheck />
                <span>Confirm Selection</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarSelectionModal;
