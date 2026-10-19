import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Navigate, useLocation, useParams } from 'react-router-dom';
import CardView from '../components/CardView.jsx';
import ReportLink from '../components/ReportLink.jsx';
import { getNode } from '../routePlanner.js';
import RouteExplorer from '../wiki/RouteExplorer.jsx';
import { resolveRoute } from '../wiki/routes.js';
import { WIKI_TREE, findWikiPage } from '../wiki/structure.js';
import { searchWiki } from '../wiki/search.js';
import { COURSE_RULES_MAP_FEATURES } from '../courseRulesMap.js';
import { loadSaved, save } from '../storage.js';
import { parseFocus } from '../wiki/focus.js';
import { revealCard } from '../wiki/reveal.js';
const RouteMap = lazy(() => import('../RouteMap.jsx'));

const DEFAULT_WIKI_PATH = 'airfields/kngp';
const LAST_PAGE_KEY = 'wiki-last';
const LAST_PAGE_VERSION = 2;

// Working-area pages map every area in the group, labelled; sub-pages highlight their own.
const AREA_GROUPS = {
  'working-areas/kings-4': { folder: 'Kings 4 MOAs' },
  'working-areas/mustang': {
    folder: 'Mustang Working Areas',
    focus: { north: 'Mustang North', central: 'Mustang Central', south: 'Mustang South' },
  },
  'working-areas/foxtrot': { folder: 'Foxtrot Working Areas' },
};

function TreeItem({ item, parentPath, depth, onNavigate }) {
  const path = parentPath ? `${parentPath}/${item.slug}` : item.slug;
  const { '*': current = '' } = useParams();
  const isOpen = current === path || current.startsWith(`${path}/`);
  const [expanded, setExpanded] = useState(isOpen);

  // Arriving inside a folder opens it; the arrow can still collapse it afterwards.
  useEffect(() => {
    if (isOpen) setExpanded(true);
  }, [isOpen]);

  if (!item.children) {
    return (
      <li>
        <NavLink
          to={`/wiki/${path}`}
          className="wiki-link"
          style={{ paddingLeft: 14 + depth * 16 }}
          onClick={onNavigate}
        >
          {item.title}
        </NavLink>
      </li>
    );
  }

  // The arrow opens and closes the folder; the name opens the folder's own page.
  return (
    <li>
      <div className="wiki-folder-row">
        <button
          type="button"
          className="wiki-folder-toggle"
          style={{ paddingLeft: 10 + depth * 16 }}
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Collapse' : 'Expand'} ${item.title}`}
          onClick={() => setExpanded(!expanded)}
        >
          <span className="wiki-caret" aria-hidden="true">{expanded ? '▾' : '▸'}</span>
        </button>
        <NavLink to={`/wiki/${path}`} end className="wiki-link wiki-folder-link" onClick={onNavigate}>
          {item.title}
        </NavLink>
      </div>
      {expanded && (
        <ul>
          {item.children.map((child) => (
            <TreeItem
              key={child.slug}
              item={child}
              parentPath={path}
              depth={depth + 1}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function WikiPage({ page, focus, search }) {
  const node = page.node ? getNode(page.node) : null;
  const arrival = page.routes?.find((route) => route.to === page.node);
  const arrivalIds = arrival ? resolveRoute(arrival).leg?.arrivalFeatureIds : undefined;
  const airfieldRoot = arrivalIds?.[0]?.split('/')[0];
  // Outlying-field pages show the whole field: every initial, runway and arrival track.
  const showWholeField = node?.kind !== 'work-area' && airfieldRoot && !airfieldRoot.startsWith('(KNGP)');
  const mapIds = showWholeField
    ? COURSE_RULES_MAP_FEATURES.filter((f) => f.id.startsWith(`${airfieldRoot}/`) && !f.id.includes('Departures')).map((f) => f.id)
    : page.node === 'kngp'
      ? COURSE_RULES_MAP_FEATURES.filter((f) => f.id.startsWith('(KNGP) Corpus Christi NAS/') && f.id.split('/').length === 2).map((f) => f.id)
      : arrivalIds;
  const areaGroup = AREA_GROUPS[page.path] ?? AREA_GROUPS[page.trail.slice(0, 2).join('/')];
  const areaIds = areaGroup
    ? COURSE_RULES_MAP_FEATURES.filter((f) => f.id.startsWith(`${areaGroup.folder}/`)).map((f) => f.id)
    : null;
  const areaFocus = areaGroup?.focus?.[page.slug]
    ? areaIds.filter((id) => id.includes(areaGroup.focus[page.slug]))
    : [];
  const shownIds = areaIds ?? mapIds;

  return (
    <article className="wiki-article">
      <nav className="wiki-crumbs" aria-label="Breadcrumb">
        <Link to={`/wiki/${DEFAULT_WIKI_PATH}`}>Wiki</Link>
        {page.trail.map((slug, i) => {
          const crumb = findWikiPage(page.trail.slice(0, i + 1).join('/'));
          return (
            <span key={slug}>
              {' / '}
              <Link to={`/wiki/${crumb.path}`}>{crumb.title}</Link>
            </span>
          );
        })}
      </nav>
      <h1>{page.title}</h1>
      {shownIds && (
        <div className="map-card">
          <Suspense fallback={<p className="map-unavailable">Loading map…</p>}>
            <RouteMap
              key={page.path}
              mapData={{ featureIds: shownIds }}
              focusFeatureId={areaFocus}
              maxZoom={areaIds ? 10 : showWholeField || page.node === 'kngp' ? 13 : 11}
              labelKeyPoints
              labelAreas={Boolean(areaIds)}
              fitToField={!areaIds && (showWholeField || page.node === 'kngp')}
              layerToggles={!areaIds}
            />
          </Suspense>
        </div>
      )}
      {node?.info?.length > 0 && (
        <section>
          <h2>Overview</h2>
          <ol className="wiki-cards">
            {node.info.map((card, index) => {
              const focused = focus?.info === index;
              return (
                <li
                  className={`wiki-card${focused ? ' wiki-card-focus' : ''}`}
                  key={`${card.title}-${index}`}
                  ref={focused ? revealCard : undefined}
                >
                  <CardView event={card} />
                </li>
              );
            })}
          </ol>
        </section>
      )}
      {page.routes && (
        <section>
          <h2>Routes</h2>
          {page.routes.map((route, index) => {
            const routeFocus = focus?.route === index ? focus : undefined;
            return (
              <RouteExplorer
                key={`${page.path}-${index}-${routeFocus ? search : ''}`}
                route={route}
                target={routeFocus}
                defaultOpen={page.routes.length === 1}
              />
            );
          })}
        </section>
      )}
      {!node && !page.routes && !page.children && (
        <p className="wiki-placeholder">Content coming soon.</p>
      )}
      {page.children && (
        <section>
          <h2>In this section</h2>
          <ul className="wiki-children">
            {page.children.map((child) => (
              <li key={child.slug}>
                <Link to={`/wiki/${page.path}/${child.slug}`}>{child.title}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="wiki-report"><ReportLink context={`Wiki: ${page.title}`} /></p>
    </article>
  );
}
export default function Wiki() {
  const { '*': path = '' } = useParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const page = path ? findWikiPage(path) : null;
  const results = useMemo(() => searchWiki(query), [query]);
  const searching = query.trim().length > 0;
  const { state, search } = useLocation();
  const scrollRef = useRef(0);

  // Remember the open page and how far down it is scrolled; a redirect from the bare /wiki
  // link passes the saved position back in through router state.
  useEffect(() => {
    if (!page) return undefined;
    if (state?.restoreScroll) window.scrollTo(0, state.restoreScroll);
    scrollRef.current = window.scrollY;
    const store = () => save(LAST_PAGE_KEY, LAST_PAGE_VERSION, { path: page.path, scroll: scrollRef.current });
    let frame = 0;
    const onScroll = () => {
      scrollRef.current = window.scrollY;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(store);
    };
    store();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
      store();
    };
  }, [page?.path]);

  if (!path) {
    const last = loadSaved(LAST_PAGE_KEY, LAST_PAGE_VERSION);
    const target = last && findWikiPage(last.path) ? last : { path: DEFAULT_WIKI_PATH, scroll: 0 };
    return <Navigate to={`/wiki/${target.path}`} state={{ restoreScroll: target.scroll }} replace />;
  }

  function closeSearch() {
    setQuery('');
    setDrawerOpen(false);
  }

  return (
    <div className="wiki-layout">
      <button
        type="button"
        className="wiki-drawer-toggle"
        aria-expanded={drawerOpen}
        onClick={() => setDrawerOpen(!drawerOpen)}
      >
        <span>{drawerOpen ? '✕' : '☰'} Browse wiki</span>
        {page && <span className="wiki-drawer-current">{page.title}</span>}
      </button>
      <aside className={`wiki-sidebar${drawerOpen ? ' open' : ''}`} aria-label="Wiki sections">
        <input
          type="search"
          className="wiki-search"
          placeholder="Search the wiki…"
          aria-label="Search the wiki"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {searching ? (
          <ul className="wiki-results">
            {results.length === 0 && <li className="wiki-no-results">No matches.</li>}
            {results.map(({ page: hit, snippet }) => (
              <li key={hit.path}>
                <Link to={`/wiki/${hit.path}`} onClick={closeSearch}>
                  <strong>{hit.title}</strong>
                  {hit.trail.length > 0 && <span className="wiki-result-trail">{hit.trail.join(' › ')}</span>}
                  {snippet && <span className="wiki-result-snippet">{snippet}</span>}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <ul>
            {WIKI_TREE.map((item) => (
              <TreeItem
                key={item.slug}
                item={item}
                parentPath=""
                depth={0}
                onNavigate={() => setDrawerOpen(false)}
              />
            ))}
          </ul>
        )}
      </aside>
      <div className="wiki-content">
        {page ? (
          <WikiPage page={page} focus={parseFocus(search)} search={search} />
        ) : (
          <article className="wiki-article">
            <h1>Course Rules Wiki</h1>
            <p className="wiki-placeholder">
              {path ? 'That page does not exist.' : 'Pick a section from the sidebar to begin.'}
            </p>
          </article>
        )}
      </div>
    </div>
  );
}
