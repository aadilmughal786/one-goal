// app/(root)/layout.tsx
'use client';

import CommandBar from '@/components/common/CommandBar';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import ReminderModal from '@/components/common/ReminderModal';
import ToastMessage from '@/components/common/ToastMessage';
import NavBar from '@/components/layout/NavBar';
import FloatingStopwatch from '@/components/stop-watch/FloatingStopwatch';
import { Action, KBarProvider } from 'kbar';
import { useRouter } from 'next/navigation';
import React from 'react';
import {
  FiCheckSquare,
  FiCpu,
  FiGithub,
  FiHome,
  FiLinkedin,
  FiTarget,
  FiUser,
} from 'react-icons/fi';
import { GoStopwatch } from 'react-icons/go';
import { MdOutlineRepeat } from 'react-icons/md';

/**
 * RootLayout for the main application pages (dashboard, todo, etc.).
 * It establishes the main visual structure and now renders the global,
 * store-driven components for notifications and confirmations.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();

  const actions: Action[] = [
    // Navigation
    {
      id: 'home',
      name: 'Home',
      shortcut: ['h'],
      keywords: 'home dashboard',
      section: 'Navigation',
      perform: () => router.push('/dashboard'),
      icon: <FiHome />,
    },
    {
      id: 'tasks',
      name: 'Tasks & Lists',
      shortcut: ['t'],
      keywords: 'tasks todo lists',
      section: 'Navigation',
      perform: () => router.push('/todo'),
      icon: <FiCheckSquare />,
    },
    {
      id: 'stopwatch',
      name: 'Stopwatch',
      shortcut: ['s'],
      keywords: 'stopwatch timer focus',
      section: 'Navigation',
      perform: () => router.push('/stop-watch'),
      icon: <GoStopwatch />,
    },
    {
      id: 'routine',
      name: 'Routine',
      shortcut: ['r'],
      keywords: 'routine habits',
      section: 'Navigation',
      perform: () => router.push('/routine'),
      icon: <MdOutlineRepeat />,
    },
    {
      id: 'goals',
      name: 'Goals',
      shortcut: ['g'],
      keywords: 'goals objectives',
      section: 'Navigation',
      perform: () => router.push('/goal'),
      icon: <FiTarget />,
    },
    {
      id: 'profile',
      name: 'Profile',
      shortcut: ['p'],
      keywords: 'profile settings account',
      section: 'Navigation',
      perform: () => router.push('/profile'),
      icon: <FiUser />,
    },
    {
      id: 'tools',
      name: 'Tools',
      shortcut: ['c'],
      keywords: 'tools calculator',
      section: 'Navigation',
      perform: () => router.push('/tools'),
      icon: <FiCpu />,
    },

    // External Links
    {
      id: 'github',
      name: 'GitHub',
      keywords: 'github source code',
      section: 'External Links',
      perform: () => window.open('https://github.com/aadilmughal786/one-goal', '_blank'),
      icon: <FiGithub />,
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      keywords: 'linkedin developer',
      section: 'External Links',
      perform: () => window.open('https://www.linkedin.com/in/dev-aadil', '_blank'),
      icon: <FiLinkedin />,
    },
  ];

  return (
    <KBarProvider actions={actions}>
      <CommandBar />
      <div className="flex flex-row text-white bg-black">
        <NavBar />
        <main className="flex-grow pl-16">{children}</main>

        {/* These components are now rendered globally and manage their own state
          by subscribing to their respective Zustand stores. */}
        <FloatingStopwatch />
        <ToastMessage />
        <ConfirmationModal />
        <ReminderModal />
      </div>
    </KBarProvider>
  );
}
