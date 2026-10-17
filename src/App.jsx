import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ChairFly from './ChairFly.jsx';
import TopNav from './components/TopNav.jsx';
import SiteFooter from './components/SiteFooter.jsx';
import Contact from './pages/Contact.jsx';
import Home from './pages/Home.jsx';
import Quiz from './pages/Quiz.jsx';
import Wiki from './pages/Wiki.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <TopNav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chair-fly" element={<ChairFly />} />
        <Route path="/wiki/*" element={<Wiki />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<Home />} />
      </Routes>
      <SiteFooter />
    </BrowserRouter>
  );
}
