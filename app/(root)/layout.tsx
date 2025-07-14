// app/(root)/layout.tsx
'use client';

import AboutDevModal from '@/components/common/AboutDevModal'; // Import new modal
import AppInfoModal from '@/components/common/AppInfoModal'; // Import new modal
import CommandBar from '@/components/common/CommandBar';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import ReminderModal from '@/components/common/ReminderModal';
import SleepOverlay from '@/components/common/SleepOverlay';
import ThemeInitializer from '@/components/common/ThemeInitializer';
import ToastMessage from '@/components/common/ToastMessage';
import NavBar from '@/components/layout/NavBar';
import FloatingStopwatch from '@/components/stop-watch/FloatingStopwatch';
import { getKbarActions } from '@/config/kbarActions';
import { useBeforeUnload } from '@/hooks/useBeforeUnload';
import { KBarProvider } from 'kbar';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react'; // Import useState

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const [isAboutDevModalOpen, setIsAboutDevModalOpen] = useState(false); // State for AboutDev modal
  const [isAppInfoModalOpen, setIsAppInfoModalOpen] = useState(false); // State for AppInfo modal

  useBeforeUnload();

  const toggleTheme = () => {
    const root = document.documentElement;
    const currentTheme = root.classList.contains('dark') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    root.classList.remove(currentTheme);
    root.classList.add(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Functions to open modals, passed to getKbarActions
  const openAboutDevModal = () => setIsAboutDevModalOpen(true);
  const openAppInfoModal = () => setIsAppInfoModalOpen(true);

  const actions = getKbarActions(router, toggleTheme, openAboutDevModal, openAppInfoModal);

  return (
    <>
      <ThemeInitializer />
      <KBarProvider actions={actions}>
        <CommandBar />
        <div className="flex flex-row text-text-primary bg-bg-primary">
          <NavBar />
          <main className="flex-grow pl-16">{children}</main>
          {/* Global components that manage their own state */}
          <FloatingStopwatch />
          <ToastMessage />
          <ConfirmationModal />
          <ReminderModal />
          <SleepOverlay />
          {/* New Modals */}
          <AboutDevModal
            isOpen={isAboutDevModalOpen}
            onClose={() => setIsAboutDevModalOpen(false)}
          />
          <AppInfoModal isOpen={isAppInfoModalOpen} onClose={() => setIsAppInfoModalOpen(false)} />
        </div>
      </KBarProvider>
    </>
  );
}
