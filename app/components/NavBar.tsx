// src/components/NavBar.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { User } from 'firebase/auth';
import { FiTarget, FiDownload, FiUpload, FiPlusCircle, FiEdit, FiLogOut } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc'; // Import Google icon
import { AppMode } from '@/types'; // Import AppMode type

interface NavBarProps {
  currentUser: User | null;
  appMode: AppMode; // Changed from isGuestMode to appMode
  onSignOut: () => void;
  onNewGoal: () => void;
  onExport: () => void;
  onImport: () => void;
  onOpenDeveloperModal: () => void;
  onOpenGoalModal: () => void;
  onEditGoal: () => void;
  onSignInWithGoogleFromGuest: () => void; // For guest to Google sign-in
}

const NavBar: React.FC<NavBarProps> = ({
  currentUser,
  appMode, // Destructure new prop
  onSignOut,
  onNewGoal,
  onExport,
  onImport,
  onOpenDeveloperModal,
  onOpenGoalModal,
  onEditGoal,
  onSignInWithGoogleFromGuest,
}) => {
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

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

  const handleMenuItemClick = (action: () => void) => {
    action();
    setIsProfileDropdownOpen(false); // Close dropdown after selection
  };

  // Determine display name and avatar based on appMode
  let displayUserName = '';
  let userAvatarUrl = '';

  if (appMode === 'google' && currentUser) {
    displayUserName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Google User';
    userAvatarUrl =
      currentUser.photoURL ||
      `https://placehold.co/40x40/000000/FFFFFF?text=${displayUserName.charAt(0).toUpperCase()}`;
  } else if (appMode === 'guest') {
    displayUserName = 'Guest User';
    userAvatarUrl = `https://placehold.co/40x40/333333/CCCCCC?text=G`; // Generic guest avatar
  } else {
    // appMode === 'none' (or loading/redirecting)
    displayUserName = ''; // Or 'Loading...'
    userAvatarUrl = '';
  }

  // Determine if profile dropdown button should be clickable/visible
  const showProfileDropdownButton = appMode !== 'none'; // Show if in guest or google mode

  return (
    <nav className="flex sticky top-0 z-20 justify-between items-center p-4 bg-white rounded-b-xl border-b border-gray-100 shadow-lg">
      {/* Logo and App Title (Left Side) */}
      <div className="flex gap-3 items-center">
        <div className="flex justify-center items-center w-10 h-10 bg-gray-900 rounded-full shadow-md">
          <FiTarget className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Goal Tracker</h1>
      </div>

      {/* User Profile and Dropdown (Right Side) */}
      <div className="relative" ref={profileDropdownRef}>
        {showProfileDropdownButton ? (
          <button
            onClick={toggleProfileDropdown}
            className="flex gap-2 items-center px-3 py-2 bg-gray-50 rounded-full border border-gray-200 shadow-sm transition-colors duration-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
            aria-haspopup="true"
            aria-expanded={isProfileDropdownOpen}
          >
            {userAvatarUrl ? (
              <img
                src={userAvatarUrl}
                alt="User Avatar"
                className="w-8 h-8 rounded-full"
                onError={e => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = `https://placehold.co/40x40/000000/FFFFFF?text=${displayUserName.charAt(0).toUpperCase() || '?'}`;
                }}
              />
            ) : (
              // Fallback for avatar if userAvatarUrl is empty (e.g., during initial load)
              <div className="flex justify-center items-center w-8 h-8 text-sm font-semibold text-gray-600 bg-gray-300 rounded-full">
                ?
              </div>
            )}
            <span className="hidden text-sm font-medium text-gray-700 md:block">
              {displayUserName}
            </span>
          </button>
        ) : (
          // If appMode is 'none', render nothing on the right side
          <span className="hidden md:block"></span>
        )}

        {/* Profile Dropdown Menu */}
        {isProfileDropdownOpen && showProfileDropdownButton && (
          <div className="absolute right-0 z-30 py-2 mt-2 w-48 bg-white rounded-lg border border-gray-200 shadow-xl animate-fade-in-down">
            {appMode === 'guest' && ( // Only show "Sign In with Google" in guest mode
              <>
                <button
                  className="flex gap-3 items-center px-4 py-2 w-full text-left text-gray-700 transition-colors duration-200 hover:bg-gray-100"
                  onClick={() => handleMenuItemClick(onSignInWithGoogleFromGuest)}
                >
                  <FcGoogle size={20} /> Sign In with Google
                </button>
                <hr className="my-1 border-gray-100" />
              </>
            )}
            <button
              className="flex gap-3 items-center px-4 py-2 w-full text-left text-gray-700 transition-colors duration-200 hover:bg-gray-100"
              onClick={() => handleMenuItemClick(onImport)}
            >
              <FiUpload className="w-5 h-5" /> Import Data
            </button>
            <button
              className="flex gap-3 items-center px-4 py-2 w-full text-left text-gray-700 transition-colors duration-200 hover:bg-gray-100"
              onClick={() => handleMenuItemClick(onExport)}
            >
              <FiDownload className="w-5 h-5" /> Export Data
            </button>
            <hr className="my-1 border-gray-100" />
            <button
              className="flex gap-3 items-center px-4 py-2 w-full text-left text-gray-700 transition-colors duration-200 hover:bg-gray-100"
              onClick={() => handleMenuItemClick(onNewGoal)}
            >
              <FiPlusCircle className="w-5 h-5" /> New Goal
            </button>
            <button
              className="flex gap-3 items-center px-4 py-2 w-full text-left text-gray-700 transition-colors duration-200 hover:bg-gray-100"
              onClick={() => handleMenuItemClick(onEditGoal)}
            >
              <FiEdit className="w-5 h-5" /> Update Goal
            </button>
            <hr className="my-1 border-gray-100" />
            <button
              className="flex gap-3 items-center px-4 py-2 w-full text-left text-red-600 transition-colors duration-200 hover:bg-red-50"
              onClick={() => handleMenuItemClick(onSignOut)}
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
  );
};

export default NavBar;
