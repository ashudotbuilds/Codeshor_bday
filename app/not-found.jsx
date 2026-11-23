import Link from 'next/link';

export default function Missing() {
  return <section className="panel center"><h1>This card couldn’t be opened</h1><p>Ask the organizer for the full link. If it’s a birthday card, check that they’ve finished it.</p><Link href="/">Back to Birthday Adda</Link></section>;
}
