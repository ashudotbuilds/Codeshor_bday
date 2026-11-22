# Birthday Adda

Simple flow: write a personal wish → send the link → recipient saves or shares their birthday card.

Three required fields: recipient name, sender name, message. One optional photo. No dashboard or group planning in the main flow.

Run npm run dev, npm test, npm run build. No dependencies. Local storage in ignored .local-data; hosted records use R2 BUCKET. Existing reveal links remain readable.

Story export is a 1080 × 1920 PNG containing the recipient, message, and sender. Instagram and WhatsApp Status use saved images or supported native file sharing. WhatsApp, X, and Facebook offer link sharing; nothing posts automatically.

The hosted preview remains owner-private. External visitors need site access before wish links work. Capability links are private by possession. Dates are internal creation metadata; no scheduling or reminders.
