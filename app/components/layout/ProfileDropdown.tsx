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
import { FiCommand, FiCpu, FiLogOut, FiMoon, FiSun } from 'react-icons/fi';
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
  const [theme, setTheme] = useState('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const root = window.document.documentElement;
    setTheme(root.classList.contains('dark') ? 'dark' : 'light');
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  const toggleTheme = () => {
    const root = window.document.documentElement;
    const newTheme = theme === 'light' ? 'dark' : 'light';

    root.classList.remove(theme);
    root.classList.add(newTheme);

    localStorage.setItem('theme', newTheme);
    setTheme(newTheme);
  };

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

  const menuItems = [{ href: '/tools?tool=browse', label: 'Tools', icon: <FiCpu /> }];

  const externalLinks = [
    {
      href: '/one-goal',
      label: 'About App',
      icon: <LuBadgeInfo />,
    },
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
        <div className="absolute -left-1.5 bottom-3 w-3 h-3 transform rotate-45 bg-bg-primary border-b border-l border-border-primary"></div>
        <div className="overflow-hidden rounded-xl border shadow-2xl bg-bg-primary border-border-primary">
          <div
            onClick={() => {
              router.push('/profile?tab=profile');
              onClose();
            }}
            className="flex gap-3 items-center px-4 py-3 border-b transition-colors cursor-pointer border-border-primary hover:bg-bg-tertiary"
          >
            <Image
              src={user.photoURL || 'https://placehold.co/40x40/1a1a1a/ffffff?text=U'}
              alt="User Avatar"
              width={40}
              height={40}
              className="rounded-full"
            />
            <div className="text-sm">
              <p className="font-semibold text-text-primary">
                {user.displayName || 'Anonymous User'}
              </p>
              <p className="text-text-secondary">{user.email || 'No Email'}</p>
            </div>
          </div>
          <div className="py-2">
            <button
              onClick={handleCommandPalette}
              className="flex justify-between items-center px-4 py-2 w-full text-left transition-colors cursor-pointer text-text-primary hover:bg-bg-tertiary"
            >
              <div className="flex gap-3 items-center">
                <FiCommand size={18} />
                <span>Command Palette</span>
              </div>
              <kbd className="px-2 py-1 text-xs font-medium rounded-md text-text-secondary bg-bg-tertiary">
                {isMac ? '⌘K' : 'Ctrl+K'}
              </kbd>
            </button>
            {mounted && (
              <button
                onClick={toggleTheme}
                className="flex justify-between items-center px-4 py-2 w-full text-left transition-colors cursor-pointer text-text-primary hover:bg-bg-tertiary"
              >
                <div className="flex gap-3 items-center">
                  {theme === 'dark' ? <FiSun size={18} /> : <FiMoon size={18} />}
                  <span>Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
                </div>
              </button>
            )}
            {menuItems.map(item => (
              <Link
                key={item.label}
                href={item.href}
                className="flex gap-3 items-center px-4 py-2 transition-colors cursor-pointer text-text-primary hover:bg-bg-tertiary"
                onClick={onClose}
              >
                {React.cloneElement(item.icon, { size: 18 })}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
          <hr className="border-border-primary" />
          <div className="py-2">
            {externalLinks.map(item => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex justify-between items-center px-4 py-2 transition-colors cursor-pointer group text-text-primary hover:bg-bg-tertiary"
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
          <hr className="border-border-primary" />
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
