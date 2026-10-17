import { useState } from 'react';

const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';

export default function ThemeToggle() {
  const [dark, setDark] = useState(isDark);
  const toggle = () => {
    const next = !dark;
    if (next) document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch {
      // storage unavailable; the choice just won't persist
    }
    setDark(next);
  };
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
    >
      {dark ? '☀' : '☾'}
    </button>
  );
}
