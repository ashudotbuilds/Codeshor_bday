import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { clerkConfigured } from './lib/clerk-config';
import { requestOrigin } from './lib/request';

export default async function proxy(request, event) {
  if (!clerkConfigured()) return NextResponse.next();
  const authorizedParties = process.env.APP_ORIGIN
    ? [process.env.APP_ORIGIN]
    : [requestOrigin(request), ...(process.env.NODE_ENV === 'development'
      ? ['http://localhost:4173', 'http://127.0.0.1:4173']
      : [])];
  const response = await clerkMiddleware({ authorizedParties })(request, event);
  const rewrite = response.headers.get('x-middleware-rewrite');
  // Clerk decorates a same-URL rewrite with auth headers. Continue locally
  // so Next dev doesn't proxy that rewrite back through its own listener.
  if (rewrite && new URL(rewrite).href === new URL(request.url).href) {
    response.headers.delete('x-middleware-rewrite');
    response.headers.set('x-middleware-next', '1');
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
