import './globals.css';
import Link from 'next/link';
import { ClerkProvider } from '@clerk/nextjs';
import { clerkConfigured } from '../lib/clerk-config';

export const metadata = {
  title: 'Birthday Adda',
  description: 'Gather birthday wishes and photos in one personal card.',
  referrer: 'no-referrer'
};
export const viewport = { themeColor: '#210c30' };

export default function Layout({ children }) {
  const shell = <>
    <header><Link href="/" className="brand"><span aria-hidden="true">✹</span> Birthday<span className="brand-accent">Adda</span></Link>
      <nav className="site-nav" aria-label="Main"><Link href="/demo">Demo</Link><Link href="/organizer">Your cards</Link></nav></header>
    <main>{children}</main>
    <footer>Made for apne log. With a little extra pyaar.</footer>
  </>;
  return <html lang="en-IN"><body>
    {clerkConfigured() ? <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>{shell}</ClerkProvider> : shell}
  </body></html>;
}
