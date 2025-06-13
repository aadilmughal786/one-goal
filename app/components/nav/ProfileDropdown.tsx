// app/components/nav/ProfileDropdown.tsx
'use client';

import React, { useState } from 'react';
import { User } from 'firebase/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { LuBadgeInfo } from 'react-icons/lu';
import { FiLogOut, FiSettings } from 'react-icons/fi';
import { GoBug } from 'react-icons/go'; // Corrected: Import bug icon from a different set
import { firebaseService } from '@/services/firebaseService';
import ToastMessage from '@/components/ToastMessage';
import { FaGithub, FaLinkedin } from 'react-icons/fa6';
import { MdArrowOutward } from 'react-icons/md';

interface ProfileDropdownProps {
  user: User;
  onClose: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ user, onClose }) => {
  const router = useRouter();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showMessage = (text: string, _: 'success' | 'error' | 'info') => {
    setToastMessage(text);
  };

  const handleSignOut = async () => {
    try {
      await firebaseService.signOutUser();
      router.push('/login');
    } catch (error) {
      showMessage(`Sign-out error: ${(error as Error).message}`, 'error');
    }
  };

  const menuItems = [
    {
      href: '/profile',
      label: 'Settings',
      icon: <FiSettings />,
      isExternal: false,
    },
    {
      href: '/',
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
      icon: <GoBug />, // Corrected: Replaced FiBug with GoBug
      isExternal: true,
    },
  ];

  return (
    <>
      <ToastMessage message={toastMessage} type="error" />
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
          {menuItems.slice(0, 2).map(item => (
            <Link
              key={item.label}
              href={item.href}
              className="flex gap-3 items-center px-4 py-2 transition-colors cursor-pointer text-white/90 hover:bg-white/10"
              onClick={onClose}
            >
              {item.icon}
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
                {item.icon}
                <span>{item.label}</span>
              </div>
              <MdArrowOutward className="opacity-0 transition-opacity group-hover:opacity-100" />
            </a>
          ))}
        </div>

        <hr className="border-white/10" />
        <div className="py-2">
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
