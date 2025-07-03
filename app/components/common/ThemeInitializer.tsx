// app/components/common/ThemeInitializer.tsx
'use client';

import React from 'react';

const themeScript = `
  (function() {
    try {
      const theme = localStorage.getItem('theme');
      if (theme === 'light' || theme === 'dark') {
        document.documentElement.classList.add(theme);
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      }
    } catch (e) {
      console.error('Could not set initial theme', e);
    }
  })();
`;

const ThemeInitializer: React.FC = () => {
  return <script dangerouslySetInnerHTML={{ __html: themeScript }} />;
};

export default ThemeInitializer;
