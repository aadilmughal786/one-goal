// src/components/Footer.tsx
'use client';

import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="py-12 text-center">
      <p className="text-sm text-white/40">
        &copy; {new Date().getFullYear()} One Goal. Built with focus and dedication.
      </p>
    </footer>
  );
};

export default Footer;
