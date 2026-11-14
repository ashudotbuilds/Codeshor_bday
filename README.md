# Birthday Wrapped

A birthday scrapbook MVP: create a celebration, collect memories and wishes, open an interactive reveal, download a 1080 × 1920 birthday PNG.

Run `npm run dev` and open http://127.0.0.1:4173. No dependencies required. Local shared data lives in ignored `.local-data/`. Run `npm test` and `npm run build` to validate and create the Cloudflare Worker artifact.

Hosted persistence uses the Sites-provisioned R2 binding `BUCKET`. Each celebration stores metadata and separate contributions. Organizer, contributor, and recipient links use separate random capability tokens. Treat those links as passwords. Organizer entries are remembered on the current browser; copy the organizer link for another device.

The sample uses fictional data and stays in memory. Real celebrations support up to 100 contributions and resized JPEG photos. The MVP does not yet include editing, deletion, invite revocation, scheduled delivery, moderation, or automatic social posting. Story sharing uses downloaded PNGs. A date is display metadata, not a release lock.

New Sites are private to the owner. External contributors cannot access a private deployment until visitor access is explicitly changed. The app's capability links do not override the host's access policy.

Design: warm paper, forest green, soft pink and lavender, editorial serif headings, scrapbook illustrations. Original dependency-free implementation informed by 21st Bento Card and Bento Grid composition references.
