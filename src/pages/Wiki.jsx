import { Suspense, lazy, useState } from 'react';
import { Link, NavLink, useParams } from 'react-router-dom';
import CardView from '../components/CardView.jsx';
import { getNode } from '../routePlanner.js';
import RouteExplorer from '../wiki/RouteExplorer.jsx';
import { resolveRoute } from '../wiki/routes.js';
import { WIKI_TREE, findWikiPage } from '../wiki/structure.js';
const RouteMap = lazy(() => import('../RouteMap.jsx'));

function TreeItem({ item, parentPath, depth, onNavigate }) {
  const path = parentPath ? `${parentPath}/${item.slug}` : item.slug;
  const { '*': current = '' } = useParams();
  const isOpen = current === path || current.startsWith(`${path}/`);
  const [expanded, setExpanded] = useState(isOpen);
  const open = expanded || isOpen;

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

  return (
    <li>
      <button
        type="button"
        className="wiki-folder"
        style={{ paddingLeft: 10 + depth * 16 }}
        aria-expanded={open}
        onClick={() => setExpanded(!open)}
      >
        <span className="wiki-caret" aria-hidden="true">{open ? '▾' : '▸'}</span>
        {item.title}
      </button>
      {open && (
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

function WikiPage({ page }) {
  const node = page.node ? getNode(page.node) : null;
  const arrival = page.routes?.find((route) => route.to === page.node);
  const mapIds = arrival ? resolveRoute(arrival).leg?.arrivalFeatureIds : undefined;

  return (
    <article className="wiki-article">
      <nav className="wiki-crumbs" aria-label="Breadcrumb">
        <Link to="/wiki">Wiki</Link>
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
      {mapIds && (
        <div className="map-card">
          <Suspense fallback={<p className="map-unavailable">Loading map…</p>}>
            <RouteMap mapData={{ featureIds: mapIds }} />
          </Suspense>
        </div>
      )}
      {node?.info?.length > 0 && (
        <section>
          <h2>Overview</h2>
          <ol className="wiki-cards">
            {node.info.map((card, index) => (
              <li className="wiki-card" key={`${card.title}-${index}`}>
                <CardView event={card} />
              </li>
            ))}
          </ol>
        </section>
      )}
      {page.routes && (
        <section>
          <h2>Routes</h2>
          {page.routes.map((route, index) => (
            <RouteExplorer key={`${page.path}-${index}`} route={route} />
          ))}
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
    </article>
  );
}
export default function Wiki() {
  const { '*': path = '' } = useParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const page = path ? findWikiPage(path) : null;

  return (
    <div className="wiki-layout">
      <button
        type="button"
        className="wiki-drawer-toggle"
        aria-expanded={drawerOpen}
        onClick={() => setDrawerOpen(!drawerOpen)}
      >
        ☰ Browse wiki
      </button>
      <aside className={`wiki-sidebar${drawerOpen ? ' open' : ''}`} aria-label="Wiki sections">
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
      </aside>
      <div className="wiki-content">
        {page ? (
          <WikiPage page={page} />
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
