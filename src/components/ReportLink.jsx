import { Link } from 'react-router-dom';

// Links to the contact form with the current spot prefilled.
export default function ReportLink({ context, children = 'Report an issue' }) {
  return (
    <Link className="report-link" to={`/contact?where=${encodeURIComponent(context)}`}>
      {children}
    </Link>
  );
}
