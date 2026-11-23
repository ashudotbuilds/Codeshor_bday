import { isUuid, saveIllustration, saveStoryboard, storyboardInput } from '../../../../../lib/cards';
import { generateStoryboard, StoryboardError } from '../../../../../lib/ai-storyboard';
import { illustrateWish } from '../../../../../lib/ai-illustration';
import { organizerId } from '../../../../../lib/organizer';
import { InputError, json, post, readJson, textField } from '../../../../../lib/request';

export const runtime = 'nodejs';
export const maxDuration = 120;

function providerKey(value, label) {
  const key = textField(value, label, 512);
  if (!/^[!-~]+$/.test(key)) throw new InputError('Paste the API key without spaces or line breaks.');
  return key;
}

export function POST(request, { params }) {
  let stage = 'load';
  return post(request, async () => {
    const organizer = await organizerId();
    if (!organizer) return json({ error: 'Sign in to arrange this storyboard.' }, 401);
    const { id } = await params;
    if (!isUuid(id)) return json({ error: 'This card isn’t available in your account.' }, 404);
    const notes = await storyboardInput(organizer, id);
    if (!notes) return json({ error: 'This card isn’t available in your account.' }, 404);
    const input = await readJson(request);
    const illustrationAction = ['illustrate', 'removeIllustration'].includes(input.action);
    const note = illustrationAction && notes.find(wish => wish.id === input.wishId);
    if (illustrationAction && !note) return json({ error: 'That wish isn’t on this card.' }, 404);
    if (input.action === 'removeIllustration') {
      stage = 'save';
      await saveIllustration(organizer, id, note.id, null);
      return json({ ok: true });
    }
    if (!illustrationAction && input.reset === true) {
      stage = 'save';
      await saveStoryboard(organizer, id, null);
      return json({ storyboard: null });
    }
    if (input.consent !== true) return json({ error: 'Confirm you’re comfortable sending the wish text to the selected provider.' }, 400);
    const key = providerKey(input.key, 'your provider API key');
    stage = 'generate';
    try {
      if (note) {
        if (note.has_photo) return json({ error: 'This wish already has a photo.' }, 400);
        const imageKey = input.provider === 'claude' ? providerKey(input.imageKey, 'your image provider API key') : undefined;
        const image = await illustrateWish({ provider: input.provider, key, renderer: input.renderer, imageKey }, note.message);
        stage = 'saveImage';
        await saveIllustration(organizer, id, note.id, image);
        return json({ ok: true });
      }
      const storyboard = await generateStoryboard(input.provider, key, notes);
      stage = 'save';
      await saveStoryboard(organizer, id, storyboard);
      return json({ storyboard });
    } catch (error) {
      if (error instanceof StoryboardError) return json({ error: error.message }, error.status);
      throw error;
    }
  }, error => {
    console.error('Birthday Adda storyboard failed:', stage, error?.code || error?.name);
    const messages = {
      load: 'Couldn’t load the wishes. Refresh the card and try again.',
      generate: 'Couldn’t generate the storyboard. Try again or choose a different provider.',
      save: 'Couldn’t save the storyboard update. Try again shortly.',
      saveImage: 'The scene was drawn, but the illustration couldn’t be saved. Refresh the board before trying again.'
    };
    return json({ error: messages[stage] }, 503);
  });
}
