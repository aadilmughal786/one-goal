// app/layout.tsx
'use client'; // Added 'use client' directive as useEffect is a client-side hook

import React from 'react'; // Import useEffect and React
import NavBar from '@/components/NavBar';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen text-white bg-black">
      {/* Subtle background */}
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b via-transparent to-transparent from-white/40"></div>
      </div>

      <NavBar />
      {children}
    </div>
  );
}
