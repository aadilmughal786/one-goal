// app/components/common/ThemeToggle.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { FiMoon, FiSun } from 'react-icons/fi';

const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // This effect runs only on the client, after the component has mounted.
    // It reads the initial theme from the DOM, which was set by the ThemeInitializer script.
    setMounted(true);
    const root = window.document.documentElement;
    setTheme(root.classList.contains('dark') ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    const root = window.document.documentElement;
    const newTheme = theme === 'light' ? 'dark' : 'light';

    // Update the class on the <html> element.
    root.classList.remove(theme);
    root.classList.add(newTheme);

    // Save the user's preference to localStorage.
    localStorage.setItem('theme', newTheme);

    // Update the component's state.
    setTheme(newTheme);
  };

  // To prevent hydration mismatch, we render a placeholder until the component is mounted on the client.
  if (!mounted) {
    return <div className="w-12 h-9" />; // Placeholder to prevent layout shift
  }

  return (
    <button
      onClick={toggleTheme}
      className="flex justify-center items-center w-12 h-9 rounded-md transition-colors cursor-pointer bg-bg-tertiary text-text-secondary hover:bg-border-primary"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
    </button>
  );
};

export default ThemeToggle;
