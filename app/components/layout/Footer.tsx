// app/components/layout/Footer.tsx
'use client';

import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="flex justify-center items-center p-4 backdrop-blur-md bg-bg-primary/50">
      <p className="text-sm text-text-muted">
        &copy; {new Date().getFullYear()} One Goal. Built with focus and dedication.
      </p>
    </footer>
  );
};

export default Footer;
