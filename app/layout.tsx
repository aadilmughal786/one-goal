// app/layout.tsx
'use client'; // Added 'use client' directive as useEffect is a client-side hook

import './globals.css';
import { Poppins } from 'next/font/google';
import React, { useEffect } from 'react'; // Import useEffect and React
import { localStorageService } from '@/services/localStorageService'; // Import the localStorageService instance
import Footer from './components/Footer';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Initialize app mode when the root layout component mounts
  useEffect(() => {
    // Call the initializeAppMode method on the localStorageService instance
    localStorageService.initializeAppMode();
  }, []); // Empty dependency array means this runs once on mount

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>One Goal - Focus Your Superpower</title>
        <link rel="icon" href="/one-goal/favicon.png" type="image/x-icon" />
      </head>
      <body className={poppins.className}>
        <div className="min-h-screen text-white bg-black">
          {children}

          <Footer />
        </div>
      </body>
    </html>
  );
}
