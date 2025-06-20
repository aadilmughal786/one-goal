// app/(root)/layout.tsx
'use client';

import React from 'react';
import NavBar from '@/components/layout/NavBar';
import { TimerProvider } from '@/providers/TimerProvider';
import FloatingStopwatch from '@/components/stop-watch/FloatingStopwatch'; // 1. Import the new component

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <TimerProvider>
      <div className="flex flex-row text-white bg-black">
        <NavBar />
        <main className="flex-grow pl-16">{children}</main>
        <FloatingStopwatch /> {/* 2. Add the component here */}
      </div>
    </TimerProvider>
  );
}
