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
});
