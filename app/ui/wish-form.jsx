'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

async function preparePhoto(file) {
  if (!file?.size) return null;
  if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
    throw new Error('Choose a JPG, PNG, or WebP photo under 10 MB.');
  }
  const image = await createImageBitmap(file).catch(() => { throw new Error('Couldn’t read this photo. Choose another one.'); });
  try {
    const scale = Math.min(1, 800 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.78);
  } finally {
    image.close();
  }
}

export async function sendJson(url, data, {
  offline = 'Check your connection and try again. Your message is still here.',
  fallback = 'Couldn’t save this right now. Please try again.'
} = {}) {
  const response = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
  }).catch(() => { throw new Error(offline); });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || fallback);
  return result;
}

export function WishForm({ cardId, inviteKey, prompt, defaultSender }) {
  const router = useRouter();
  const submission = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const guest = Boolean(cardId);

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    setError('');
    try {
      const photo = await preparePhoto(fields.photoFile);
      delete fields.photoFile;
      if (guest) {
        submission.current ??= crypto.randomUUID();
        await sendJson('/api/cards/' + cardId + '/wishes', { ...fields, photo, key: inviteKey, submission: submission.current });
        setSaved(true);
      } else {
        const result = await sendJson('/api/cards', { ...fields, photo });
        router.push('/organizer/' + result.id);
      }
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  if (saved) return <div className="confirmation" role="status"><h2>Your wish is in</h2><p>The organizer can now see it.</p></div>;
  return <form onSubmit={submit}>
    <fieldset disabled={busy}>
      <div className={guest ? '' : 'fields'}>
        {!guest && <label>Birthday friend<input name="recipient" maxLength={35} placeholder="Aarav" required /></label>}
        <label>Your name<input name="sender" maxLength={40} defaultValue={defaultSender} required /></label>
      </div>
      <label>{prompt || 'Your birthday wish'}<textarea name="message" maxLength={600} required placeholder="Share a memory or write a wish from the heart." /></label>
      {!guest && <details><summary>Personal question and guest list (optional)</summary>
        <label>Ask guests one question<input name="prompt" maxLength={120} placeholder="What’s a memory with Aarav that still makes you laugh?" /></label>
        <label>Expected guests<input name="expectedGuests" maxLength={1200} placeholder="Meera, Rohan, Priya" />
          <small>Separate names with commas and use the names guests will sign with.</small></label>
      </details>}
      <label className="photo-field">Add a photo (optional)<input type="file" name="photoFile" accept="image/jpeg,image/png,image/webp" /></label>
      {guest && <small>The organizer and anyone with the finished card link can see your wish and photo.</small>}
      {error && <p className="error" role="alert">{error}</p>}
      <button className="button" type="submit">{busy ? 'Saving…' : guest ? 'Add my wish' : 'Create birthday card'}</button>
    </fieldset>
  </form>;
}
