// app/components/nav/ProfileDropdown.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { User } from 'firebase/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FiDownload, FiUpload, FiLogOut } from 'react-icons/fi';
import { LuBadgeInfo } from 'react-icons/lu';
import { firebaseService } from '@/services/firebaseService';
import ToastMessage from '@/components/ToastMessage';
import ConfirmationModal from '@/components/ConfirmationModal';

interface ProfileDropdownProps {
  user: User;
  onClose: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ user, onClose }) => {
  const router = useRouter();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const [confirmationState, setConfirmationState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: (() => void) | null;
  }>({ isOpen: false, title: '', message: '', action: null });

  const showMessage = useCallback((text: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(text);
    setToastType(type);
  }, []);

  const openConfirmationModal = (title: string, message: string, action: () => void) => {
    setConfirmationState({ isOpen: true, title, message, action });
  };

  const closeConfirmationModal = () => {
    setConfirmationState({ isOpen: false, title: '', message: '', action: null });
  };

  const handleSignOut = async () => {
    try {
      await firebaseService.signOutUser();
      router.push('/login');
    } catch (error) {
      showMessage(`Sign-out error: ${(error as Error).message}`, 'error');
    }
  };

  const handleExport = async () => {
    try {
      const appState = await firebaseService.getUserData(user.uid);
      const serializableData = firebaseService.serializeForExport(appState);
      const dataStr = JSON.stringify(serializableData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `one-goal-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showMessage('Data exported successfully.', 'success');
    } catch (error) {
      showMessage(`Failed to export data: ${(error as Error).message}`, 'error');
    }
    onClose();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async e => {
      try {
        const importedRawData = JSON.parse(e.target?.result as string);
        const appState = firebaseService.deserializeForImport(importedRawData);
        const action = async () => {
          await firebaseService.setUserData(user.uid, appState);
          showMessage('Data imported successfully. Refreshing...', 'success');
          setTimeout(() => window.location.reload(), 2000);
          closeConfirmationModal();
        };
        openConfirmationModal(
          'Overwrite All Data?',
          'Importing will replace all your current data. This action cannot be undone.',
          action
        );
      } catch (error) {
        showMessage(`Import failed: ${(error as Error).message}`, 'error');
      }
    };
    reader.readAsText(file);
    onClose();
  };

  return (
    <>
      <ToastMessage message={toastMessage} type={toastType} />
      <ConfirmationModal
        isOpen={confirmationState.isOpen}
        onClose={closeConfirmationModal}
        title={confirmationState.title}
        message={confirmationState.message}
        confirmButton={{
          text: 'Confirm',
          onClick: confirmationState.action || (() => {}),
          className: 'bg-red-600 hover:bg-red-700',
        }}
        cancelButton={{ text: 'Cancel', onClick: closeConfirmationModal }}
      />
      <div className="absolute right-0 z-30 py-2 mt-2 w-64 rounded-xl border shadow-2xl backdrop-blur-2xl bg-[#181818]/80 border-white/10 animate-fade-in-down">
        <div className="flex gap-3 items-center px-4 py-3 border-b border-white/10">
          <Image
            src={user.photoURL!}
            alt="User Avatar"
            width={40}
            height={40}
            className="rounded-full"
          />
          <div className="text-sm">
            <p className="font-semibold text-white">{user.displayName}</p>
            <p className="text-white/60">{user.email}</p>
          </div>
        </div>
        <div className="py-2">
          <input
            type="file"
            id="navImportFile"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImport}
          />
          <label
            htmlFor="navImportFile"
            className="flex gap-3 items-center px-4 py-2 transition-colors cursor-pointer text-white/90 hover:bg-white/10"
          >
            <FiUpload /> Import Data
          </label>
          <button
            onClick={handleExport}
            className="flex gap-3 items-center px-4 py-2 w-full text-left transition-colors cursor-pointer text-white/90 hover:bg-white/10"
          >
            <FiDownload /> Export Data
          </button>
        </div>
        <hr className="border-white/10" />
        <div className="py-2">
          <Link
            href="/"
            className="flex gap-3 items-center px-4 py-2 transition-colors cursor-pointer text-white/90 hover:bg-white/10"
            onClick={onClose}
          >
            <LuBadgeInfo /> About Page
          </Link>
          <button
            onClick={handleSignOut}
            className="flex gap-3 items-center px-4 py-2 w-full text-left text-red-400 transition-colors cursor-pointer hover:bg-red-500/10"
          >
            <FiLogOut /> Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default ProfileDropdown;
