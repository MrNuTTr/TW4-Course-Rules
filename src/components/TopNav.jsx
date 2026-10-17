import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle.jsx';

export default function TopNav() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);

  return (
    <nav className={`top-nav${open ? ' menu-open' : ''}`} aria-label="Main">
      <NavLink to="/" end className="top-nav-brand">TW-4 Course Rules</NavLink>
      <div className="top-nav-actions">
        <ThemeToggle />
        <button
          type="button"
          className="nav-menu-button"
          aria-expanded={open}
          aria-controls="nav-links"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? '✕' : '☰'}
        </button>
      </div>
      <div className="top-nav-links" id="nav-links">
        <NavLink to="/chair-fly">Chair Fly</NavLink>
        <NavLink to="/wiki">Wiki</NavLink>
        <NavLink to="/quiz">Quiz</NavLink>
        <NavLink to="/contact">Contact</NavLink>
      </div>
    </nav>
  );
}
