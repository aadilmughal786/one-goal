// app/components/layout/ProfileDropdown.tsx
'use client';

// REMOVED: import ToastMessage from '@/components/common/ToastMessage'; // No longer needed as ToastMessage is global
import { User } from 'firebase/auth';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';
import { FaGithub, FaLinkedin } from 'react-icons/fa6';
import { FiLogOut, FiSettings } from 'react-icons/fi';
import { GoBug } from 'react-icons/go';
import { LuBadgeInfo } from 'react-icons/lu';
import { MdArrowOutward } from 'react-icons/md';

// REFLECTING THE REFACTOR:
// We now import the specific signOutUser function from our new, focused authService.
import { signOutUser } from '@/services/authService';
// NEW: Import useNotificationStore to use showToast
import { useNotificationStore } from '@/store/useNotificationStore';

interface ProfileDropdownProps {
  user: User;
  onClose: () => void;
}

/**
 * ProfileDropdown Component
 *
 * This component displays a dropdown menu for the authenticated user's profile.
 * It shows user information and navigation links.
 */
const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ user, onClose }) => {
  const router = useRouter();
  // REMOVED: local toast state (toastMessage, toastType)
  // Access showToast from the global notification store
  const showToast = useNotificationStore(state => state.showToast);

  // REMOVED: showMessage function as it's replaced by direct use of global showToast
  // const showMessage = (text: string, type: 'success' | 'error' | 'info') => {
  //   setToastMessage(text);
  //   setToastType(type);
  //   setTimeout(() => setToastMessage(null), 3000);
  // };

  /**
   * Handles the user sign-out process using the new authService.
   */
  const handleSignOut = async () => {
    try {
      await signOutUser(); // Using the new service function
      router.push('/login');
    } catch (error) {
      showToast(`Sign-out error: ${(error as Error).message}`, 'error'); // Use global showToast
    } finally {
      onClose();
    }
  };

  const menuItems = [
    { href: '/profile', label: 'Settings', icon: <FiSettings /> },
    { href: '/', label: 'About App', icon: <LuBadgeInfo /> },
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
      {/* REMOVED: ToastMessage component as it's rendered globally */}
      <div className="relative w-64 animate-fade-in-right">
        <div className="absolute -left-1.5 bottom-3 w-3 h-3 transform rotate-45 bg-neutral-900 border-b border-l border-white/10"></div>
        <div className="overflow-hidden rounded-xl border shadow-2xl bg-neutral-900 border-white/10">
          <div className="flex gap-3 items-center px-4 py-3 border-b border-white/10">
            <Image
              src={user.photoURL || 'https://placehold.co/40x40/1a1a1a/ffffff?text=U'}
              alt="User Avatar"
              width={40}
              height={40}
              className="rounded-full"
            />
            <div className="text-sm">
              <p className="font-semibold text-white">{user.displayName || 'Anonymous User'}</p>
              <p className="text-white/60">{user.email || 'No Email'}</p>
            </div>
          </div>
          <div className="py-2">
            {menuItems.slice(0, 2).map(item => (
              <Link
                key={item.label}
                href={item.href}
                className="flex gap-3 items-center px-4 py-2 transition-colors cursor-pointer text-white/90 hover:bg-white/10"
                onClick={onClose}
              >
                {React.cloneElement(item.icon, { size: 18 })}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
          <hr className="border-white/10" />
          <div className="py-2">
            {menuItems.slice(2).map(item => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex justify-between items-center px-4 py-2 transition-colors cursor-pointer group text-white/90 hover:bg-white/10"
                onClick={onClose}
              >
                <div className="flex gap-3 items-center">
                  {React.cloneElement(item.icon, { size: 18 })}
                  <span>{item.label}</span>
                </div>
                <MdArrowOutward
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                  size={16}
                />
              </a>
            ))}
          </div>
          <hr className="border-white/10" />
          <div className="py-2">
            <button
              onClick={handleSignOut}
              className="flex gap-3 items-center px-4 py-2 w-full text-left text-red-400 transition-colors cursor-pointer hover:bg-red-500/10"
              aria-label="Logout"
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
