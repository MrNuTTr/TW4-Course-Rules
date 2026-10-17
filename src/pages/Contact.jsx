import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const TYPES = [
  ['discrepancy', 'Discrepancy with the SOP'],
  ['bug', 'Bug or something broken'],
  ['other', 'Other feedback'],
];

export default function Contact() {
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    type: 'discrepancy',
    summary: '',
    details: '',
    context: params.get('where') ?? '',
    contact: '',
    website: '',
  });
  const [status, setStatus] = useState({ state: 'idle', message: '' });
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setStatus({ state: 'sending', message: '' });
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not submit the report.');
      setStatus({ state: 'sent', message: '' });
    } catch (err) {
      setStatus({ state: 'error', message: err.message });
    }
  };

  if (status.state === 'sent') {
    return (
      <div className="page-container contact-page">
        <h1>Thanks!</h1>
        <p>Your report was submitted. It will be reviewed and the course rules updated if needed.</p>
      </div>
    );
  }

  return (
    <div className="page-container contact-page">
      <h1>Report an issue</h1>
      <p className="contact-intro">
        Found something that doesn&rsquo;t match the current SOP, or something that&rsquo;s broken? Let us know.
        Please don&rsquo;t include anything sensitive.
      </p>
      <form className="contact-form" onSubmit={submit}>
        <label>
          Type
          <select value={form.type} onChange={set('type')}>
            {TYPES.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label>
          Where (page, leg or question)
          <input type="text" maxLength={300} value={form.context} onChange={set('context')} />
        </label>
        <label>
          Summary
          <input type="text" required minLength={5} maxLength={120} value={form.summary} onChange={set('summary')} />
        </label>
        <label>
          Details
          <textarea required minLength={10} maxLength={4000} rows={7} value={form.details} onChange={set('details')}
            placeholder="What does the site say, and what should it say? Cite the SOP section or slide if you can." />
        </label>
        <label>
          Contact (optional)
          <input type="text" maxLength={100} value={form.contact} onChange={set('contact')}
            placeholder="Email, if you'd like a reply" />
        </label>
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"
          className="contact-hp" value={form.website} onChange={set('website')} />
        {status.state === 'error' && <p className="contact-error" role="alert">{status.message}</p>}
        <button type="submit" className="primary-button" disabled={status.state === 'sending'}>
          {status.state === 'sending' ? 'Sending…' : 'Submit'}
        </button>
      </form>
      <p className="contact-help">
        Want to help develop? Join us on{' '}
        <a href="https://github.com/MrNuTTr/TW4-Course-Rules" target="_blank" rel="noopener noreferrer">GitHub</a>.
      </p>
    </div>
  );
}
