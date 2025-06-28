// app/(root)/layout.tsx
'use client';

import NavBar from '@/components/layout/NavBar';
import FloatingStopwatch from '@/components/stop-watch/FloatingStopwatch';
import React from 'react';

import ConfirmationModal from '@/components/common/ConfirmationModal';
import ReminderModal from '@/components/common/ReminderModal';
import ToastMessage from '@/components/common/ToastMessage';

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
  );
}
