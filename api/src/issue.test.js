import { describe, expect, it } from 'vitest';
import { buildIssue } from './issue.js';

describe('buildIssue', () => {
  it('builds a labelled issue', () => {
    const issue = buildIssue({
      type: 'discrepancy',
      summary: 'Wrong altitude at Goliad',
      details: 'The card says 2,000 but the binder says 1,500.',
      context: 'Chair fly: Goliad',
    });
    expect(issue.title).toBe('Discrepancy: Wrong altitude at Goliad');
    expect(issue.labels).toEqual(['user-report', 'discrepancy']);
    expect(issue.body).toContain('**Where:** Chair fly: Goliad');
  });

  it('rejects short input and ignores honeypot submissions', () => {
    expect(buildIssue({ summary: 'hi', details: 'long enough details' }).error).toBeTruthy();
    expect(buildIssue({ summary: 'Valid summary', details: 'short' }).error).toBeTruthy();
    expect(buildIssue({ website: 'x', summary: 'Valid summary', details: 'long enough details' }).spam).toBe(true);
  });

  it('falls back to feedback for unknown types', () => {
    const issue = buildIssue({ type: 'zzz', summary: 'Valid summary', details: 'long enough details' });
    expect(issue.labels).toEqual(['user-report', 'feedback']);
  });
});
