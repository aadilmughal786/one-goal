// app/components/layout/NavBar.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { User } from 'firebase/auth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image'; // Import Next.js Image component for optimized images
import { FiHome, FiCheckSquare, FiArchive } from 'react-icons/fi';
import { firebaseService } from '@/services/firebaseService'; // Import Firebase service
import ProfileDropdown from './ProfileDropdown'; // Import user profile dropdown
import { MdRocketLaunch, MdOutlineRepeat } from 'react-icons/md'; // Material Design icons
import { GoStopwatch } from 'react-icons/go'; // Go icon for stopwatch

// Define the navigation links for the sidebar.
// Each link has a href, a display label, and an associated icon.
const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: <FiHome /> },
  { href: '/todo', label: 'Tasks & Lists', icon: <FiCheckSquare /> },
  { href: '/stop-watch', label: 'Stopwatch', icon: <GoStopwatch /> },
  { href: '/routine', label: 'Routine', icon: <MdOutlineRepeat /> },
  { href: '/archive', label: 'Archive', icon: <FiArchive /> },
];

/**
 * NavBar Component
 *
 * This component renders the main navigation bar for the application.
 * It's a fixed-position sidebar on the left, displaying navigation icons
 * and the user's profile picture with a dropdown menu.
 * It handles authentication state to show appropriate loading indicators or user info.
 */
export default function NavBar() {
  // Get the current pathname from Next.js for active link highlighting.
  const pathname = usePathname();
  // State to store the currently authenticated Firebase user.
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  // State to indicate if the authentication status is still being loaded.
  const [authLoading, setAuthLoading] = useState(true);
  // State to control the visibility of the user profile dropdown.
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  // Ref to the profile dropdown button to detect clicks outside for closing.
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Effect to close the profile dropdown when a click occurs outside of it.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // If the dropdown ref exists and the click is outside its element, close the dropdown.
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };
    // Attach the event listener when the component mounts.
    document.addEventListener('mousedown', handleClickOutside);
    // Clean up the event listener when the component unmounts.
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []); // Empty dependency array means this effect runs once on mount.

  // Effect to listen for changes in Firebase authentication state.
  useEffect(() => {
    // Subscribe to auth state changes using the firebaseService.
    const unsubscribe = firebaseService.onAuthChange(user => {
      setCurrentUser(user); // Update currentUser state
      setAuthLoading(false); // Set authLoading to false once auth state is determined
    });
    // Return the unsubscribe function for cleanup when the component unmounts.
    return () => unsubscribe();
  }, []); // Empty dependency array means this effect runs once on mount.

  /**
   * Helper function to dynamically apply CSS classes to navigation links
   * based on the current pathname.
   * @param navPath The href of the navigation link.
   * @returns A string of CSS classes.
   */
  const getNavLinkClasses = (navPath: string) => {
    const baseClasses =
      'flex items-center justify-center w-full h-14 rounded-lg transition-colors duration-200 cursor-pointer';
    const activeClasses = 'bg-blue-500/80 text-white'; // Classes for the active link
    const inactiveClasses = 'text-white/70 hover:bg-white/10 hover:text-white'; // Classes for inactive links

    // Compare the current main path (without query parameters) with the navigation link's path.
    const currentMainPath = pathname.split('?')[0];
    if (currentMainPath === navPath) {
      return `${baseClasses} ${activeClasses}`; // Apply active classes if paths match
    }

    return `${baseClasses} ${inactiveClasses}`; // Apply inactive classes otherwise
  };

  return (
    // Main navigation container.
    // Fixed positioning, narrow width (w-16), and styled with Tailwind CSS.
    <nav className="flex fixed top-0 left-0 z-40 flex-col justify-between items-center px-2 py-5 w-16 h-screen border-r shadow-lg backdrop-blur-md bg-black/50 border-white/10">
      {/* Top Section: App Icon/Logo */}
      <div className="flex justify-center">
        {authLoading ? (
          // Display a pulsating skeleton while authentication is loading.
          <div className="w-10 h-10 rounded-full animate-pulse bg-white/10"></div>
        ) : (
          // Link to the Dashboard, with an app icon.
          <Link
            href="/dashboard"
            className="p-2 rounded-full group hover:bg-white/10"
            title="One Goal Home" // Tooltip for accessibility
          >
            <MdRocketLaunch
              size={28}
              className="text-white transition-transform duration-300 group-hover:scale-110"
            />
          </Link>
        )}
      </div>

      {/* Middle Section: Navigation Links */}
      <div className="flex flex-col gap-2 w-full">
        {authLoading ? (
          // Display skeleton links while authentication is loading.
          <div className="flex flex-col gap-4 items-center">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-14 h-14 rounded-lg animate-pulse bg-white/10"></div>
            ))}
          </div>
        ) : (
          // Render actual navigation links once authentication is complete.
          navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={getNavLinkClasses(link.href)} // Apply dynamic classes
              title={link.label} // Tooltip for accessibility
            >
              {/* Clone the icon element to pass size prop */}
              {React.cloneElement(link.icon, { size: 24 })}
            </Link>
          ))
        )}
      </div>

      {/* Bottom Section: User Profile Area */}
      <div className="flex relative justify-center" ref={profileDropdownRef}>
        <button
          onClick={() => setIsProfileDropdownOpen(prev => !prev)}
          disabled={authLoading} // Disable button while auth is loading
          className="rounded-full transition-all duration-200 cursor-pointer hover:ring-2 hover:ring-blue-400"
          aria-label="Open profile menu" // Accessibility label
        >
          {authLoading ? (
            // Display pulsating skeleton for avatar while loading.
            <div className="w-10 h-10 rounded-full animate-pulse bg-white/10"></div>
          ) : currentUser?.photoURL ? (
            // Display user's profile picture if available.
            <Image
              src={currentUser.photoURL}
              alt="User Avatar"
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            // Fallback: Display user's initial if no photo URL.
            <div className="flex justify-center items-center w-10 h-10 text-lg font-semibold bg-gray-600 rounded-full border-2 cursor-pointer text-white/70 border-white/20">
              {(currentUser?.displayName || 'U').charAt(0).toUpperCase()}
            </div>
          )}
        </button>
        {/* Render ProfileDropdown if it's open and user is authenticated. */}
        {isProfileDropdownOpen && currentUser && (
          // Position the dropdown to the right of the navigation bar.
          <div className="absolute bottom-0 left-full z-50 ml-3">
            <ProfileDropdown user={currentUser} onClose={() => setIsProfileDropdownOpen(false)} />
          </div>
        )}
      </div>
    </nav>
  );
}
