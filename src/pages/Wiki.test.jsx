// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildBank } from '../quiz/bank.js';
import { wikiHref } from '../wiki/focus.js';
import Wiki from './Wiki.jsx';

vi.mock('../RouteMap.jsx', () => ({ default: () => null }));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

async function renderAt(url) {
  const container = document.createElement('div');
  const root = createRoot(container);
  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path="/wiki/*" element={<Wiki />} />
        </Routes>
      </MemoryRouter>,
    );
  });
  return { container, unmount: () => act(async () => root.unmount()) };
}

async function headingAt(url) {
  const { container, unmount } = await renderAt(url);
  const heading = container.querySelector('h1').textContent;
  await unmount();
  return heading;
}

describe('Wiki quiz links', () => {
  beforeEach(() => window.localStorage.clear());

  it('opens the route and highlights the card a quiz question came from', async () => {
    const item = buildBank().find((i) => i.text.startsWith('Fly direct to Point Chapman'));
    expect(item.wiki.path).toBe('arrivals/sunrise-transition');
    const { container, unmount } = await renderAt(wikiHref(item.wiki));
    expect(container.querySelector('details.wiki-route').open).toBe(true);
    expect(container.querySelector('.wiki-card-focus h2').textContent).toBe(item.wiki.cardTitle);
    await unmount();
  });

  it('highlights an overview card', async () => {
    const { container, unmount } = await renderAt('/wiki/airfields/aransas-county?card=info.4');
    expect(container.querySelector('.wiki-card-focus h2').textContent).toBe('Warnings');
    await unmount();
  });

  it('marks a page that has sub-pages as current in the sidebar, and lets the arrow collapse it', async () => {
    const { container, unmount } = await renderAt('/wiki/working-areas/mustang');
    expect(container.querySelector('.wiki-folder-link.active').textContent).toBe('Mustang');
    expect(container.textContent).toContain('Mustang North');
    const toggle = container.querySelector('button[aria-label="Collapse Mustang"]');
    await act(async () => toggle.click());
    expect(container.querySelector('.wiki-sidebar').textContent).not.toContain('Mustang North');
    await unmount();
  });
});

describe('Wiki landing', () => {
  beforeEach(() => window.localStorage.clear());

  it('opens at KNGP when nothing has been viewed', async () => {
    expect(await headingAt('/wiki')).toBe('KNGP');
  });

  it('returns to the last page viewed instead of resetting', async () => {
    expect(await headingAt('/wiki/airfields/aransas-county')).toBe('Aransas County');
    expect(await headingAt('/wiki')).toBe('Aransas County');
  });

  it('ignores a remembered page that no longer exists', async () => {
    window.localStorage.setItem('tw4:wiki-last', JSON.stringify({ version: 2, data: { path: 'airfields/gone', scroll: 300 } }));
    expect(await headingAt('/wiki')).toBe('KNGP');
  });

  it('restores how far down the remembered page was scrolled', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    window.localStorage.setItem('tw4:wiki-last', JSON.stringify({ version: 2, data: { path: 'airfields/aransas-county', scroll: 420 } }));
    expect(await headingAt('/wiki')).toBe('Aransas County');
    expect(scrollTo).toHaveBeenCalledWith(0, 420);
    scrollTo.mockRestore();
  });
});
