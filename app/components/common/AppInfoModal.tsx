// app/components/common/AppInfoModal.tsx
'use client';

import React from 'react';
import { FiX } from 'react-icons/fi';
import { MdRocketLaunch } from 'react-icons/md';
import packageJson from '../../../package.json'; // Import package.json for version info

interface AppInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AppInfoModal: React.FC<AppInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const appVersion = packageJson.version;
  const appName = packageJson.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); // "one-goal" -> "One Goal"
  const appDescription = packageJson.description;

  return (
    <div
      className="flex fixed inset-0 z-[5000] justify-center items-center p-4 backdrop-blur-sm bg-black/60"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-info-modal-title"
    >
      <div
        className="overflow-hidden relative w-full max-w-xl rounded-3xl border shadow-2xl backdrop-blur-md bg-bg-secondary border-border-primary"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full cursor-pointer text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary"
          aria-label="Close modal"
        >
          <FiX size={24} />
        </button>

        <div className="p-8 text-center sm:p-10">
          <div className="mb-8">
            <div className="inline-flex justify-center items-center w-20 h-20 rounded-full border backdrop-blur-sm bg-bg-secondary border-border-primary">
              <MdRocketLaunch className="w-10 h-10 text-text-primary" />
            </div>
          </div>{' '}
          <h2 id="app-info-modal-title" className="mb-4 text-3xl font-bold text-text-primary">
            {appName}
          </h2>
          <p className="mb-6 text-lg text-text-secondary">{appDescription}</p>
          <div className="space-y-2 text-sm text-text-muted">
            <p>
              Version: <span className="font-semibold text-text-primary">{appVersion}</span>
            </p>
            <p>Built with: Next.js, React, TypeScript, Tailwind CSS, Firebase</p>
            <p>&copy; {new Date().getFullYear()} Aadil Mughal</p>
          </div>
        </div>
        <div className="p-6 border-t border-border-primary">
          <button
            onClick={onClose}
            className="py-3 w-full font-semibold rounded-full transition-colors cursor-pointer text-bg-primary bg-text-primary hover:opacity-90"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppInfoModal;
