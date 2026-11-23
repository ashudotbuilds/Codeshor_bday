'use client';
import Link from 'next/link';

export default function ErrorPage({ reset }) {
  return <section className="panel center"><h1>Birthday Adda couldn’t load</h1><p>Try again in a moment.</p><div className="actions">
    <button className="button" onClick={reset}>Try again</button><Link href="/">Back to Birthday Adda</Link>
  </div></section>;
}
