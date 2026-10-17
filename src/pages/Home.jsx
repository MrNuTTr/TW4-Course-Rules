import { Link } from 'react-router-dom';

const SECTIONS = [
  { to: '/chair-fly', title: 'Chair Fly', text: 'Walk a route leg by leg with the map and radio calls.' },
  { to: '/wiki', title: 'Wiki', text: 'Browse every departure, working area, outlying field and arrival.' },
  { to: '/quiz', title: 'Quiz', text: 'Test yourself on altitudes, calls and procedures.' },
];

export default function Home() {
  return (
    <div className="page-container">
      <p className="eyebrow">TW-4 · NAS CORPUS CHRISTI</p>
      <h1>TW-4 Course Rules</h1>
      <div className="home-cards">
        {SECTIONS.map((s) => (
          <Link key={s.to} to={s.to} className="home-card">
            <h2>{s.title}</h2>
            <p>{s.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
