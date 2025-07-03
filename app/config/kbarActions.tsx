// app/config/kbarActions.ts

import { Action } from 'kbar';
// Import useRouter from next/navigation for correct type inference
import { useNotificationStore } from '@/store/useNotificationStore';
import { useRouter } from 'next/navigation';
import { FaCode } from 'react-icons/fa6';
import {
  FiCheckSquare,
  FiCpu,
  FiGithub,
  FiHome,
  FiInfo, // Added FiInfo for App Info
  FiLinkedin,
  FiMoon,
  FiPlus,
  FiSun,
  FiTarget,
  FiUser,
} from 'react-icons/fi';
import { GoStopwatch } from 'react-icons/go';
import { MdOutlineRepeat } from 'react-icons/md';

/**
 * Generates an array of KBar actions for the application.
 * This function is designed to be dynamic, allowing actions to use router
 * and other global functions (like theme toggling).
 *
 * @param router The Next.js App Router instance to enable navigation actions.
 * @param toggleTheme A function to toggle the application's theme.
 * @param openAboutDevModal A function to open the About Dev modal.
 * @param openAppInfoModal A function to open the App Info modal.
 * @returns An array of KBar Action objects.
 */
export const getKbarActions = (
  router: ReturnType<typeof useRouter>,
  toggleTheme: () => void,
  openAboutDevModal: () => void, // New prop for About Dev modal
  openAppInfoModal: () => void // New prop for App Info modal
): Action[] => {
  const showToast = useNotificationStore.getState().showToast;

  return [
    // --- Main Navigation Actions ---
    {
      id: 'home',
      name: 'Dashboard Overview',
      shortcut: ['d'], // Changed from 'h' to 'd' for Dashboard
      keywords: 'home dashboard overview main',
      section: 'Navigation',
      perform: () => router.push('/dashboard?tab=main'),
      icon: <FiHome />,
    },
    {
      id: 'tasks',
      name: 'My Tasks',
      shortcut: ['t'],
      keywords: 'tasks todo lists management',
      section: 'Navigation',
      perform: () => router.push('/todo?tab=todo'),
      icon: <FiCheckSquare />,
    },
    {
      id: 'stopwatch',
      name: 'Stopwatch Timer',
      shortcut: ['s'],
      keywords: 'stopwatch timer focus session',
      section: 'Navigation',
      perform: () => router.push('/stop-watch?tab=stopwatch'),
      icon: <GoStopwatch />,
    },
    {
      id: 'routine',
      name: 'Sleep Routine',
      shortcut: ['r'],
      keywords: 'routine habits sleep',
      section: 'Navigation',
      perform: () => router.push('/routine?tab=sleep'),
      icon: <MdOutlineRepeat />,
    },
    {
      id: 'goals',
      name: 'Goal Hub',
      shortcut: ['g'],
      keywords: 'goals objectives mission tracking',
      section: 'Navigation',
      perform: () => router.push('/goal?tab=hub'),
      icon: <FiTarget />,
    },
    {
      id: 'profile',
      name: 'User Profile',
      shortcut: ['p'],
      keywords: 'profile settings account user data',
      section: 'Navigation',
      perform: () => router.push('/profile?tab=profile'),
      icon: <FiUser />,
    },
    {
      id: 'tools',
      name: 'Chat Calculator',
      shortcut: ['c'],
      keywords: 'tools calculator math',
      section: 'Navigation',
      perform: () => router.push('/tools?tab=calculator'),
      icon: <FiCpu />,
    },

    // --- Sub-Navigation Actions (Tasks & Lists) ---
    {
      id: 'distractions',
      name: 'What Not To Do List',
      shortcut: ['t', 'd'], // New: Tasks + Distraction
      keywords: 'distractions avoid list not-to-do',
      section: 'Navigation (Tasks & Lists)',
      perform: () => router.push('/todo?tab=distractions'),
      icon: <FiCheckSquare />, // Reusing icon for context
    },
    {
      id: 'stickyNotes',
      name: 'Sticky Notes',
      shortcut: ['t', 'n'], // New: Tasks + Notes
      keywords: 'notes sticky memos ideas',
      section: 'Navigation (Tasks & Lists)',
      perform: () => router.push('/todo?tab=notes'),
      icon: <FiCheckSquare />, // Reusing icon for context
    },
    {
      id: 'randomPicker',
      name: 'Random Picker',
      shortcut: ['t', 'p'], // New: Tasks + Picker
      keywords: 'picker random decision choose',
      section: 'Navigation (Tasks & Lists)',
      perform: () => router.push('/todo?tab=picker'),
      icon: <FiCheckSquare />, // Reusing icon for context
    },

    // --- Sub-Navigation Actions (Stopwatch) ---
    {
      id: 'sessionLog',
      name: 'Stopwatch Session Log',
      shortcut: ['s', 'l'], // New: Stopwatch + Log
      keywords: 'session log history timer',
      section: 'Navigation (Stopwatch)',
      perform: () => router.push('/stop-watch?tab=log'),
      icon: <GoStopwatch />, // Reusing icon for context
    },

    // --- Sub-Navigation Actions (Routine) ---
    {
      id: 'waterRoutine',
      name: 'Water Tracker',
      shortcut: ['r', 'w'], // New: Routine + Water
      keywords: 'routine water hydration drink',
      section: 'Navigation (Routine)',
      perform: () => router.push('/routine?tab=water'),
      icon: <MdOutlineRepeat />, // Reusing icon for context
    },
    {
      id: 'exerciseRoutine',
      name: 'Exercise Tracker',
      shortcut: ['r', 'e'], // New: Routine + Exercise
      keywords: 'routine exercise workout fitness',
      section: 'Navigation (Routine)',
      perform: () => router.push('/routine?tab=exercise'),
      icon: <MdOutlineRepeat />, // Reusing icon for context
    },
    {
      id: 'mealsRoutine',
      name: 'Meal Schedule',
      shortcut: ['r', 'm'], // New: Routine + Meals
      keywords: 'routine meals food diet',
      section: 'Navigation (Routine)',
      perform: () => router.push('/routine?tab=meals'),
      icon: <MdOutlineRepeat />, // Reusing icon for context
    },
    {
      id: 'teethRoutine',
      name: 'Teeth Care Schedule',
      shortcut: ['r', 'th'], // New: Routine + Teeth
      keywords: 'routine teeth dental hygiene',
      section: 'Navigation (Routine)',
      perform: () => router.push('/routine?tab=teeth'),
      icon: <MdOutlineRepeat />, // Reusing icon for context
    },
    {
      id: 'bathRoutine',
      name: 'Bath & Hygiene Schedule',
      shortcut: ['r', 'b'], // New: Routine + Bath
      keywords: 'routine bath hygiene shower',
      section: 'Navigation (Routine)',
      perform: () => router.push('/routine?tab=bath'),
      icon: <MdOutlineRepeat />, // Reusing icon for context
    },

    // --- Sub-Navigation Actions (Goals) ---
    {
      id: 'goalResources',
      name: 'Goal Resources',
      shortcut: ['g', 'r'], // New: Goals + Resources
      keywords: 'goals resources links files documents',
      section: 'Navigation (Goals)',
      perform: () => router.push('/goal?tab=resources'),
      icon: <FiTarget />, // Reusing icon for context
    },

    // --- Sub-Navigation Actions (Profile) ---
    {
      id: 'dataManagement',
      name: 'Data Management',
      shortcut: ['p', 'd'], // New: Profile + Data
      keywords: 'profile data import export reset',
      section: 'Navigation (Profile)',
      perform: () => router.push('/profile?tab=data'),
      icon: <FiUser />, // Reusing icon for context
    },
    {
      id: 'wellnessSettings',
      name: 'Wellness Settings',
      shortcut: ['p', 'w'], // New: Profile + Wellness
      keywords: 'profile wellness reminders water eye-care stretch break posture',
      section: 'Navigation (Profile)',
      perform: () => router.push('/profile?tab=wellness'),
      icon: <FiUser />, // Reusing icon for context
    },
    {
      id: 'aboutDevPage',
      name: 'About Developer Page',
      shortcut: ['p', 'a'], // New: Profile + About
      keywords: 'profile about dev aadi mughal creator',
      section: 'Navigation (Profile)',
      perform: () => router.push('/profile?tab=about-dev'),
      icon: <FaCode />,
    },

    // --- Sub-Navigation Actions (Tools) ---
    {
      id: 'timeEstimator',
      name: 'Time Estimator',
      shortcut: ['c', 't'], // New: Tools + Time
      keywords: 'tools time estimator calculate days',
      section: 'Navigation (Tools)',
      perform: () => router.push('/tools?tab=estimator'),
      icon: <FiCpu />, // Reusing icon for context
    },
    {
      id: 'drawingPad',
      name: 'Drawing Pad',
      shortcut: ['c', 'd'], // New: Tools + Drawing
      keywords: 'tools drawing sketch pad',
      section: 'Navigation (Tools)',
      perform: () => router.push('/tools?tab=drawing'),
      icon: <FiCpu />, // Reusing icon for context
    },

    // --- Direct Creation Actions ---
    {
      id: 'createGoal',
      name: 'Create New Goal',
      shortcut: ['n', 'g'],
      keywords: 'new goal create objective mission add',
      section: 'Actions',
      perform: () => {
        router.push('/goal?tab=hub&action=newGoal');
        showToast('Opening new goal form. Fill in details to create.', 'info');
      },
      icon: <FiPlus />,
    },
    {
      id: 'addTask',
      name: 'Add New Task',
      shortcut: ['n', 't'],
      keywords: 'new task todo item add',
      section: 'Actions',
      perform: () => {
        router.push('/todo?tab=todo&action=newTask');
        showToast('Navigating to tasks. Start typing your new task.', 'info');
      },
      icon: <FiPlus />,
    },
    {
      id: 'addDistraction',
      name: 'Add Distraction',
      shortcut: ['n', 'd'],
      keywords: 'new distraction what not to do add',
      section: 'Actions',
      perform: () => {
        router.push('/todo?tab=distractions&action=newDistraction');
        showToast('Navigating to distractions. Start typing your new distraction.', 'info');
      },
      icon: <FiPlus />,
    },
    {
      id: 'addStickyNote',
      name: 'Add Sticky Note',
      shortcut: ['n', 's'],
      keywords: 'new note sticky idea memo add',
      section: 'Actions',
      perform: () => {
        router.push('/todo?tab=notes&action=newNote');
        showToast('Navigating to sticky notes. A new note has been created.', 'info');
      },
      icon: <FiPlus />,
    },
    {
      id: 'toggleTheme',
      name: 'Toggle Theme',
      shortcut: ['l'], // New: 'l' for light/dark
      keywords: 'theme dark light mode switch',
      section: 'Actions',
      perform: toggleTheme,
      icon: (
        <>
          <FiSun className="dark:hidden" />
          <FiMoon className="hidden dark:inline" />
        </>
      ),
    },
    {
      id: 'showAboutDevModal',
      name: 'Show About Developer Info',
      shortcut: ['a', 'd'], // New: About Dev
      keywords: 'about dev modal creator info',
      section: 'Modals',
      perform: () => openAboutDevModal(),
      icon: <FaCode />,
    },
    {
      id: 'showAppInfoModal',
      name: 'Show App Information',
      shortcut: ['a', 'i'], // New: App Info
      keywords: 'app info version details about',
      section: 'Modals',
      perform: () => openAppInfoModal(),
      icon: <FiInfo />,
    },

    // --- External Links ---
    {
      id: 'github',
      name: 'GitHub Repository',
      keywords: 'github source code',
      section: 'External Links',
      perform: () => window.open('https://github.com/aadilmughal786/one-goal', '_blank'),
      icon: <FiGithub />,
    },
    {
      id: 'linkedin',
      name: 'Developer LinkedIn',
      keywords: 'linkedin developer Aadil',
      section: 'External Links',
      perform: () => window.open('https://www.linkedin.com/in/dev-aadil', '_blank'),
      icon: <FiLinkedin />,
    },
    {
      id: 'portfolio',
      name: 'Developer Portfolio',
      keywords: 'portfolio Aadil mughal website',
      section: 'External Links',
      perform: () => window.open('https://aadilmughal786.github.io/portfolio-new/', '_blank'),
      icon: <FiCpu />, // Reusing a general icon, could be a custom one if available
    },
  ];
};
