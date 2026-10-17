import { useLocation } from 'react-router-dom';

const SECTIONS = ['/chair-fly', '/wiki', '/quiz', '/contact'];

// The thank-you note lives on the home page only.
export default function SiteFooter() {
  const { pathname } = useLocation();
  if (!SECTIONS.some((s) => pathname === s || pathname.startsWith(`${s}/`))) return null;

  return (
    <footer className="site-footer">
      <p>Not an official source, only a study reference.</p>
    </footer>
  );
}
