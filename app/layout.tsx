// app/layout.tsx

import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import Script from 'next/script'; // Import the Next.js Script component
import React from 'react';
import Footer from './components/layout/Footer';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'One Goal - Focus Your Superpower',
  description:
    'Your singular focus in a world of distractions. Achieve clarity, drive action, and conquer your most important objectives.',
  metadataBase: new URL('https://aadilmughal786.github.io'),
  openGraph: {
    title: 'One Goal - Focus Your Superpower',
    description:
      'Your singular focus in a world of distractions. Achieve clarity, drive action, and conquer your most important objectives.',
    url: '/one-goal/',
    siteName: 'One Goal',
    images: [
      {
        url: '/one-goal/og-image.png',
        width: 1200,
        height: 630,
        alt: 'One Goal Application Interface',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'One Goal - Focus Your Superpower',
    description:
      'Your singular focus in a world of distractions. Achieve clarity, drive action, and conquer your most important objectives.',
    creator: '@aadil_mughal_dev',
    images: ['/one-goal/og-image.png'],
  },
  icons: {
    icon: '/one-goal/favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={poppins.className}>
        {/* FIX: Add the Script component to load the Firebase config at runtime.
            - The `strategy="beforeInteractive"` ensures this script loads and executes
              before any React hydration or interactive application code runs.
            - This makes the `__firebase_config` global variable available to your
              `app/services/config.ts` file just in time.
        */}
        <Script src="/one-goal/firebase-config.js" strategy="beforeInteractive" />

        <div className="min-h-screen text-white bg-black">
          <div className="relative z-10">
            <div className="fixed inset-0 z-0 opacity-30 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-b via-transparent to-transparent from-white/40"></div>
            </div>
            <main>{children}</main>
            <Footer />
          </div>
        </div>
      </body>
    </html>
  );
}
