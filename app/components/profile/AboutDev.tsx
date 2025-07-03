// app/components/profile/AboutDev.tsx
'use client';

import Image from 'next/image';
import React from 'react';
import { FaGithub, FaLinkedin } from 'react-icons/fa6';
import { FiGlobe, FiMail } from 'react-icons/fi';

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

const AboutDev: React.FC = () => {
  return (
    // Outer container with minimal styling, blending with the page background
    <div className="overflow-hidden relative p-4 sm:p-8">
      {/* Removed all background effects */}

      <div className="relative z-10 pt-4 mb-12 text-center">
        {' '}
        {/* Adjusted padding */}
        <h1 className="mb-4 text-5xl font-extrabold leading-tight sm:text-6xl text-text-primary">
          Meet the <span className="text-blue-400">Creator</span>
        </h1>
        <p className="mx-auto max-w-4xl text-xl leading-relaxed sm:text-2xl text-text-secondary">
          Behind &quot;One Goal&quot; is a passion for focused productivity and thoughtful design.
        </p>
      </div>

      {/* Developer Info Block - Centralized, with subtle background/shadow */}
      <div className="relative z-10 p-8 mx-auto mb-12 max-w-lg text-center rounded-xl border shadow-lg bg-bg-secondary border-border-primary">
        <Image
          src="https://aadilmughal786.github.io/portfolio-new/images/aadil.png"
          alt="Developer Pic"
          width={180}
          height={180}
          className="object-cover mx-auto mb-8 w-44 h-44 rounded-full border-4 border-blue-400 shadow-xl transition-transform duration-300 transform hover:scale-105"
        />
        <h3 className="mb-3 text-4xl font-bold text-text-primary">Aadil Mughal</h3>
        <p className="mb-8 text-2xl text-text-tertiary">Full Stack Developer</p>
        <div className="flex gap-4 justify-center">
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
      </div>

      {/* Narrative Section - Simple stacked paragraphs */}
      <div className="relative z-10 mx-auto space-y-6 max-w-4xl text-xl leading-relaxed text-text-secondary">
        <p>
          As a developer, I&apos;ve always been drawn to creating tools that simplify complex
          challenges. The inspiration for <strong className="text-text-primary">One Goal</strong>{' '}
          emerged from my own experiences grappling with information overload and the constant
          pressure to juggle multiple tasks simultaneously.
        </p>
        <p>
          I came to realize that true impact and innovation aren&apos;t born from scattered efforts,
          but from deep, unwavering focus on a singular, most important objective. This application
          is my testament to that belief—a digital space designed to cut through the noise and
          empower users to channel all their energy into what truly matters.
        </p>
        <p className="pt-4 text-lg italic text-text-muted">
          &quot;In a world of endless possibilities, focus is your superpower.&quot;
        </p>
      </div>
    </div>
  );
};

export default AboutDev;
