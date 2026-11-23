# Birthday Adda

A Next.js App Router app for collecting birthday wishes and photos. Organizers sign in through Clerk, invite guests, and finish a separate recipient card. Guests and recipients use scoped links and do not need accounts.

## Run locally

1. Use Node.js 24 and run `npm ci`.
2. Copy `.env.example` to `.env.local` and set `DATABASE_URL` for your development Neon branch.
3. Link the existing Clerk app using `npx -y clerk@latest link --app app_3MT05mQ5t7Nvf1R3qOwXui8Z5pC`, then pull development keys with `npx -y clerk@latest env pull`. The CLI needs an authenticated session. Configure Google on the selected Clerk app. Preserve the database URL when pulling keys.
4. Run `npm run db:migrate` and `npm run dev`. The preview is at http://localhost:4173.

Run `npm test` and `npm run build` to verify the app.

## Deploy to Vercel

1. Import the Git repository into Vercel. Use the directory containing `package.json` and `vercel.json` as the project root. Vercel builds the frontend and Next.js API routes together. The project config enables Fluid Compute for the storyboard function. [Vercel project configuration](https://vercel.com/docs/project-configuration)
2. Add your production domain to Vercel. Set up the production instance in Clerk with the same domain, including its DNS records and your OAuth credentials if you use Google sign-in. [Clerk production setup](https://clerk.com/docs/guides/development/deployment/production)
3. Under **Settings → Environment Variables**, enable access to system environment variables. Add these values to **Production**. [Vercel environment variables](https://vercel.com/docs/environment-variables/system-environment-variables)

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | Connection string for the production Neon database |
   | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Publishable key starting with `pk_live_` |
   | `CLERK_SECRET_KEY` | Secret key starting with `sk_live_` from the same Clerk instance |
   | `APP_ORIGIN` | Exact HTTPS origin of the production domain without a trailing slash |

4. Before the first production deployment, run `npm run db:migrate` with `DATABASE_URL` set in your shell to the same production Neon database. Verify the database target first. The schema script applies the changes in a transaction and can be rerun. The Vercel build does not run database migrations.
5. Deploy the production branch. On the production domain, sign in, create a test card, submit a wish from a signed-out browser, then publish and open the recipient link. Check **Illustrate a wish** with an API key from your provider and **Share board** in the organizer preview.

For authenticated Vercel previews, use development Clerk keys and a separate Neon branch. Keep production values scoped to Production. Storyboard provider keys are entered by organizers at runtime.

Card ownership is tied to the Clerk user ID. If you're reusing a Neon database with cards created under development Clerk accounts, migrate ownership before relying on those cards in production. Existing Sites Worker cards require a separate data and ownership migration. [Clerk Vercel setup](https://clerk.com/docs/guides/development/deployment/vercel)
