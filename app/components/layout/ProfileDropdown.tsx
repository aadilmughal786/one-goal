// app/components/layout/ProfileDropdown.tsx
'use client';

import { signOutUser } from '@/services/authService';
import { useNotificationStore } from '@/store/useNotificationStore';
import { User } from 'firebase/auth';
import { useKBar } from 'kbar';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { FaGithub, FaLinkedin } from 'react-icons/fa6';
import { FiCommand, FiCpu, FiLogOut, FiSettings } from 'react-icons/fi';
import { GoBug } from 'react-icons/go';
import { LuBadgeInfo } from 'react-icons/lu';
import { MdArrowOutward } from 'react-icons/md';

interface ProfileDropdownProps {
  user: User;
  onClose: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ user, onClose }) => {
  const router = useRouter();
  const showToast = useNotificationStore(state => state.showToast);
  const { query } = useKBar();
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
    }
  }, []);

  const handleSignOut = async () => {
    try {
      await signOutUser();
      router.push('/login');
    } catch (error) {
      showToast(`Sign-out error: ${(error as Error).message}`, 'error');
    } finally {
      onClose();
    }
  };

  const handleCommandPalette = () => {
    query.toggle();
    onClose();
  };

  const menuItems = [
    { href: '/profile?tab=profile', label: 'Settings', icon: <FiSettings /> },
    { href: '/tools?tab=calculator', label: 'Tools', icon: <FiCpu /> },
    { href: '/', label: 'About App', icon: <LuBadgeInfo /> },
  ];

  const externalLinks = [
    {
      href: 'https://github.com/aadilmughal786/one-goal',
      label: 'GitHub',
      icon: <FaGithub />,
    },
    {
      href: 'https://www.linkedin.com/in/dev-aadil',
      label: 'Developer',
      icon: <FaLinkedin />,
    },
    {
      href: 'https://github.com/aadilmughal786/one-goal/issues/new',
      label: 'Report a Bug',
      icon: <GoBug />,
    },
  ];

  return (
    <>
      <div className="relative w-72 animate-fade-in-right">
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
            <button
              onClick={handleCommandPalette}
              className="flex justify-between items-center px-4 py-2 w-full text-left transition-colors cursor-pointer text-white/90 hover:bg-white/10"
            >
              <div className="flex gap-3 items-center">
                <FiCommand size={18} />
                <span>Command Palette</span>
              </div>
              <kbd className="px-2 py-1 text-xs font-medium rounded-md text-white/70 bg-white/5">
                {isMac ? '⌘K' : 'Ctrl+K'}
              </kbd>
            </button>
            {menuItems.map(item => (
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
            {externalLinks.map(item => (
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
