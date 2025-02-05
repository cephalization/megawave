/**
 * Button that adds and removes the dark class from the html element
 */
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { useEffect } from 'react';
import { useState } from 'react';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <button
      className="flex items-center gap-2 bg-secondary text-sm font-bold text-secondary-foreground px-4 py-2 mx-4 rounded-md"
      onClick={() => setIsDark(!isDark)}
    >
      {isDark ? (
        <SunIcon className="w-5 h-5" />
      ) : (
        <MoonIcon className="w-5 h-5" />
      )}
      {isDark ? 'Go Light' : 'Go Dark'}
    </button>
  );
}
