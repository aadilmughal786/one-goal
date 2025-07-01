// app/(root)/layout.tsx
'use client';

import CommandBar from '@/components/common/CommandBar';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import ReminderModal from '@/components/common/ReminderModal';
import ToastMessage from '@/components/common/ToastMessage';
import NavBar from '@/components/layout/NavBar';
import FloatingStopwatch from '@/components/stop-watch/FloatingStopwatch';
import { kBarActions } from '@/config/kbarActions';
import { KBarProvider } from 'kbar';
import React from 'react';

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
  return (
    <KBarProvider actions={kBarActions}>
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
