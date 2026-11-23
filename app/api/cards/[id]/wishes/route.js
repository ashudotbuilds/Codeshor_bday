import { isUuid, submitWish } from '../../../../../lib/cards';
import { json, post, readJson, textField, photoField } from '../../../../../lib/request';

export function POST(request, { params }) {
  return post(request, async () => {
    const { id } = await params;
    const input = await readJson(request);
    if (![id, input.key, input.submission].every(isUuid)) {
      return json({ error: 'This invite is incomplete. Ask the organizer for the full link.' }, 400);
    }
    const result = await submitWish(id, input.key, input.submission, {
      sender: textField(input.sender, 'your name', 40),
      message: textField(input.message, 'your message', 600),
      photo: photoField(input.photo)
    });
    if (result === 'unavailable') return json({ error: 'Ask the organizer for a new invite link.' }, 404);
    if (result === 'closed') return json({ error: 'The organizer has finished the card. New wishes are closed.' }, 409);
    if (result === 'full') return json({ error: 'This card has reached its 30 guest wishes.' }, 409);
    return json({ saved: true }, 201);
  });
}
