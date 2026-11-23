'use client';

import { useId, useRef, useState } from 'react';
import { forgetProviderKeys, rememberProviderKeys, savedProviderKey, useStoryboardJobs } from './storyboard-jobs';

export default function StoryboardSettings({ id, configured, published, wishes, illustrationOnly = false }) {
  const { organizer, jobs, start } = useStoryboardJobs();
  const busy = Boolean(jobs[id]?.pending);
  const modal = useRef(null);
  const titleId = useId();
  const [storageStatus, setStorageStatus] = useState('');
  const [illustrating, setIllustrating] = useState(false);
  const [provider, setProvider] = useState('');
  const [key, setKey] = useState('');
  const [renderer, setRenderer] = useState('gemini');
  const [imageKey, setImageKey] = useState('');
  const [wishId, setWishId] = useState('');
  const wish = wishes.find(note => note.id === wishId);
  const needsRenderer = illustrating && provider === 'claude';
  const noTextWishes = illustrating && wishes.length === 0;

  function open(withIllustration) {
    const choices = withIllustration ? ['gemini', 'openai', 'claude'] : ['claude', 'gemini', 'openai'];
    const initialProvider = provider || choices.find(choice => savedProviderKey(organizer, choice)) || choices[0];
    setProvider(initialProvider);
    setKey(savedProviderKey(organizer, initialProvider));
    setImageKey(savedProviderKey(organizer, renderer));
    setStorageStatus('');
    if (!wish) setWishId(wishes[0]?.id ?? '');
    setIllustrating(withIllustration);
    modal.current.showModal();
  }

  function save(payload, messages, storageFailed) {
    if (start(id, payload, messages, storageFailed)) {
      modal.current.close();
    }
  }

  function generate(event) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const payload = { provider, key: key.trim(), consent: fields.get('consent') === 'on' };
    const keys = [[provider, payload.key]];
    if (illustrating) {
      payload.action = 'illustrate';
      payload.wishId = wishId;
      if (needsRenderer) {
        payload.renderer = renderer;
        payload.imageKey = imageKey.trim();
        keys.push([renderer, payload.imageKey]);
      }
    }
    const messages = illustrating
      ? { pending: 'Drawing your scene…', success: 'Illustration saved. You can see it on the Storyboard.' }
      : { pending: 'Arranging your storyboard…', success: 'Storyboard saved.' };
    save(payload, messages, !rememberProviderKeys(organizer, keys));
  }

  function forget() {
    const cleared = forgetProviderKeys(organizer);
    setKey('');
    setImageKey('');
    setStorageStatus(cleared ? 'Saved API keys cleared.' : 'Couldn’t clear session storage.');
  }

  return <div className={'storyboard-tools' + (illustrationOnly ? ' board-illustration-tools' : '')}>
    <div className="actions">
      {!illustrationOnly && <button className="button secondary" type="button" disabled={busy} onClick={() => open(false)}>
        <span aria-hidden="true">✦</span> {configured ? 'Edit AI storyboard' : 'Arrange with AI'}
      </button>}
      <button className={'button ' + (illustrationOnly ? 'board-share' : 'secondary')} type="button" disabled={busy}
        onClick={() => open(true)}>Illustrate a wish</button>
    </div>
    <dialog ref={modal} aria-labelledby={titleId} onClose={() => {
      modal.current.querySelector('form')?.reset();
      setKey('');
      setImageKey('');
    }}>
      <h2 id={titleId}>{illustrating ? 'Illustrate a wish' : 'Arrange the storyboard'}</h2>
      {noTextWishes ? <>
        <p>Every wish already has a photo. Illustrations are available for wishes without photos.</p>
        <button type="button" className="button secondary" onClick={() => modal.current.close()}>Close</button>
      </> : <>
        <p>{illustrating ? 'Turn a specific memory into a pencil-sketch panel using your own API key.' : 'Get a title, captions, and a suggested order for the original wishes.'}</p>
        {published && <p>The updated board will appear on the link you already shared.</p>}
        <form onSubmit={generate}>
          <fieldset>
            {illustrating && <label>Wish to illustrate<select name="wish" value={wishId} onChange={event => setWishId(event.target.value)}>
              {wishes.map((note, index) => <option key={note.id} value={note.id}>{index + 1}. {note.sender}{note.illustrated ? ' · Illustrated' : ''}</option>)}
            </select></label>}
            {illustrating && wish && <p className="illustration-source">{wish.message}</p>}
            <label>AI provider<select name="provider" value={provider} onChange={event => {
              const choice = event.target.value;
              event.currentTarget.form.elements.consent.checked = false;
              setKey(savedProviderKey(organizer, choice));
              setImageKey(savedProviderKey(organizer, renderer));
              setProvider(choice);
            }}>
              <option value="claude">Claude (Anthropic)</option><option value="gemini">Gemini (Google)</option>
              <option value="openai">OpenAI (ChatGPT)</option>
            </select></label>
            <label>{needsRenderer ? 'Claude API key' : 'Provider API key'}<input name="apiKey" type="password" autoComplete="off"
              value={key} onChange={event => setKey(event.target.value)} autoCapitalize="none" spellCheck={false} maxLength={512} required /></label>
            {needsRenderer && <>
              <p>Claude describes the scene. Gemini or OpenAI draws it with a separate API key.</p>
              <label>Image provider<select name="renderer" value={renderer} onChange={event => {
                const choice = event.target.value;
                event.currentTarget.form.elements.consent.checked = false;
                setImageKey(savedProviderKey(organizer, choice));
                setRenderer(choice);
              }}><option value="gemini">Gemini (Google)</option><option value="openai">OpenAI (ChatGPT)</option></select></label>
              <label>Image provider API key<input name="imageKey" type="password" autoComplete="off"
                value={imageKey} onChange={event => setImageKey(event.target.value)} autoCapitalize="none" spellCheck={false} maxLength={512} required /></label>
            </>}
            <label className="ai-consent"><input name="consent" type="checkbox" required />
              <span>{needsRenderer ? 'Send this wish to Claude and its scene description to the image provider.' :
                illustrating ? 'Send this wish to the selected provider.' : 'Send wish text to this provider. Photos stay here.'}</span>
            </label>
            <p className="api-key-note">Keys are remembered for this browser tab. <button type="button" className="text-link"
              onClick={forget}>Forget saved keys</button></p>
            {storageStatus && <p role="status">{storageStatus}</p>}
            <div className="actions">
              <button type="submit" className="button" disabled={busy}>{illustrating ? 'Draw scene' : 'Generate storyboard'}</button>
              <button type="button" className="button secondary" onClick={() => modal.current.close()}>Close</button>
            </div>
            {illustrating && wish?.illustrated && <button type="button" className="text-link" disabled={busy} onClick={() =>
              save({ action: 'removeIllustration', wishId }, { pending: 'Removing illustration…', success: 'Illustration removed.' })}>Remove illustration</button>}
            {!illustrating && configured && <button type="button" className="text-link" disabled={busy} onClick={() =>
              save({ reset: true }, { pending: 'Restoring original order…', success: 'Original note order restored.' })}>Restore original order</button>}
          </fieldset>
        </form>
      </>}
    </dialog>
  </div>;
}
