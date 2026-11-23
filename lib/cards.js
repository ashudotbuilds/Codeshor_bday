import { neon } from '@neondatabase/serverless';

const uuidPattern = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
export const isUuid = value => typeof value === 'string' && uuidPattern.test(value);
export const normalizeName = value => value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();

function db() {
  if (!process.env.DATABASE_URL) throw new Error('Birthday Adda database is not configured.');
  return neon(process.env.DATABASE_URL);
}

export async function listCards(organizerId) {
  return db()`SELECT c.id, c.recipient, c.published_at, count(w.card_id)::int AS wish_count
    FROM birthday_cards c LEFT JOIN birthday_wishes w ON w.card_id = c.id
    WHERE c.organizer_id = ${organizerId} GROUP BY c.id ORDER BY c.created_at DESC LIMIT 100`;
}

export async function createCard(organizerId, data) {
  const [card] = await db()`INSERT INTO birthday_cards
    (organizer_id, recipient, sender, message, photo, prompt, expected_guests)
    VALUES (${organizerId}, ${data.recipient}, ${data.sender}, ${data.message}, ${data.photo},
      ${data.prompt}, ${data.expectedGuests}) RETURNING id`;
  return card.id;
}

async function readGuestWishes(id) {
  return db()`SELECT submission_id AS id, sender, message, photo FROM birthday_wishes
    WHERE card_id = ${id} ORDER BY created_at, submission_id`;
}

export async function organizerCard(organizerId, id) {
  if (!isUuid(id)) return null;
  const [card] = await db()`SELECT id, recipient, sender, message, photo, invite_key, reveal_key,
    expected_guests, published_at, storyboard FROM birthday_cards WHERE id = ${id} AND organizer_id = ${organizerId}`;
  if (!card) return null;
  const wishes = await readGuestWishes(id);
  const signed = new Set(wishes.map(wish => normalizeName(wish.sender)));
  return { ...card, wishes, pending: card.expected_guests.filter(name => !signed.has(normalizeName(name))) };
}

export async function guestCard(id, key) {
  if (!isUuid(id) || !isUuid(key)) return null;
  const [card] = await db()`SELECT recipient, prompt, published_at FROM birthday_cards
    WHERE id = ${id} AND invite_key = ${key}`;
  return card;
}

export async function recipientCard(id, key) {
  if (!isUuid(id) || !isUuid(key)) return null;
  const [card] = await db()`SELECT recipient, sender, message, photo, storyboard FROM birthday_cards
    WHERE id = ${id} AND reveal_key = ${key} AND published_at IS NOT NULL`;
  if (!card) return null;
  return { recipient: card.recipient, storyboard: card.storyboard, wishes: [
    { id: 'opening', sender: card.sender, message: card.message, photo: card.photo }, ...await readGuestWishes(id)
  ] };
}

export async function submitWish(id, key, submission, data) {
  const [row] = await db()`SELECT birthday_submit_wish(
    ${id}::uuid, ${key}::uuid, ${submission}::uuid, ${data.sender}, ${data.message}, ${data.photo}
  ) AS status`;
  return row.status;
}

export async function finishCard(organizerId, id) {
  const [card] = await db()`UPDATE birthday_cards SET published_at = COALESCE(published_at, now())
    WHERE id = ${id} AND organizer_id = ${organizerId} RETURNING id`;
  return Boolean(card);
}

export async function storyboardInput(organizerId, id) {
  const [card] = await db()`SELECT message, photo IS NOT NULL AS has_photo FROM birthday_cards
    WHERE organizer_id = ${organizerId} AND id = ${id}`;
  if (!card) return null;
  const notes = await db()`SELECT submission_id AS id, message, photo IS NOT NULL AS has_photo
    FROM birthday_wishes WHERE card_id = ${id} ORDER BY created_at, submission_id`;
  return [{ id: 'opening', ...card }, ...notes];
}

export async function saveStoryboard(organizerId, id, storyboard) {
  await db()`UPDATE birthday_cards SET storyboard = NULLIF(
    ${JSON.stringify(storyboard ?? {})}::jsonb ||
    jsonb_strip_nulls(jsonb_build_object('illustrations', storyboard->'illustrations')), '{}'::jsonb)
    WHERE id = ${id} AND organizer_id = ${organizerId}`;
}

export async function saveIllustration(organizerId, id, wishId, image) {
  await db()`UPDATE birthday_cards SET storyboard = jsonb_set(
    COALESCE(storyboard, '{}'::jsonb), '{illustrations}',
    CASE WHEN ${image}::text IS NULL THEN COALESCE(storyboard->'illustrations', '{}'::jsonb) - ${wishId}::text
    ELSE COALESCE(storyboard->'illustrations', '{}'::jsonb) || jsonb_build_object(${wishId}::text, ${image}::text) END)
    WHERE id = ${id} AND organizer_id = ${organizerId}`;
}
