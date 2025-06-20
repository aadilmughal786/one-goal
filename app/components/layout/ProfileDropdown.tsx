// app/components/layout/ProfileDropdown.tsx
'use client';

import React, { useState } from 'react';
import { User } from 'firebase/auth'; // Import Firebase User type
import Link from 'next/link'; // Import Next.js Link for client-side navigation
import { useRouter } from 'next/navigation'; // Import Next.js useRouter
import Image from 'next/image'; // Import Next.js Image for optimized images
import { LuBadgeInfo } from 'react-icons/lu'; // Lucide icon for info badge
import { FiLogOut, FiSettings } from 'react-icons/fi'; // Feather icons for logout and settings
import { GoBug } from 'react-icons/go'; // Go icon for bug reporting
import { firebaseService } from '@/services/firebaseService'; // Import Firebase service for sign out
import ToastMessage from '@/components/common/ToastMessage'; // Import ToastMessage component for feedback
import { FaGithub, FaLinkedin } from 'react-icons/fa6'; // Font Awesome 6 icons for social links
import { MdArrowOutward } from 'react-icons/md'; // Material Design icon for external link indicator

interface ProfileDropdownProps {
  user: User; // The authenticated Firebase user object
  onClose: () => void; // Callback function to close the dropdown
}

/**
 * ProfileDropdown Component
 *
 * This component displays a dropdown menu for the authenticated user's profile.
 * It shows user information, navigation links to app settings/about, external links
 * to social profiles/bug reports, and a logout option.
 *
 * It uses client-side routing with Next.js Link and `a` tags for external links.
 */
const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ user, onClose }) => {
  const router = useRouter(); // Initialize Next.js router for navigation
  const [toastMessage, setToastMessage] = useState<string | null>(null); // State for toast message text
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('error'); // State for toast message type

  /**
   * Displays a toast message to the user.
   * @param text The message content.
   * @param type The type of the toast (success, error, info).
   */
  const showMessage = (text: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(text);
    setToastType(type);
    // Auto-clear the toast message after a few seconds
    setTimeout(() => setToastMessage(null), 3000);
  };

  /**
   * Handles the user sign-out process.
   * Calls the Firebase service to sign out and redirects to the login page on success.
   * Displays an error toast if sign-out fails.
   */
  const handleSignOut = async () => {
    try {
      await firebaseService.signOutUser(); // Call Firebase service to sign out
      router.push('/login'); // Redirect to login page
    } catch (error) {
      // Display error message if sign-out fails
      showMessage(`Sign-out error: ${(error as Error).message}`, 'error');
    } finally {
      onClose(); // Always close the dropdown after sign-out attempt
    }
  };

  // Define the menu items for the dropdown.
  // Each item has a href, label, icon, and a flag indicating if it's an external link.
  const menuItems = [
    {
      href: '/profile',
      label: 'Settings',
      icon: <FiSettings />,
      isExternal: false,
    },
    {
      href: '/about', // Assuming an /about page for app information
      label: 'About App',
      icon: <LuBadgeInfo />,
      isExternal: false,
    },
    {
      href: 'https://github.com/aadilmughal786/one-goal',
      label: 'GitHub',
      icon: <FaGithub />,
      isExternal: true,
    },
    {
      href: 'https://www.linkedin.com/in/dev-aadil',
      label: 'Developer',
      icon: <FaLinkedin />,
      isExternal: true,
    },
    {
      href: 'https://github.com/aadilmughal786/one-goal/issues/new',
      label: 'Report a Bug',
      icon: <GoBug />,
      isExternal: true,
    },
  ];

  return (
    <>
      {/* ToastMessage component for displaying feedback */}
      <ToastMessage message={toastMessage} type={toastType} /> {/* Dynamic type now */}
      {/* Main dropdown container */}
      <div className="relative w-64 animate-fade-in-right">
        {/* Decorative arrow pointing back to the profile button */}
        <div className="absolute -left-1.5 bottom-3 w-3 h-3 transform rotate-45 bg-neutral-900 border-b border-l border-white/10"></div>

        {/* Dropdown content container with styling */}
        <div className="overflow-hidden rounded-xl border shadow-2xl bg-neutral-900 border-white/10">
          {/* User information header */}
          <div className="flex gap-3 items-center px-4 py-3 border-b border-white/10">
            {/* User Avatar - with fallback for photoURL */}
            <Image
              src={user.photoURL || 'https://placehold.co/40x40/1a1a1a/ffffff?text=U'} // Fallback placeholder image
              alt="User Avatar"
              width={40}
              height={40}
              className="rounded-full"
            />
            <div className="text-sm">
              <p className="font-semibold text-white">{user.displayName || 'Anonymous User'}</p>{' '}
              {/* Fallback for displayName */}
              <p className="text-white/60">{user.email || 'No Email'}</p> {/* Fallback for email */}
            </div>
          </div>
          {/* Internal navigation links */}
          <div className="py-2">
            {menuItems.slice(0, 2).map(
              (
                item // Slicing to get internal links
              ) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex gap-3 items-center px-4 py-2 transition-colors cursor-pointer text-white/90 hover:bg-white/10"
                  onClick={onClose} // Close dropdown when link is clicked
                >
                  {React.cloneElement(item.icon, { size: 18 })} {/* Render icon with size */}
                  <span>{item.label}</span>
                </Link>
              )
            )}
          </div>
          <hr className="border-white/10" /> {/* Separator */}
          {/* External navigation links */}
          <div className="py-2">
            {menuItems.slice(2).map(
              (
                item // Slicing to get external links
              ) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank" // Open in new tab
                  rel="noopener noreferrer" // Security best practice for target="_blank"
                  className="flex justify-between items-center px-4 py-2 transition-colors cursor-pointer group text-white/90 hover:bg-white/10"
                  onClick={onClose} // Close dropdown when link is clicked
                >
                  <div className="flex gap-3 items-center">
                    {React.cloneElement(item.icon, { size: 18 })} {/* Render icon with size */}
                    <span>{item.label}</span>
                  </div>
                  {/* External link indicator, visible on hover */}
                  <MdArrowOutward
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                    size={16}
                  />
                </a>
              )
            )}
          </div>
          <hr className="border-white/10" /> {/* Separator */}
          {/* Logout button */}
          <div className="py-2">
            <button
              onClick={handleSignOut}
              className="flex gap-3 items-center px-4 py-2 w-full text-left text-red-400 transition-colors cursor-pointer hover:bg-red-500/10"
              aria-label="Logout" // Accessibility label
            >
              <FiLogOut size={18} /> Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileDropdown;
