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
    <>
      <NavBar />
      {children}
    </>
  );
}
