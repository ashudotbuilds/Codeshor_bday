'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { sendJson } from './wish-form';

export function CardActions({ id, sharePath, published, previewPath }) {
  const router = useRouter();
  const dialog = useRef(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [manualLink, setManualLink] = useState('');

  async function copy() {
    const url = new URL(sharePath, location.origin).href;
    try {
      await navigator.clipboard.writeText(url);
      setFeedback('Link copied.');
    } catch {
      setManualLink(url);
    }
  }

  async function finish() {
    setBusy(true);
    setFeedback('');
    try {
      await sendJson('/api/cards/' + id + '/publish', {});
      dialog.current.close();
      setManualLink('');
      router.refresh();
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setBusy(false);
    }
  }

  return <>
    <div className="actions studio-actions">
      <button className="button" onClick={copy}>{published ? 'Copy birthday card link' : 'Copy guest invite link'}</button>
      {!published && <button className="button secondary" onClick={() => { setFeedback(''); dialog.current.showModal(); }}>Seal the envelope</button>}
      <Link className="button secondary" href={previewPath} prefetch={false}>Preview surprise</Link>
      {!published && <button className="text-link" onClick={() => router.refresh()}>Refresh wishes</button>}
    </div>
    {manualLink && <label>Copy this link<input value={manualLink} readOnly onFocus={event => event.currentTarget.select()} /></label>}
    {feedback && <p role="status">{feedback}</p>}
    <dialog ref={dialog}>
      <h2>Finish this card?</h2><p>New wishes will close and you’ll get the link to send to the birthday person.</p>
      <div className="actions"><button className="button secondary" disabled={busy} onClick={() => dialog.current.close()}>Keep collecting</button>
        <button className="button" disabled={busy} onClick={finish}>{busy ? 'Finishing…' : 'Finish card'}</button></div>
      {feedback && <p className="error" role="alert">{feedback}</p>}
    </dialog>
  </>;
}
