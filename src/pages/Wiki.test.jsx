// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Wiki from './Wiki.jsx';

vi.mock('../RouteMap.jsx', () => ({ default: () => null }));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

async function headingAt(url) {
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
  const heading = container.querySelector('h1').textContent;
  await act(async () => root.unmount());
  return heading;
}

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
