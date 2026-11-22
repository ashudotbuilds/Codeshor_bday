# Birthday Adda

An Indian birthday surprise MVP: gather apne log, collect throwbacks, friendly khichaai or special mentions, and dil se wishes. Recipients make a wish on the illustrated cake, explore the messages, and download a 1080 × 1920 birthday Story PNG.

Choose friends, family, or partner context. Family selects the gentle mood by default and uses family-specific prompts; Hinglish family reveals use respectful phrasing. Choose English or Hinglish reveal headings; contributions accept text in any language. WhatsApp invite buttons open a draft for the organizer to send, never send automatically. Story PNGs can be posted manually to Instagram, Facebook, or WhatsApp Status. Dates use Indian formatting; delivery is manual, including midnight surprises.

Run `npm run dev` and open http://127.0.0.1:4173. No dependencies required. Local shared data lives in ignored `.local-data/`. Run `npm test` and `npm run build` to validate and create the Cloudflare Worker artifact.

Hosted persistence uses the Sites-provisioned R2 binding `BUCKET`. Each celebration stores metadata and separate contributions. Organizer, contributor, and recipient links use separate random capability tokens. Treat those links as passwords. Organizer entries are remembered on the current browser; copy the organizer link for another device.

The sample uses fictional data and stays in memory. Real celebrations support up to 100 contributions and resized JPEG photos. The MVP does not yet include editing, deletion, invite revocation, scheduled delivery, moderation, or automatic social posting. Story sharing uses downloaded PNGs. A date is display metadata, not a release lock.

New Sites are private to the owner. External contributors cannot access a private deployment until visitor access is explicitly changed. The app's capability links do not override the host's access policy.

Design: Birthday Adda — lilac, coral, lime, deep plum; DM Sans with DM Serif Display; original SVG cake artwork and secret-group-chat stickers. Mobile and desktop layouts, keyboard focus, and reduced-motion support. Design context is recorded in `.21st/design.json`. Existing capability links and stored celebrations remain compatible.
