const TYPES = {
  discrepancy: { label: 'discrepancy', prefix: 'Discrepancy' },
  bug: { label: 'bug', prefix: 'Bug' },
  other: { label: 'feedback', prefix: 'Feedback' },
};

const clean = (value, max) => String(value ?? '').replace(/\r/g, '').trim().slice(0, max);

// Validates a submitted report and turns it into a GitHub issue payload. Returns {error} when invalid.
export function buildIssue(body = {}) {
  if (clean(body.website, 50)) return { spam: true };
  const type = TYPES[body.type] ? body.type : 'other';
  const summary = clean(body.summary, 120).replace(/\n/g, ' ');
  const details = clean(body.details, 4000);
  const context = clean(body.context, 300).replace(/\n/g, ' ');
  const contact = clean(body.contact, 100).replace(/\n/g, ' ');
  if (summary.length < 5) return { error: 'Please add a short summary.' };
  if (details.length < 10) return { error: 'Please add a few details.' };

  const parts = [];
  if (context) parts.push(`**Where:** ${context}`);
  parts.push(details);
  if (contact) parts.push(`**Contact:** ${contact}`);
  parts.push('_Submitted from the website contact form._');
  return {
    title: `${TYPES[type].prefix}: ${summary}`,
    body: parts.join('\n\n'),
    labels: ['user-report', TYPES[type].label],
  };
}
