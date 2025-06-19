// app/(root)/layout.tsx
'use client';

import React from 'react';
import NavBar from '@/components/NavBar';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-row text-white bg-black">
      <NavBar />
      {/* The main content area now has less padding (pl-16) to match the new, narrower sidebar. */}
      <main className="flex-grow pl-16">{children}</main>
    </div>
  );
}
