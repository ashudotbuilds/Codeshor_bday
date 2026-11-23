import { finishCard, isUuid } from '../../../../../lib/cards';
import { organizerId } from '../../../../../lib/organizer';
import { json, post } from '../../../../../lib/request';

export function POST(request, { params }) {
  return post(request, async () => {
    const organizer = await organizerId();
    if (!organizer) return json({ error: 'Sign in to finish this card.' }, 401);
    const { id } = await params;
    if (!isUuid(id) || !await finishCard(organizer, id)) {
      return json({ error: 'This card isn’t available in your account.' }, 404);
    }
    return json({ published: true });
  });
}
