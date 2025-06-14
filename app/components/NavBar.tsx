// app/components/NavBar.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { User } from 'firebase/auth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { FiHome, FiList, FiCheckSquare, FiMenu, FiX, FiLogOut } from 'react-icons/fi';
import { firebaseService } from '@/services/firebaseService';
import ProfileDropdown from './nav/ProfileDropdown';
import { MdRocketLaunch } from 'react-icons/md';
import { GoStopwatch } from 'react-icons/go';

// Navigation links are defined in an array for easier management and mapping.
const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: <FiHome /> },
  { href: '/todo', label: 'To-Do', icon: <FiCheckSquare /> },
  { href: '/stop-watch', label: 'Stopwatch', icon: <GoStopwatch /> },
  { href: '/list', label: 'Lists', icon: <FiList /> },
];

export default function NavBar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Effect to close dropdowns when clicking outside of them.
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

  // Effect to close the mobile menu automatically on route changes.
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Effect to listen for changes in Firebase authentication state.
  useEffect(() => {
    const unsubscribe = firebaseService.onAuthChange(user => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Helper function to dynamically apply CSS classes for active navigation links.
  const getNavLinkClasses = (navPath: string) => {
    const baseClasses =
      'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 cursor-pointer';
    const activeClasses = 'bg-white/10 text-white font-semibold';
    const inactiveClasses = 'text-white/70 hover:bg-white/10 hover:text-white';

    return `${baseClasses} ${pathname.startsWith(navPath) ? activeClasses : inactiveClasses}`;
  };

  // Handler for signing the user out.
  const handleSignOut = async () => {
    await firebaseService.signOutUser();
    // The onAuthChange listener will handle redirects automatically.
  };

  return (
    <>
      <nav className="flex sticky top-0 z-40 justify-between items-center px-4 py-3 border-b shadow-lg backdrop-blur-md md:px-6 bg-black/50 border-white/10">
        <Link href="/dashboard" className="flex gap-2 items-center cursor-pointer">
          <MdRocketLaunch size={30} className="text-white" />
          <span className="hidden text-xl font-bold sm:inline">One Goal</span>
        </Link>

        {/* --- Desktop Navigation --- */}
        <div className="hidden gap-1 text-sm md:flex">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} className={getNavLinkClasses(link.href)}>
              {React.cloneElement(link.icon, { size: 20 })}
              <span className="hidden lg:inline">{link.label}</span>
            </Link>
          ))}
        </div>

        <div className="flex gap-3 items-center">
          <div className="relative w-8 h-8" ref={profileDropdownRef}>
            <button
              onClick={() => setIsProfileDropdownOpen(prev => !prev)}
              disabled={authLoading}
              className="rounded-full transition-opacity duration-200 cursor-pointer"
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
                <div className="flex justify-center items-center w-8 h-8 text-sm font-semibold bg-gray-600 rounded-full border-2 cursor-pointer text-white/70 border-white/20">
                  {(currentUser?.displayName || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </button>
            {isProfileDropdownOpen && currentUser && (
              <ProfileDropdown user={currentUser} onClose={() => setIsProfileDropdownOpen(false)} />
            )}
          </div>

          {/* --- NEW: Separator for mobile view --- */}
          <div className="w-px h-6 bg-white/20 md:hidden"></div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 cursor-pointer text-white/80 hover:text-white"
            >
              <FiMenu size={24} />
            </button>
          </div>
        </div>
      </nav>

      {/* --- Mobile Menu Overlay --- */}
      <div
        className={`fixed inset-0 z-50 transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div
          className="absolute inset-0 backdrop-blur-md cursor-pointer bg-black/60"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
        <div className="flex absolute top-0 right-0 z-10 flex-col justify-between p-6 w-full max-w-xs h-full shadow-2xl bg-neutral-900">
          <div>
            <div className="flex justify-between items-center mb-10">
              <span className="text-xl font-bold">Menu</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 cursor-pointer text-white/80 hover:text-white"
              >
                <FiX size={24} />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {navLinks.map(link => (
                <Link
                  key={`mobile-${link.href}`}
                  href={link.href}
                  className={`${getNavLinkClasses(link.href)} text-lg py-3`}
                >
                  {React.cloneElement(link.icon, { size: 22 })}
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {currentUser && (
            <div className="py-4 border-t border-white/10">
              <div className="flex gap-3 items-center mb-4">
                <Image
                  src={currentUser.photoURL!}
                  alt="User Avatar"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <div className="text-sm">
                  <p className="font-semibold text-white">{currentUser.displayName}</p>
                  <p className="text-white/60">{currentUser.email}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="flex gap-2 justify-center items-center px-4 py-3 w-full text-base font-semibold text-red-400 rounded-lg transition-colors cursor-pointer bg-red-500/10 hover:bg-red-500/20"
              >
                <FiLogOut />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
