import { useLocation } from 'react-router-dom';

const SECTIONS = ['/chair-fly', '/wiki', '/quiz', '/contact'];

// The home page carries its own copy of this note, so the footer skips it.
export default function SiteFooter() {
  const { pathname } = useLocation();
  if (!SECTIONS.some((s) => pathname === s || pathname.startsWith(`${s}/`))) return null;

  return (
    <footer className="site-footer">
      <p>Not an official source, only a study reference.</p>
      <p>
        Huge thank you to Francis Chval for the{' '}
        <a href="https://drive.google.com/drive/folders/1zRndKMJi24wtqIwm_tSC3z71ZMJgFVEk?usp=sharing" target="_blank" rel="noopener noreferrer">
          map data
        </a>
        .
      </p>
    </footer>
  );
}
