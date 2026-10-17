import { app } from '@azure/functions';
import { buildIssue } from '../issue.js';

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const recent = new Map();

// Best-effort per-instance rate limit; the honeypot and GitHub's own limits cover the rest.
function limited(ip) {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  recent.set(ip, hits);
  return hits.length > MAX_PER_WINDOW;
}

app.http('report', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'report',
  handler: async (request, context) => {
    const token = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPO;
    if (!token || !repo) return { status: 503, jsonBody: { error: 'Reporting is not configured.' } };

    let body;
    try {
      body = await request.json();
    } catch {
      return { status: 400, jsonBody: { error: 'Invalid request.' } };
    }

    const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
    if (limited(ip)) return { status: 429, jsonBody: { error: 'Too many reports. Try again later.' } };

    const issue = buildIssue(body);
    if (issue.spam) return { status: 200, jsonBody: { ok: true } };
    if (issue.error) return { status: 400, jsonBody: { error: issue.error } };

    const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'tw4-course-rules',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(issue),
    });
    if (!res.ok) {
      context.error(`GitHub responded ${res.status}: ${await res.text()}`);
      return { status: 502, jsonBody: { error: 'Could not submit the report. Please try again later.' } };
    }
    return { status: 200, jsonBody: { ok: true } };
  },
});
