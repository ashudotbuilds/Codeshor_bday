'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Envelope, StageLabel, CelebrationBurst } from './envelope';
import { arrangeWishes } from '../../lib/storyboard';
import MemoryBoard from './memory-board';

async function storyFile(recipient, wish) {
  await document.fonts.ready;
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const context = canvas.getContext('2d');
  context.fillStyle = '#fff0e1';
  context.fillRect(0, 0, 1080, 1920);
  context.strokeStyle = '#bd315b';
  context.lineWidth = 3;
  context.strokeRect(50, 50, 980, 1820);
  context.textAlign = 'center';
  context.fillStyle = '#3a1241';
  context.font = '28px sans-serif';
  context.fillText('BIRTHDAY ADDA', 540, 152);
  if (wish.photo) {
    const image = new Image();
    image.src = wish.photo;
    await image.decode();
    const scale = 280 / Math.min(image.width, image.height);
    context.save();
    context.beginPath();
    context.arc(540, 390, 140, 0, 2 * Math.PI);
    context.clip();
    context.drawImage(image, 540 - image.width * scale / 2, 390 - image.height * scale / 2, image.width * scale, image.height * scale);
    context.restore();
  } else {
    context.font = '190px serif';
    context.fillText('✳', 540, 465);
  }
  context.font = 'bold 75px serif';
  context.fillText('Happy birthday,', 540, 650, 880);
  context.font = 'italic 90px serif';
  context.fillText(recipient + '!', 540, 760, 880);

  function wrap(size) {
    context.font = size + 'px sans-serif';
    const lines = [];
    let line = '';
    for (const word of wish.message.split(/\s+/)) {
      if (context.measureText((line + ' ' + word).trim()).width > 820 && line) {
        lines.push(line);
        line = '';
      }
      if (context.measureText(word).width > 820) {
        for (const letter of word) {
          if (context.measureText(line + letter).width > 820) { lines.push(line); line = ''; }
          line += letter;
        }
      } else line += (line ? ' ' : '') + word;
    }
    if (line) lines.push(line);
    return lines;
  }

  let size = 42;
  let lines = wrap(size);
  while (size > 24 && lines.length * size * 1.5 > 710) lines = wrap(--size);
  lines.forEach((line, index) => context.fillText(line, 540, 900 + index * size * 1.5, 820));
  context.font = '30px sans-serif';
  context.fillText('With love, ' + wish.sender, 540, 1710, 880);
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Couldn’t make the Story image.');
  return new File([blob], 'birthday-adda.png', { type: 'image/png' });
}

export default function BirthdayCard({ card, demo = false, preview = false, organizerCardId, sharePath }) {
  const wishes = arrangeWishes(card.wishes, card.storyboard);
  const [chapter, setChapter] = useState(-2);
  const [boardMode, setBoardMode] = useState('pinboard');
  const [boardPage, setBoardPage] = useState(0);
  const [opening, setOpening] = useState(false);
  const [favorite, setFavorite] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const transition = useRef(null);
  const heading = useRef(null);
  const finale = chapter === wishes.length;
  const wish = wishes[chapter];

  useEffect(() => () => clearTimeout(transition.current), []);
  useEffect(() => {
    if (chapter >= 0) heading.current?.focus({ preventScroll: true });
  }, [chapter]);

  function turn(next) {
    setFeedback('');
    setChapter(next);
  }

  function open() {
    if (opening) return;
    setOpening(true);
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    transition.current = setTimeout(() => {
      setOpening(false);
      turn(-1);
    }, reduceMotion ? 0 : 740);
  }

  function navigateStory(event) {
    if (event.target instanceof HTMLSelectElement || chapter < 0) return;
    if (event.key === 'ArrowRight' && !finale) turn(chapter + 1);
    if (event.key === 'ArrowLeft') turn(Math.max(-1, chapter - 1));
  }

  async function download() {
    setBusy(true);
    setFeedback('');
    try {
      const file = await storyFile(card.recipient, wishes[favorite]);
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setFeedback('Story image saved. Add it to Instagram Stories or WhatsApp Status.');
    } catch {
      setFeedback('Couldn’t save the image. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  function share(site) {
    const url = encodeURIComponent(sharePath ? new URL(sharePath, location.origin).href : location.href);
    const destinations = {
      WhatsApp: 'https://wa.me/?text=' + url,
      X: 'https://twitter.com/intent/tweet?url=' + url,
      Facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + url
    };
    window.open(destinations[site], '_blank', 'noopener,noreferrer');
  }

  if (chapter === -2) return <section className="story-stage reveal-intro">
    <div className="scene-enter">
      <StageLabel>{(demo || preview) ? 'Preview a birthday surprise' : 'A birthday surprise'}</StageLabel>
      <h1>You’ve got<br /><em>birthday post.</em></h1>
      <p className="address">To <strong>{card.recipient}</strong>, from your people.</p>
      <button className="button" onClick={open} disabled={opening}>{opening ? 'Opening…' : 'Open the envelope'} <span aria-hidden="true">↗</span></button>
    </div>
    <button className="envelope-trigger" type="button" aria-label="Open birthday post" onClick={open} disabled={opening}>
      <Envelope opening={opening} />
    </button>
  </section>;

  if (chapter === -1) return <MemoryBoard recipient={card.recipient}
    storyboard={card.storyboard} wishes={wishes} onOpen={turn} preview={preview}
    organizerCardId={organizerCardId} sharePath={sharePath}
    mode={boardMode} setMode={setBoardMode} page={boardPage} setPage={setBoardPage} />;

  if (finale) return <section className="story-stage story-finale" onKeyDown={navigateStory}>
    <CelebrationBurst />
    <div className="scene-enter">
      <StageLabel>From all of us</StageLabel>
      <h1 tabIndex={-1} ref={heading}>Happy birthday,<br /><em>{card.recipient}!</em></h1>
      <p>A little love you can take with you.</p>
      <div className="finale-save">
        {wishes.length > 1 && <label htmlFor="story-wish">Wish to save<select id="story-wish" value={favorite} onChange={event => setFavorite(Number(event.target.value))}>
          {wishes.map((note, index) => <option key={index} value={index}>Wish {index + 1} · {note.sender}</option>)}
        </select></label>}
        <button className="button" disabled={busy} onClick={download}>{busy ? 'Preparing image…' : 'Save for Stories'} <span aria-hidden="true">↓</span></button>
      </div>
      {!demo && (!preview || sharePath) && <div className="socials" aria-label="Share this birthday card">{['WhatsApp','X','Facebook'].map(site => <button key={site} onClick={() => share(site)}>{site}</button>)}</div>}
      {feedback && <p className="story-feedback" role="status">{feedback}</p>}
      <div className="finale-links"><button className="text-link" onClick={() => turn(-1)}>Back to the memory board</button>
        {demo && <Link href="/organizer">Make one for your friend</Link>}</div>
    </div>
  </section>;

  const illustration = boardMode === 'storyboard' && !wish.photo && wish.illustration;
  const picture = wish.photo || illustration;
  return <section className="story-stage story-reader" onKeyDown={navigateStory}>
    <div className="progress-rail" role="progressbar" aria-label="Birthday wishes" aria-valuemin={1} aria-valuemax={wishes.length} aria-valuenow={chapter + 1}>
      {wishes.map((_, index) => <span key={index} className={index <= chapter ? 'filled' : ''} />)}
    </div>
    <article className={'story-note scene-enter' + (picture ? ' story-note-photo' : '')} key={chapter}>
      {picture && <div className="story-photo"><img src={picture}
        alt={(illustration ? 'AI illustration of a birthday memory from ' : 'A birthday memory from ') + wish.sender} /></div>}
      <div className="story-note-copy">
        <StageLabel ink>{wish.caption}</StageLabel>
        <h1 tabIndex={-1} ref={heading}>From <em>{wish.sender}</em></h1>
        <div className="story-message" tabIndex={0} aria-label="Birthday message"><p>{wish.message}</p></div>
        <button className="pick-wish" onClick={() => setFavorite(chapter)} aria-pressed={favorite === chapter}>
          <span aria-hidden="true">{favorite === chapter ? '★' : '☆'}</span>{' '}
          {favorite === chapter ? 'Picked for my Story' : 'Pick for my Story'}
        </button>
      </div>
    </article>
    <nav className="story-controls" aria-label="Story navigation">
      <button className="button secondary" onClick={() => turn(chapter - 1)}><span aria-hidden="true">‹</span> Back</button>
      <button className="text-link" onClick={() => turn(-1)} aria-label={'Back to memory board, wish ' + (chapter + 1) + ' of ' + wishes.length}>Board · {chapter + 1} / {wishes.length}</button>
      <button className="button" onClick={() => turn(chapter + 1)}>{chapter === wishes.length - 1 ? 'To the birthday finale' : 'Next wish'} <span aria-hidden="true">›</span></button>
    </nav>
  </section>;
}
