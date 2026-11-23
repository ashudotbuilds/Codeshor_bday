if (process.env.VERCEL_ENV === 'production') {
  const { DATABASE_URL, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY, APP_ORIGIN } = process.env;
  const issues = [];
  const database = URL.parse(DATABASE_URL ?? '');
  if (!database?.hostname || !['postgres:', 'postgresql:'].includes(database.protocol)) {
    issues.push('Set DATABASE_URL to the production Neon connection string.');
  }
  if (!NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith('pk_live_')) {
    issues.push('Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY from your production Clerk instance.');
  }
  if (!CLERK_SECRET_KEY?.startsWith('sk_live_')) {
    issues.push('Set CLERK_SECRET_KEY from the same production Clerk instance.');
  }
  const origin = URL.parse(APP_ORIGIN ?? '');
  if (origin?.protocol !== 'https:' || origin.origin !== APP_ORIGIN) {
    issues.push('Set APP_ORIGIN to the HTTPS origin of your production domain, without a trailing slash.');
  }
  if (issues.length) {
    for (const issue of issues) console.error(issue);
    process.exitCode = 1;
  }
}
