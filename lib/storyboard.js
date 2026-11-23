const defaultLabels = ['A little love', 'A familiar laugh', 'One to remember', 'From the heart'];

export function arrangeWishes(wishes, storyboard) {
  const byId = new Map(wishes.map((wish, index) => [wish.id ?? String(index), wish]));
  const result = [];
  for (const scene of storyboard?.scenes ?? []) {
    const wish = byId.get(scene.id);
    if (!wish) continue;
    result.push({ ...wish, caption: scene.caption, illustration: storyboard?.illustrations?.[scene.id] });
    byId.delete(scene.id);
  }
  for (const [id, wish] of byId) {
    result.push({
      ...wish,
      caption: wish.photo ? 'A photo worth keeping' : defaultLabels[result.length % defaultLabels.length],
      illustration: storyboard?.illustrations?.[id]
    });
  }
  return result;
}

export function parseStoryboard(content, notes) {
  const parsed = JSON.parse(content.trim().replace(/^\x60{3}(?:json)?\s*/i, '').replace(/\s*\x60{3}$/, ''));
  const short = (text, max) => typeof text === 'string' ? text.trim().replace(/\s+/g, ' ').slice(0, max) : '';
  const title = short(parsed?.title, 52);
  const intro = short(parsed?.intro, 125);
  if (!title || !intro || !Array.isArray(parsed.scenes) || parsed.scenes.length !== notes.length) {
    throw new Error('Incomplete storyboard.');
  }
  const seen = new Set();
  const scenes = parsed.scenes.map(scene => {
    const index = scene?.note;
    const caption = short(scene?.caption, 36);
    if (!Number.isInteger(index) || !notes[index] || seen.has(index) || !caption) throw new Error('Invalid storyboard scene.');
    seen.add(index);
    return { id: notes[index].id, caption };
  });
  return { title, intro, scenes };
}
