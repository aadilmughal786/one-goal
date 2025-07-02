// app/components/layout/NavBar.tsx
'use client';

import { onAuthChange } from '@/services/authService';
import { User } from 'firebase/auth';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import { FiCheckSquare, FiHome, FiTarget } from 'react-icons/fi';
import { GoStopwatch } from 'react-icons/go';
import { MdOutlineRepeat, MdRocketLaunch } from 'react-icons/md';
import ProfileDropdown from './ProfileDropdown';

const navLinks = [
  { href: '/dashboard?tab=main', label: 'Dashboard', icon: <FiHome /> },
  { href: '/todo?tab=todo', label: 'Tasks & Lists', icon: <FiCheckSquare /> },
  { href: '/stop-watch?tab=stopwatch', label: 'Stopwatch', icon: <GoStopwatch /> },
  { href: '/routine?tab=sleep', label: 'Routine', icon: <MdOutlineRepeat /> },
  { href: '/goal', label: 'Goals', icon: <FiTarget /> }, // No tabs on this page
];

export default function NavBar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

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
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthChange(user => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const getNavLinkClasses = (navPath: string) => {
    const baseClasses =
      'flex items-center justify-center w-full h-12 rounded-lg transition-colors duration-200 cursor-pointer';
    const activeClasses = 'bg-white text-black';
    const inactiveClasses = 'text-white/70 hover:bg-white/10 hover:text-white';

    // Get the base path of the link (e.g., '/dashboard' from '/dashboard?tab=main')
    const [basePath] = navPath.split('?');

    // Check if the current page's pathname matches the link's base path.
    // This ensures the icon stays active regardless of the current tab.
    return pathname === basePath
      ? `${baseClasses} ${activeClasses}`
      : `${baseClasses} ${inactiveClasses}`;
  };

  return (
    <nav className="flex fixed top-0 left-0 z-40 flex-col justify-between items-center px-2 py-5 w-16 h-screen border-r shadow-lg backdrop-blur-md bg-black/50 border-white/10">
      <div className="flex justify-center">
        {authLoading ? (
          <div className="w-10 h-10 rounded-full animate-pulse bg-white/10"></div>
        ) : (
          <Link
            href="/dashboard"
            className="p-2 rounded-full cursor-pointer group hover:bg-white/10"
            title="One Goal Home"
          >
            <MdRocketLaunch
              size={28}
              className="text-white transition-transform duration-300 group-hover:scale-110"
            />
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-2 w-full">
        {authLoading ? (
          <div className="flex flex-col gap-4 items-center">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-12 h-12 rounded-lg animate-pulse bg-white/10"></div>
            ))}
          </div>
        ) : (
          navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={getNavLinkClasses(link.href)}
              title={link.label}
            >
              {React.cloneElement(link.icon, { size: 24 })}
            </Link>
          ))
        )}
      </div>

      <div className="flex relative justify-center" ref={profileDropdownRef}>
        <button
          onClick={() => setIsProfileDropdownOpen(prev => !prev)}
          disabled={authLoading}
          className="rounded-full transition-all duration-200 cursor-pointer hover:ring-2 hover:ring-blue-400"
          aria-label="Open profile menu"
        >
          {authLoading ? (
            <div className="w-10 h-10 rounded-full animate-pulse bg-white/10"></div>
          ) : currentUser?.photoURL ? (
            <Image
              src={currentUser.photoURL}
              alt="User Avatar"
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="flex justify-center items-center w-10 h-10 text-lg font-semibold bg-gray-600 rounded-full border-2 cursor-pointer text-white/70 border-white/20">
              {(currentUser?.displayName || 'U').charAt(0).toUpperCase()}
            </div>
          )}
        </button>
        {isProfileDropdownOpen && currentUser && (
          <div className="absolute bottom-0 left-full z-50 ml-3">
            <ProfileDropdown user={currentUser} onClose={() => setIsProfileDropdownOpen(false)} />
          </div>
        )}
      </div>
    </nav>
  );
}
