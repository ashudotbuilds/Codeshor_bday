import { createCard, normalizeName } from '../../../lib/cards';
import { organizerId } from '../../../lib/organizer';
import { json, post, readJson, textField, photoField } from '../../../lib/request';

export function POST(request) {
  return post(request, async () => {
    const organizer = await organizerId();
    if (!organizer) return json({ error: 'Sign in before creating a birthday card.' }, 401);
    const input = await readJson(request);
    const guests = textField(input.expectedGuests, 'guest names', 1200, true)
      .split(',').map(name => name.trim().slice(0, 40)).filter(Boolean);
    const expectedGuests = [...new Map(guests.map(name => [normalizeName(name), name])).values()].slice(0, 30);
    const id = await createCard(organizer, {
      recipient: textField(input.recipient, 'their name', 35),
      sender: textField(input.sender, 'your name', 40),
      message: textField(input.message, 'your message', 600),
      prompt: textField(input.prompt, 'the question', 120, true),
      photo: photoField(input.photo),
      expectedGuests
    });
    return json({ id }, 201);
  });
}
