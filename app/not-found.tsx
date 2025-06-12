// app/not-found.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { FiHome } from 'react-icons/fi';

export default function NotFoundPage() {
  return (
    <div className="relative z-10 px-6 mx-auto max-w-4xl text-center py-15">
      {/* 404 Text */}
      <h1 className="text-8xl sm:text-9xl lg:text-[12rem] font-bold tracking-tight mb-4 leading-none text-white/20">
        404
      </h1>

      {/* Error Message */}
      <h2 className="mb-6 text-3xl font-bold tracking-tight leading-tight sm:text-4xl lg:text-5xl">
        Page Not Found
      </h2>

      <p className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed sm:text-xl text-white/70">
        The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you
        back on track to achieving your goals.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col gap-4 justify-center items-center sm:flex-row sm:gap-6">
        <Link
          href="/dashboard"
          className="inline-flex gap-3 items-center px-8 py-4 font-semibold text-black bg-white rounded-full transition-all duration-200 group hover:bg-white/90 hover:scale-105 hover:shadow-xl"
        >
          <FiHome size={20} />
          Go Home
        </Link>
      </div>
    </div>
  );
}
