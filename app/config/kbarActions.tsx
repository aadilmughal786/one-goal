// app/config/kbarActions.tsx
'use client';

import { Action } from 'kbar';
import router from 'next/router';
import {
  FiCheckSquare,
  FiCpu,
  FiGithub,
  FiHome,
  FiLinkedin,
  FiTarget,
  FiUser,
} from 'react-icons/fi';
import { GoStopwatch } from 'react-icons/go';
import { MdOutlineRepeat } from 'react-icons/md';

// This custom hook will generate the actions, accepting dependencies like the router.
export const kBarActions: Action[] = [
  // Navigation
  {
    id: 'home',
    name: 'Home',
    shortcut: ['h'],
    keywords: 'home dashboard',
    section: 'Navigation',
    perform: () => router.push('/dashboard'),
    icon: <FiHome />,
  },
  {
    id: 'tasks',
    name: 'Tasks & Lists',
    shortcut: ['t'],
    keywords: 'tasks todo lists',
    section: 'Navigation',
    perform: () => router.push('/todo'),
    icon: <FiCheckSquare />,
  },
  {
    id: 'stopwatch',
    name: 'Stopwatch',
    shortcut: ['s'],
    keywords: 'stopwatch timer focus',
    section: 'Navigation',
    perform: () => router.push('/stop-watch'),
    icon: <GoStopwatch />,
  },
  {
    id: 'routine',
    name: 'Routine',
    shortcut: ['r'],
    keywords: 'routine habits',
    section: 'Navigation',
    perform: () => router.push('/routine'),
    icon: <MdOutlineRepeat />,
  },
  {
    id: 'goals',
    name: 'Goals',
    shortcut: ['g'],
    keywords: 'goals objectives',
    section: 'Navigation',
    perform: () => router.push('/goal'),
    icon: <FiTarget />,
  },
  {
    id: 'profile',
    name: 'Profile',
    shortcut: ['p'],
    keywords: 'profile settings account',
    section: 'Navigation',
    perform: () => router.push('/profile'),
    icon: <FiUser />,
  },
  {
    id: 'tools',
    name: 'Tools',
    shortcut: ['c'],
    keywords: 'tools calculator',
    section: 'Navigation',
    perform: () => router.push('/tools'),
    icon: <FiCpu />,
  },

  // External Links
  {
    id: 'github',
    name: 'GitHub',
    keywords: 'github source code',
    section: 'External Links',
    perform: () => window.open('https://github.com/aadilmughal786/one-goal', '_blank'),
    icon: <FiGithub />,
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    keywords: 'linkedin developer',
    section: 'External Links',
    perform: () => window.open('https://www.linkedin.com/in/dev-aadil', '_blank'),
    icon: <FiLinkedin />,
  },
];
