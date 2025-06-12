/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/NavBar.tsx

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

import { User } from 'firebase/auth';

import Link from 'next/link';

import { useRouter } from 'next/navigation';

import Image from 'next/image';

import { FiDownload, FiUpload, FiLogOut, FiHome, FiList, FiCheckSquare } from 'react-icons/fi';

import { FcGoogle } from 'react-icons/fc';

// Import services directly as NavBar is now isolated

import { firebaseService } from '@/services/firebaseService';

import { localStorageService } from '@/services/localStorageService';

import { AppMode, AppState } from '@/types';

import { FirebaseServiceError } from '@/utils/errors';

// Import components directly as NavBar is isolated

import ToastMessage from './ToastMessage';

import ConfirmationModal from './ConfirmationModal';

import { MdRocketLaunch } from 'react-icons/md';

import { GoStopwatch } from 'react-icons/go';

import { LuBadgeInfo } from 'react-icons/lu';
import { FaRegCircleUser } from 'react-icons/fa6';

const NavBar: React.FC = () => {
  const router = useRouter();

  // Internal state for NavBar

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [appMode, setAppMode] = useState<AppMode>('none');

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // State for internal toast messages

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  // State for internal Confirmation Modal

  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);

  const [confirmationMessage, setConfirmationMessage] = useState('');

  const [confirmationTitle, setConfirmationTitle] = useState('');

  const [confirmationAction, setConfirmationAction] = useState<(() => void) | null>(null);

  const showMessage = useCallback((text: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(text);

    setToastType(type);

    setTimeout(() => {
      setToastMessage(null);
    }, 6000);
  }, []);

  // Callbacks for internal Confirmation Modal

  const openConfirmationModal = useCallback(
    (title: string, message: string, action: () => void) => {
      setConfirmationTitle(title);

      setConfirmationMessage(message);

      setConfirmationAction(() => action);

      setIsConfirmationModalOpen(true);
    },

    []
  );

  const closeConfirmationModal = useCallback(() => {
    setIsConfirmationModalOpen(false);

    setConfirmationAction(null);
  }, []);

  const handleConfirmation = useCallback(async () => {
    // Made async

    if (confirmationAction) {
      await confirmationAction(); // Await the action
    }

    // closeConfirmationModal() is now handled by the performImportAction itself

    // and similar actions to ensure it closes only after completion.
  }, [confirmationAction]);

  // Effect to manage auth state and app mode

  useEffect(() => {
    const unsubscribeAuth = firebaseService.onAuthChange(user => {
      if (user) {
        setCurrentUser(user);

        setAppMode('google');

        localStorageService.setAppModeInLocalStorage('google');
      } else {
        setCurrentUser(null);

        const storedAppMode = localStorageService.getAppModeFromLocalStorage();

        if (storedAppMode === 'guest') {
          setAppMode('guest');
        } else {
          setAppMode('none');

          localStorageService.clearAppModeFromLocalStorage();
        }
      }
    });

    localStorageService.initializeAppMode();

    setAppMode(localStorageService.getAppModeFromLocalStorage());

    return () => unsubscribeAuth();
  }, []);

  // Close dropdown when clicking outside

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(prev => !prev);
  };

  // --- Internal Handlers for NavBar Operations ---

  const handleSignOut = useCallback(async () => {
    try {
      if (appMode === 'google') {
        await firebaseService.signOutUser();

        showMessage('Signed out successfully!', 'success');
      } else if (appMode === 'guest') {
        showMessage('Guest session ended. Local data remains.', 'info');
      }

      setAppMode('none');

      router.replace('/login');
    } catch (error: any) {
      showMessage(`Sign-out error: ${error.message || 'Unknown error'}`, 'error');
    } finally {
      setIsProfileDropdownOpen(false);
    }
  }, [appMode, showMessage, router]);

  const handleSignInWithGoogle = useCallback(async () => {
    try {
      router.push('/login');
    } catch (error: any) {
      let errorMessage = 'Sign-in failed. Please try again.';

      if (error instanceof FirebaseServiceError) {
        const originalFirebaseError = (error.originalError as any)?.code;

        if (originalFirebaseError === 'auth/popup-closed-by-user') {
          errorMessage = 'Sign-in cancelled.';
        } else {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      showMessage(errorMessage, 'error');
    } finally {
      setIsProfileDropdownOpen(false);
    }
  }, [showMessage, router]);

  const handleImport = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (!file) {
        event.target.value = '';

        return;
      }

      const reader = new FileReader();

      reader.onload = async e => {
        try {
          const importedRawData = JSON.parse(e.target?.result as string);

          // Basic validation for imported data structure

          if (
            typeof importedRawData !== 'object' ||
            importedRawData === null ||
            !(
              'goal' in importedRawData ||
              'notToDoList' in importedRawData ||
              'contextItems' in importedRawData ||
              'toDoList' in importedRawData
            )
          ) {
            showMessage(
              "Invalid backup file format. Please ensure it's a 'One Goal' backup.",

              'error'
            );

            return;
          }

          let currentData: AppState | null = null;

          if (appMode === 'google' && currentUser) {
            currentData = await firebaseService.loadUserData(currentUser.uid);
          } else if (appMode === 'guest') {
            currentData = localStorageService.loadLocalState();
          }

          const hasExistingData =
            currentData &&
            (currentData.goal !== null ||
              currentData.notToDoList.length > 0 ||
              currentData.contextItems.length > 0 ||
              currentData.toDoList.length > 0);

          const performImportAction = async () => {
            // Logic to perform the actual import (save data)

            if (appMode === 'google' && currentUser) {
              await firebaseService.saveUserData(currentUser.uid, importedRawData as AppState);

              showMessage(
                'Firebase data imported and updated! Please refresh the page to see changes.',

                'success'
              );
            } else if (appMode === 'guest') {
              localStorageService.saveLocalState(importedRawData as AppState);

              showMessage(
                'Guest data imported successfully to local storage! Please refresh the page to see changes.',

                'success'
              );
            } else {
              showMessage('Please sign in or continue as guest to import data.', 'info');
            }

            closeConfirmationModal(); // Close confirmation modal AFTER import action completes
          };

          if (hasExistingData) {
            openConfirmationModal(
              'Overwrite Existing Data?',

              'Importing new data will overwrite your current goals and lists. This action cannot be undone. Are you sure you want to proceed?',

              performImportAction
            );
          } else {
            await performImportAction(); // No existing data, proceed directly
          }
        } catch (error: any) {
          showMessage(`Failed to import data: ${error.message || 'Invalid file format'}`, 'error');
        } finally {
          event.target.value = ''; // Clear file input

          setIsProfileDropdownOpen(false); // Close dropdown

          // The closeConfirmationModal() is now handled by performImportAction
        }
      };

      reader.readAsText(file);
    },

    [appMode, currentUser, showMessage, openConfirmationModal, closeConfirmationModal]
  );

  const handleExport = useCallback(async () => {
    try {
      let dataToExport: AppState | null = null;

      if (appMode === 'google' && currentUser) {
        dataToExport = await firebaseService.loadUserData(currentUser.uid);
      } else if (appMode === 'guest') {
        dataToExport = localStorageService.loadLocalState();
      }

      if (
        !dataToExport ||
        (!dataToExport.goal &&
          dataToExport.notToDoList.length === 0 &&
          dataToExport.contextItems.length === 0 &&
          dataToExport.toDoList.length === 0)
      ) {
        showMessage('No data to export!', 'info');

        return;
      }

      const serializableData = {
        ...dataToExport,

        goal: dataToExport.goal
          ? {
              ...dataToExport.goal,

              startDate: dataToExport.goal.startDate.toDate().toISOString(),

              endDate: dataToExport.goal.endDate.toDate().toISOString(),
            }
          : null,
      };

      const dataStr = JSON.stringify(serializableData, null, 2);

      const dataBlob = new Blob([dataStr], { type: 'application/json' });

      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');

      link.href = url;

      link.download = `one-goal-backup-<span class="math-inline">\{appMode \=\=\= 'google' ? 'firebase' \: 'guest'\}\-</span>{new Date().toISOString().split('T')[0]}.json`;

      link.click();

      URL.revokeObjectURL(url);

      showMessage('Data exported successfully!', 'success');
    } catch (error: any) {
      showMessage(`Failed to export data: ${error.message || 'Unknown error'}`, 'error');
    } finally {
      setIsProfileDropdownOpen(false);
    }
  }, [appMode, currentUser, showMessage]);

  const handleMenuItemClick = (action: () => void) => {
    action();

    setIsProfileDropdownOpen(false);
  };

  // Determine display name and avatar based on appMode

  const displayUserName =
    appMode === 'google' && currentUser
      ? currentUser.displayName || currentUser.email?.split('@')[0] || 'Google User'
      : appMode === 'guest'
        ? 'Guest User'
        : '';

  // Conditionally render Image or fallback div

  const UserAvatar = () => {
    if (appMode === 'google' && currentUser?.photoURL) {
      return (
        <Image
          src={currentUser.photoURL}
          alt="User Avatar"
          width={32}
          height={32}
          className="rounded-full"
        />
      );
    } else {
      const initial = displayUserName.charAt(0).toUpperCase() || '?';

      return (
        <div
          className={`flex justify-center items-center w-8 h-8 text-sm font-semibold rounded-full ${appMode === 'guest' ? 'text-white/70 bg-white/20' : 'text-white/70 bg-gray-600'}`}
        >
          {initial}
        </div>
      );
    }
  };

  // Determine if profile dropdown button should be clickable/visible

  const showProfileDropdownButton = appMode !== 'none';

  const navLinkClasses =
    'flex items-center gap-2 px-3 py-2 text-white/80 font-medium rounded-md transition-colors duration-200 hover:bg-white/10';

  return (
    <>
      <nav className="flex sticky top-0 z-20 justify-between items-center px-4 py-2 border-b shadow-lg backdrop-blur-md bg-black/50 border-white/10">
        <Link href="/dashboard">
          <MdRocketLaunch size={30} className="text-white" />
        </Link>

        {/* Navigation Links (Middle - Always visible, text hidden on small) */}

        <div className="flex gap-1 text-sm sm:gap-2 md:gap-4">
          <Link href="/dashboard" passHref className={navLinkClasses}>
            <FiHome className="w-5 h-5" /> <span className="hidden md:block">Dashboard</span>
          </Link>

          <Link href="/todo" passHref className={navLinkClasses}>
            <FiCheckSquare className="w-5 h-5" /> <span className="hidden md:block">To-Do</span>
          </Link>

          <Link href="/stop-watch" passHref className={navLinkClasses}>
            <GoStopwatch className="w-5 h-5" /> <span className="hidden md:block">Stopwatch</span>
          </Link>

          <Link href="/list" passHref className={navLinkClasses}>
            <FiList className="w-5 h-5" /> <span className="hidden md:block">Lists</span>
          </Link>
        </div>

        {/* User Profile and Dropdown (Right Side) */}

        <div className="relative" ref={profileDropdownRef}>
          {showProfileDropdownButton ? (
            <button
              onClick={toggleProfileDropdown}
              className="bg-white/[0.05] cursor-pointer rounded-full border border-white/10 shadow-lg transition-colors duration-200 hover:bg-white/10"
              aria-haspopup="true"
              aria-expanded={isProfileDropdownOpen}
            >
              <UserAvatar />
            </button>
          ) : (
            <span className="hidden md:block"></span>
          )}

          {/* Profile Dropdown Menu */}

          {isProfileDropdownOpen && showProfileDropdownButton && (
            <div className="absolute right-0 z-30 py-2 mt-2 rounded-lg border shadow-xl backdrop-blur-2xl min-w-56 animate-fade-in-down bg-[#181818] border-white/10">
              <button className="flex gap-3 items-center px-4 py-2 w-full text-left transition-colors duration-200 cursor-pointer text-white/90 hover:bg-white/10">
                <FaRegCircleUser className="w-5 h-5" /> {displayUserName}
              </button>

              <hr className="my-1 border-white/10" />

              {appMode === 'guest' ? (
                <>
                  <button
                    className="flex gap-3 items-center px-4 py-2 w-full text-left transition-colors duration-200 text-white/90 hover:bg-white/10"
                    onClick={() => handleMenuItemClick(handleSignInWithGoogle)}
                  >
                    <FcGoogle size={20} /> Sign In with Google
                  </button>

                  <hr className="my-1 border-white/10" />
                </>
              ) : null}

              <input
                type="file"
                id="navImportFile"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleImport}
              />

              <button
                className="flex gap-3 items-center px-4 py-2 w-full text-left transition-colors duration-200 cursor-pointer text-white/90 hover:bg-white/10"
                onClick={() => document.getElementById('navImportFile')?.click()}
              >
                <FiUpload className="w-5 h-5" /> Import Data
              </button>

              <button
                className="flex gap-3 items-center px-4 py-2 w-full text-left transition-colors duration-200 cursor-pointer text-white/90 hover:bg-white/10"
                onClick={() => handleMenuItemClick(handleExport)}
              >
                <FiDownload className="w-5 h-5" /> Export Data
              </button>

              <hr className="my-1 border-white/10" />

              <Link
                className="flex gap-3 items-center px-4 py-2 w-full text-left transition-colors duration-200 cursor-pointer text-white/90 hover:bg-white/10"
                href="/"
              >
                <LuBadgeInfo className="w-5 h-5" /> About
              </Link>

              <hr className="my-1 border-white/10" />

              <button
                className="flex gap-3 items-center px-4 py-2 w-full text-left text-red-400 transition-colors duration-200 cursor-pointer hover:bg-red-500/10"
                onClick={() => handleMenuItemClick(handleSignOut)}
              >
                <FiLogOut className="w-5 h-5" /> Logout
              </button>
            </div>
          )}
        </div>

        <style jsx>{`
          @keyframes fade-in-down {
            from {
              opacity: 0;

              transform: translateY(-10px);
            }

            to {
              opacity: 1;

              transform: translateY(0);
            }
          }

          .animate-fade-in-down {
            animation: fade-in-down 0.2s ease-out forwards;
          }
        `}</style>
      </nav>

      {/* Toast Message for NavBar operations only */}

      <ToastMessage message={toastMessage} type={toastType} duration={5000} />

      {/* Confirmation Modal for NavBar operations only */}

      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={closeConfirmationModal}
        message={confirmationMessage}
        title={confirmationTitle}
        cancelButton={{
          text: 'Cancel',

          onClick: closeConfirmationModal,

          className: 'btn-secondary',
        }}
        confirmButton={{
          text: 'Confirm',

          onClick: handleConfirmation,

          className: 'btn-primary bg-red-500 hover:bg-red-600 focus:ring-red-400',
        }}
      />
    </>
  );
};

export default NavBar;
