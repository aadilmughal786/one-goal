// app/components/common/FloatingThemeToggle.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { FiMoon, FiSun } from 'react-icons/fi';

/**
 * A floating theme toggle button designed for pages without the main navigation,
 * such as the landing and login pages. It allows users to switch between light and
 * dark themes.
 */
const FloatingThemeToggle: React.FC = () => {
  // State to hold the current theme ('light' or 'dark').
  const [theme, setTheme] = useState('dark');
  // State to ensure the component only renders on the client-side to prevent hydration mismatch.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Once the component mounts on the client, we can safely check the theme.
    setMounted(true);
    const root = window.document.documentElement;
    const initialTheme = root.classList.contains('dark') ? 'dark' : 'light';
    setTheme(initialTheme);
  }, []);

  /**
   * Toggles the theme by updating the class on the <html> element,
   * saving the preference to localStorage, and updating the component's state.
   */
  const toggleTheme = () => {
    const root = window.document.documentElement;
    const newTheme = theme === 'light' ? 'dark' : 'light';

    root.classList.remove(theme);
    root.classList.add(newTheme);

    localStorage.setItem('theme', newTheme);
    setTheme(newTheme);
  };

  // Avoid rendering the button on the server or before the client has mounted.
  if (!mounted) {
    return null;
  }

  return (
    <button
      onClick={toggleTheme}
      className="flex fixed top-5 right-5 z-50 justify-center items-center w-12 h-12 rounded-full border backdrop-blur-md transition-all duration-300 cursor-pointer bg-bg-secondary/50 border-border-primary text-text-secondary hover:bg-bg-tertiary hover:scale-110"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'dark' ? <FiSun size={24} /> : <FiMoon size={24} />}
    </button>
  );
};

export default FloatingThemeToggle;
