// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { buildIndex, searchWiki } from './search.js';

describe('wiki search', () => {
  it('indexes every page', () => {
    expect(buildIndex().length).toBeGreaterThan(10);
  });

  it('ranks title matches first and requires every word', () => {
    const results = searchWiki('foxtrot');
    expect(results[0].page.title).toMatch(/Foxtrot/);
    expect(searchWiki('foxtrot zzzzqqq')).toEqual([]);
  });

  it('finds text inside cards and returns a snippet', () => {
    const hit = searchWiki('3,000')[0];
    expect(hit.snippet).toContain('3,000');
  });

  it('returns nothing for an empty query', () => {
    expect(searchWiki('  ')).toEqual([]);
  });

  it('tolerates typos in longer words', () => {
    expect(searchWiki('shamrok')[0].page.title).toMatch(/Shamrock/);
  });

  it('matches as you type', () => {
    expect(searchWiki('foxt')[0].page.title).toMatch(/Foxtrot/);
  });

  it('expands course shorthand', () => {
    const paths = (q) => searchWiki(q).map((hit) => hit.page.path);
    expect(paths('ktfp')).toContain('airfields/ingleside');
    expect(paths('kings4')).toContain('working-areas/kings-4');
  });

  it('does not blur runway numbers together', () => {
    const snippets = searchWiki('13l').map((hit) => hit.snippet);
    expect(snippets.some((s) => /13R/i.test(s) && !/13L/i.test(s))).toBe(false);
  });
});
