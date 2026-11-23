'use client';

import { useEffect, useRef, useState } from 'react';
import { boardImage } from './board-image';

export default function BoardShare({ board, preview, sharePath }) {
  const dialog = useRef(null);
  const exportUrl = useRef('');
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [cardUrl, setCardUrl] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => () => URL.revokeObjectURL(exportUrl.current), []);

  async function prepare() {
    setBusy(true);
    setFile(null);
    setImageUrl('');
    setStatus('');
    URL.revokeObjectURL(exportUrl.current);
    try {
      const image = await boardImage(board);
      exportUrl.current = URL.createObjectURL(image);
      setImageUrl(exportUrl.current);
      setFile(image);
    } catch {
      setStatus('Couldn’t make the board image. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(cardUrl);
      setStatus('Card link copied.');
    } catch {
      const link = dialog.current.querySelector('input');
      link.focus();
      link.select();
      setStatus('Select and copy the card link.');
    }
  }

  async function share(data) {
    try {
      await navigator.share(data);
    } catch (error) {
      if (error.name !== 'AbortError') setStatus('Sharing didn’t open. Try the download or copy option.');
    }
  }

  const encodedUrl = encodeURIComponent(cardUrl);
  return <>
    <button className="button board-share" type="button" onClick={() => {
      const path = sharePath ?? (preview ? '' : location.pathname);
      setCardUrl(path ? new URL(path, location.origin).href : '');
      dialog.current.showModal();
      void prepare();
    }}>Share board</button>
    <dialog ref={dialog} className="board-share-dialog" aria-labelledby="board-share-title" onCancel={event => {
      if (busy) event.preventDefault();
    }}>
      <h2 id="board-share-title">Share the board</h2>
      <p>Save the memories on this page as an image for Instagram or WhatsApp Status.</p>
      {busy && <p role="status">Preparing your board image…</p>}
      {file && <div className="board-share-export">
        <img src={imageUrl} alt="Preview of the board image to share" />
        <div className="actions">
          <a className="button" href={imageUrl} download={file.name}>Download PNG</a>
          {navigator.canShare?.({ files: [file] }) && <button type="button" className="button secondary"
            onClick={() => void share({ files: [file] })}>Share image</button>}
        </div>
      </div>}
      {!busy && !file && <button type="button" className="button secondary" onClick={() => void prepare()}>Retry image</button>}
      {cardUrl && <div className="board-share-links">
        <label>Anyone with this link can open the card
          <input value={cardUrl} readOnly onFocus={event => event.currentTarget.select()} />
        </label>
        <div className="socials" aria-label="Share the card link">
          <button type="button" onClick={() => void copyLink()}>Copy link</button>
          {typeof navigator.share === 'function' && <button type="button"
            onClick={() => void share({ url: cardUrl })}>Share link</button>}
          <a href={'https://wa.me/?text=' + encodedUrl} target="_blank" rel="noopener noreferrer">WhatsApp</a>
          <a href={'https://twitter.com/intent/tweet?url=' + encodedUrl} target="_blank" rel="noopener noreferrer">X</a>
          <a href={'https://www.facebook.com/sharer/sharer.php?u=' + encodedUrl} target="_blank" rel="noopener noreferrer">Facebook</a>
        </div>
      </div>}
      {status && <p role="status">{status}</p>}
      <button type="button" className="button secondary" disabled={busy} onClick={() => dialog.current.close()}>Close</button>
    </dialog>
  </>;
}
