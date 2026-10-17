import { describe, expect, it } from 'vitest';
import { getNode } from '../routePlanner.js';
import { resolveRoute } from './routes.js';
import { flattenWiki } from './structure.js';

describe('wiki structure', () => {
  const pages = flattenWiki();

  it('has unique paths and real nodes', () => {
    expect(new Set(pages.map((p) => p.path)).size).toBe(pages.length);
    for (const page of pages) if (page.node) expect(() => getNode(page.node)).not.toThrow();
  });

  it('resolves a leg for every option of every page route', () => {
    for (const page of pages) {
      for (const route of page.routes ?? []) {
        const base = resolveRoute(route);
        expect(base.leg, `${page.path}: ${route.from} -> ${route.to}`).toBeTruthy();
        for (const input of base.fromInputs) {
          for (const option of input.options) {
            const { leg } = resolveRoute(route, { from: { [input.id]: option } });
            expect(leg, `${page.path}: from ${input.id}=${option}`).toBeTruthy();
          }
        }
        for (const input of base.toInputs) {
          for (const option of input.options) {
            const { leg } = resolveRoute(route, { to: { [input.id]: option } });
            expect(leg, `${page.path}: to ${input.id}=${option}`).toBeTruthy();
          }
        }
      }
    }
  });
});
