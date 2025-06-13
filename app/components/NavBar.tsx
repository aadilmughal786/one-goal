// app/components/NavBar.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { User } from 'firebase/auth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { FiHome, FiList, FiCheckSquare } from 'react-icons/fi';
import { firebaseService } from '@/services/firebaseService';
import ProfileDropdown from './nav/ProfileDropdown';
import { MdRocketLaunch } from 'react-icons/md';
import { GoStopwatch } from 'react-icons/go';

const NavBar: React.FC = () => {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = firebaseService.onAuthChange(user => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

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

  const getNavLinkClasses = (navPath: string) => {
    const base =
      'flex items-center gap-2 px-3 py-2 text-white/80 font-medium rounded-md transition-colors duration-200 hover:bg-white/10 cursor-pointer';
    return `${base} ${pathname.startsWith(navPath) ? 'bg-white/10 text-white' : ''}`;
  };

  return (
    <nav className="flex sticky top-0 z-20 justify-between items-center px-4 py-2 border-b shadow-lg backdrop-blur-md bg-black/50 border-white/10">
      <Link href="/dashboard" className="cursor-pointer">
        <MdRocketLaunch size={30} className="text-white" />
      </Link>

      <div className="hidden gap-1 text-sm sm:flex md:gap-2">
        <Link href="/dashboard" className={getNavLinkClasses('/dashboard')}>
          <FiHome /> <span className="hidden md:block">Dashboard</span>
        </Link>
        <Link href="/todo" className={getNavLinkClasses('/todo')}>
          <FiCheckSquare /> <span className="hidden md:block">To-Do</span>
        </Link>
        <Link href="/stop-watch" className={getNavLinkClasses('/stop-watch')}>
          <GoStopwatch /> <span className="hidden md:block">Stopwatch</span>
        </Link>
        <Link href="/list" className={getNavLinkClasses('/list')}>
          <FiList /> <span className="hidden md:block">Lists</span>
        </Link>
      </div>

      <div className="relative" ref={profileDropdownRef}>
        <button
          onClick={() => setIsProfileDropdownOpen(prev => !prev)}
          disabled={authLoading}
          className="bg-white/[0.05] cursor-pointer rounded-full border border-white/10 shadow-lg transition-colors duration-200 hover:bg-white/10"
        >
          {authLoading ? (
            <div className="w-8 h-8 bg-gray-700 rounded-full animate-pulse"></div>
          ) : currentUser?.photoURL ? (
            <Image
              src={currentUser.photoURL}
              alt="User Avatar"
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <div className="flex justify-center items-center w-8 h-8 text-sm font-semibold bg-gray-600 rounded-full text-white/70">
              {(currentUser?.displayName || 'U').charAt(0).toUpperCase()}
            </div>
          )}
        </button>

        {isProfileDropdownOpen && currentUser && (
          <ProfileDropdown user={currentUser} onClose={() => setIsProfileDropdownOpen(false)} />
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
