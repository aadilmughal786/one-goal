// app/components/common/AboutDevModal.tsx
'use client';

import Image from 'next/image';
import React from 'react';
import { FaGithub, FaLinkedin } from 'react-icons/fa6';
import { FiGlobe, FiMail, FiX } from 'react-icons/fi'; // Added FiX for close button

interface AboutDevModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Data for Developer Social Links (copied from app/page.tsx for self-containment)
const socialLinksData = [
  {
    href: 'mailto:aadil.mugal.dev@gmail.com',
    label: 'Email',
    icon: <FiMail size={18} />,
    isExternal: false,
  },
  {
    href: 'https://www.linkedin.com/in/dev-aadil',
    label: 'LinkedIn',
    icon: <FaLinkedin size={18} />,
    isExternal: true,
  },
  {
    href: 'https://github.com/aadilmughal786',
    label: 'GitHub',
    icon: <FaGithub size={18} />,
    isExternal: true,
  },
  {
    href: 'https://aadilmughal786.github.io/portfolio-new/',
    label: 'Portfolio',
    icon: <FiGlobe size={18} />,
    isExternal: true,
  },
];

const SocialLink = ({
  href,
  label,
  icon,
  isExternal,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  isExternal: boolean;
}) => (
  <a
    href={href}
    target={isExternal ? '_blank' : '_self'}
    rel={isExternal ? 'noopener noreferrer' : ''}
    className="p-2 rounded-lg transition-colors cursor-pointer text-text-secondary bg-bg-tertiary hover:bg-border-primary hover:scale-110"
    aria-label={label}
  >
    {icon}
  </a>
);

const AboutDevModal: React.FC<AboutDevModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="flex fixed inset-0 z-[5000] justify-center items-center p-4 backdrop-blur-sm bg-black/60"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-dev-modal-title"
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
          <Image
            src="https://aadilmughal786.github.io/portfolio-new/images/aadil.png"
            alt="Developer Pic"
            width={160}
            height={160}
            className="object-cover mx-auto mb-6 w-40 h-40 rounded-full border-4 border-blue-400 shadow-lg"
          />
          <h3 className="mb-2 text-3xl font-bold text-text-primary">Aadil Mughal</h3>
          <p className="mb-6 text-xl text-text-tertiary">Full Stack Developer</p>
          <div className="flex gap-4 justify-center mb-8">
            {socialLinksData.map((link, index) => (
              <SocialLink
                key={index}
                href={link.href}
                label={link.label}
                icon={link.icon}
                isExternal={link.isExternal}
              />
            ))}
          </div>

          <div className="space-y-6 text-base leading-relaxed text-text-secondary">
            <p className="pt-4 text-sm italic text-text-muted">
              &quot;In a world of endless possibilities, focus is your superpower.&quot;
            </p>
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

export default AboutDevModal;
