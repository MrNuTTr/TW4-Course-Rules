import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import ChairFly from './ChairFly.jsx';
import Contact from './pages/Contact.jsx';
import Home from './pages/Home.jsx';
import Quiz from './pages/Quiz.jsx';
import Wiki from './pages/Wiki.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <nav className="top-nav" aria-label="Main">
        <NavLink to="/" end className="top-nav-brand">TW-4 Course Rules</NavLink>
        <div className="top-nav-links">
          <NavLink to="/chair-fly">Chair Fly</NavLink>
          <NavLink to="/wiki">Wiki</NavLink>
          <NavLink to="/quiz">Quiz</NavLink>
          <NavLink to="/contact">Contact</NavLink>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chair-fly" element={<ChairFly />} />
        <Route path="/wiki/*" element={<Wiki />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}
