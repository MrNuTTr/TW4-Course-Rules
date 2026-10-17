import { Suspense, lazy, useMemo, useState } from 'react';
import CardView from '../components/CardView.jsx';
import { buildBank, chairFlyLegs, choicesFor, shuffle } from '../quiz/bank.js';

const RouteMap = lazy(() => import('../RouteMap.jsx'));

const unique = (list) => [...new Set(list)];

function TopicQuiz({ session, setSession }) {
  const bank = useMemo(buildBank, []);
  const topics = useMemo(() => {
    const byGroup = {};
    for (const item of bank) {
      byGroup[item.group] ??= {};
      byGroup[item.group][item.topic] = (byGroup[item.group][item.topic] ?? 0) + 1;
    }
    return byGroup;
  }, [bank]);
  const [selected, setSelected] = useState(new Set());
  const [format, setFormat] = useState('mc');
  const [count, setCount] = useState(10);

  const pool = bank.filter((item) => selected.has(item.topic));
  const toggle = (topic) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(topic)) next.delete(topic);
      else next.add(topic);
      return next;
    });
  const setGroup = (group, on) =>
    setSelected((prev) => {
      const next = new Set(prev);
      for (const topic of Object.keys(topics[group])) {
        if (on) next.add(topic);
        else next.delete(topic);
      }
      return next;
    });

  const start = () => {
    let items = shuffle(pool);
    if (format === 'mc') items = items.filter((item) => item.answers.length === 1);
    if (count !== 'all') items = items.slice(0, count);
    setSession({
      items: items.map((item) => ({ ...item, choices: format === 'mc' ? choicesFor(item, bank) : null })),
      index: 0,
      score: 0,
      answered: null,
      revealed: false,
    });
  };

  if (session) return <TopicSession session={session} setSession={setSession} />;

  const available = format === 'mc' ? pool.filter((item) => item.answers.length === 1).length : pool.length;

  return (
    <section className="quiz-setup">
      <h2>Pick topics</h2>
      {Object.entries(topics).map(([group, entries]) => (
        <div key={group} className="quiz-group">
          <div className="quiz-group-head">
            <h3>{group}</h3>
            <button type="button" className="quiz-link" onClick={() => setGroup(group, true)}>All</button>
            <button type="button" className="quiz-link" onClick={() => setGroup(group, false)}>None</button>
          </div>
          <div className="quiz-chips">
            {Object.entries(entries).map(([topic, n]) => (
              <button
                key={topic}
                type="button"
                className={`quiz-chip${selected.has(topic) ? ' active' : ''}`}
                aria-pressed={selected.has(topic)}
                onClick={() => toggle(topic)}
              >
                {topic} <span>{n}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
      <div className="quiz-options">
        <label>
          Format
          <select value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="mc">Multiple choice</option>
            <option value="blank">Fill in the blank (reveal)</option>
          </select>
        </label>
        <label>
          Questions
          <select value={count} onChange={(e) => setCount(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value="all">All</option>
          </select>
        </label>
      </div>
      <button type="button" className="primary-button" disabled={available === 0} onClick={start}>
        {available === 0 ? 'Select a topic' : `Start (${available} available)`}
      </button>
    </section>
  );
}

function TopicSession({ session, setSession }) {
  const { items, index } = session;
  const score = items.reduce((sum, entry) => sum + (entry.gained || 0), 0);
  if (index >= items.length) {
    return (
      <section className="quiz-card">
        <h2>Done</h2>
        <p className="quiz-text">
          {score} of {items.length} correct
        </p>
        <button type="button" className="primary-button" onClick={() => setSession(null)}>
          New quiz
        </button>
      </section>
    );
  }
  const item = items[index];
  const mc = Boolean(item.choices);
  const { answered, revealed } = item;
  const correct = item.answers[0];
  const update = (patch) =>
    setSession({ ...session, items: items.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)) });
  const go = (delta) => setSession({ ...session, index: index + delta });
  const done = mc ? Boolean(answered) : item.gained !== undefined;
  const nav = (
    <div className="quiz-actions quiz-nav">
      <button type="button" className="secondary-button" disabled={index === 0} onClick={() => go(-1)}>
        Previous
      </button>
      <button type="button" className="primary-button" disabled={!done} onClick={() => go(1)}>
        Next
      </button>
    </div>
  );

  return (
    <section className="quiz-card">
      <div className="quiz-header">
        <p className="quiz-meta">
          {index + 1} / {items.length} · {item.topic} · {item.context}
        </p>
      </div>
      <p className="quiz-text">{item.text}</p>
      {mc ? (
        <>
          <div className="quiz-choices">
            {item.choices.map((choice) => {
              let state = '';
              if (answered) {
                if (choice === correct) state = ' correct';
                else if (choice === answered) state = ' wrong';
              }
              return (
                <button
                  key={choice}
                  type="button"
                  className={`quiz-choice${state}`}
                  disabled={Boolean(answered)}
                  onClick={() => update({ answered: choice, gained: choice === correct ? 1 : 0 })}
                >
                  {choice}
                </button>
              );
            })}
          </div>
        </>
      ) : revealed ? (
        <>
          <p className="quiz-answer">{item.answers.join(' · ')}</p>
          {item.gained === undefined ? (
            <div className="quiz-actions">
              <button type="button" className="secondary-button" onClick={() => update({ gained: 0 })}>Missed it</button>
              <button type="button" className="primary-button" onClick={() => update({ gained: 1 })}>Got it</button>
            </div>
          ) : (
            <p className="quiz-meta">{item.gained ? 'Marked: got it' : 'Marked: missed it'}</p>
          )}
        </>
      ) : (
        <div className="quiz-actions">
          <button type="button" className="primary-button" onClick={() => update({ revealed: true })}>
            Reveal answer
          </button>
        </div>
      )}
      {nav}
    </section>
  );
}

function ChairFlyQuiz({ session, setSession }) {
  const legs = useMemo(chairFlyLegs, []);
  const [from, setFrom] = useState('');
  const [fromPick, setFromPick] = useState('');
  const [to, setTo] = useState('');
  const [toPick, setToPick] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [hideOnNext, setHideOnNext] = useState(false);

  const matches = legs.filter(
    (leg) =>
      (!from || leg.fromNode === from) &&
      (!fromPick || leg.fromPicks.includes(fromPick)) &&
      (!to || leg.toNode === to) &&
      (!toPick || leg.toPicks.includes(toPick)),
  );
  const fromNodes = unique(legs.map((l) => l.fromNode));
  const toNodes = unique(legs.filter((l) => !from || l.fromNode === from).map((l) => l.toNode));
  const fromPicks = unique(legs.filter((l) => !from || l.fromNode === from).flatMap((l) => l.fromPicks));
  const toPicks = unique(
    legs.filter((l) => (!from || l.fromNode === from) && (!to || l.toNode === to)).flatMap((l) => l.toPicks),
  );

  if (session) {
    const leg = session.legs[session.leg];
    const card = leg?.cards[session.card];
    if (!leg) {
      return (
        <section className="quiz-card">
          <h2>Chair fly complete</h2>
          <button type="button" className="primary-button" onClick={() => setSession(null)}>New quiz</button>
        </section>
      );
    }
    const advance = () => {
      if (hideOnNext) setShowMap(false);
      const lastCard = session.card + 1 >= leg.cards.length;
      setSession({
        ...session,
        leg: lastCard ? session.leg + 1 : session.leg,
        card: lastCard ? 0 : session.card + 1,
        revealed: false,
      });
    };
    return (
      <section className="quiz-card">
        <div className="quiz-header">
          <p className="quiz-meta">
            Leg {session.leg + 1} / {session.legs.length} · Card {session.card + 1} / {leg.cards.length}
          </p>
          </div>
        <p className="quiz-leg">
          {leg.fromNode} {leg.fromPicks.join(', ')} → {leg.toNode} {leg.toPicks.join(', ')}
        </p>
        <div className="quiz-map-controls">
          <button type="button" className="home-button" aria-pressed={showMap} onClick={() => setShowMap(!showMap)}>
            {showMap ? 'Hide map' : 'Show map'}
          </button>
          <label>
            <input type="checkbox" checked={hideOnNext} onChange={(e) => setHideOnNext(e.target.checked)} />
            Hide map on next question
          </label>
        </div>
        {showMap && (
          <div className="map-card map-card-active">
            <Suspense fallback={<p className="map-unavailable">Loading map…</p>}>
              <RouteMap
                key={`${session.leg}-${session.card}`}
                mapData={{ featureIds: leg.featureIds }}
                focusFeatureId={card.mapFocus}
              />
            </Suspense>
          </div>
        )}
        {session.revealed ? (
          <CardView event={card} />
        ) : (
          <>
            <h2 className="guide-title">{card.title}</h2>
            <p className="quiz-text">What do you do, and what do you say?</p>
          </>
        )}
        <div className="quiz-actions">
          {session.revealed ? (
            <button type="button" className="primary-button" onClick={advance}>Next</button>
          ) : (
            <button type="button" className="primary-button" onClick={() => setSession({ ...session, revealed: true })}>
              Reveal
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="quiz-setup">
      <h2>Chair fly a route</h2>
      <p className="quiz-hint">Pick a start and a destination. You see each card's title, recall what happens, then reveal it.</p>
      <div className="quiz-options">
        <label>
          From
          <select value={from} onChange={(e) => { setFrom(e.target.value); setFromPick(''); setTo(''); setToPick(''); }}>
            <option value="">Anywhere</option>
            {fromNodes.map((n) => <option key={n}>{n}</option>)}
          </select>
        </label>
        <label>
          Runway / area
          <select value={fromPick} onChange={(e) => setFromPick(e.target.value)}>
            <option value="">Any</option>
            {fromPicks.map((n) => <option key={n}>{n}</option>)}
          </select>
        </label>
        <label>
          To
          <select value={to} onChange={(e) => { setTo(e.target.value); setToPick(''); }}>
            <option value="">Anywhere</option>
            {toNodes.map((n) => <option key={n}>{n}</option>)}
          </select>
        </label>
        <label>
          Runway / area / entry
          <select value={toPick} onChange={(e) => setToPick(e.target.value)}>
            <option value="">Any</option>
            {toPicks.map((n) => <option key={n}>{n}</option>)}
          </select>
        </label>
      </div>
      <button
        type="button"
        className="primary-button"
        disabled={matches.length === 0}
        onClick={() =>
          setSession({ legs: shuffle(matches).slice(0, 5), leg: 0, card: 0, revealed: false })
        }
      >
        {matches.length === 0 ? 'No matching routes' : `Start (${Math.min(matches.length, 5)} of ${matches.length} routes)`}
      </button>
    </section>
  );
}

export default function Quiz() {
  const [mode, setMode] = useState('topic');
  const [sessions, setSessions] = useState({ topic: null, chair: null });
  const setSessionFor = (key) => (value) => setSessions((prev) => ({ ...prev, [key]: value }));
  return (
    <div className="page-container quiz-page">
      <h1>Quiz</h1>
      <div className="quiz-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={mode === 'topic'} className={mode === 'topic' ? 'active' : ''} onClick={() => setMode('topic')}>
          Topic quiz
        </button>
        <button type="button" role="tab" aria-selected={mode === 'chair'} className={mode === 'chair' ? 'active' : ''} onClick={() => setMode('chair')}>
          Chair fly quiz
        </button>
        {sessions[mode] && (
          <button type="button" className="home-button quiz-quit" onClick={() => setSessionFor(mode)(null)}>
            Quit
          </button>
        )}
      </div>
      {mode === 'topic' ? (
        <TopicQuiz session={sessions.topic} setSession={setSessionFor('topic')} />
      ) : (
        <ChairFlyQuiz session={sessions.chair} setSession={setSessionFor('chair')} />
      )}
    </div>
  );
}






