'use client';

import { useLayoutEffect, useRef } from 'react';
import BoardShare from './board-share';
import StoryboardSettings from './storyboard-settings';

const pageSize = 6;

export default function MemoryBoard({ recipient, storyboard, wishes, onOpen, mode, setMode, page, setPage, preview, organizerCardId, sharePath }) {
  const grid = useRef(null);
  const threads = useRef(null);
  const pageCount = Math.ceil(wishes.length / pageSize);
  const activePage = Math.max(0, Math.min(page, pageCount - 1));
  const start = activePage * pageSize;
  const visible = wishes.slice(start, start + pageSize);

  useLayoutEffect(() => {
    if (!threads.current) return;
    const threadGroup = threads.current;
    const tiles = [...grid.current.querySelectorAll('.memory-tile')];
    function lineUpPins() {
      const pins = tiles.map(tile => {
        const pin = tile.querySelector('.pushpin');
        return { x: tile.offsetLeft + pin.offsetLeft + pin.offsetWidth / 2, y: tile.offsetTop + pin.offsetTop + pin.offsetHeight / 2 };
      });
      [...threadGroup.children].forEach((thread, index) => {
        const from = pins[index];
        const to = pins[index + 1];
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        thread.style.left = from.x + 'px';
        thread.style.top = from.y + 'px';
        thread.style.width = Math.hypot(dx, dy) + 'px';
        thread.style.transform = 'rotate(' + Math.atan2(dy, dx) + 'rad)';
      });
    }
    lineUpPins();
    const observer = new ResizeObserver(lineUpPins);
    observer.observe(grid.current);
    tiles.forEach(tile => observer.observe(tile));
    return () => observer.disconnect();
  }, [mode, activePage, visible.length]);

  const intro = storyboard?.intro || 'The memories, photos and little things only your people would know.';
  return <section className="memory-board scene-enter" aria-label="Birthday memory board">
    <div className="memory-board-top">
      <div><p className="board-kicker">THE BIRTHDAY FILE</p>
        <h1>{storyboard?.title || <>The case for <em>{recipient}.</em></>}</h1>
        <p>{intro}</p>
      </div>
      <div className="board-mode" role="group" aria-label="Board layout">
        <button type="button" aria-pressed={mode === 'pinboard'} onClick={() => setMode('pinboard')}>Pinboard</button>
        <button type="button" aria-pressed={mode === 'storyboard'} onClick={() => setMode('storyboard')}>Storyboard</button>
      </div>
    </div>
    {organizerCardId && mode === 'storyboard' && <StoryboardSettings
      id={organizerCardId} illustrationOnly published={Boolean(sharePath)}
      wishes={wishes.filter(wish => !wish.photo).map(wish => ({
        id: wish.id, sender: wish.sender, message: wish.message, illustrated: Boolean(wish.illustration)
      }))} />}
    <div ref={grid} className={'memory-grid ' + mode} data-count={visible.length}>
      {mode === 'pinboard' && visible.length > 1 && <div className="board-threads" aria-hidden="true" ref={threads}>
        {visible.slice(1).map((_, index) => <i key={index} />)}
      </div>}
      {visible.map((wish, index) => {
        const isStoryboard = mode === 'storyboard';
        const illustration = isStoryboard && !wish.photo && wish.illustration;
        const picture = wish.photo || illustration;
        return <button key={wish.id ?? start + index} type="button"
          className={'memory-tile' + (picture ? ' has-photo' : '')}
          onClick={() => onOpen(start + index)}
          aria-label={'Read wish from ' + wish.sender + (illustration ? ' (AI illustration)' : '')}>
          {!isStoryboard && <span className="pushpin" aria-hidden="true" />}
          {isStoryboard && <span className="scene-number">Scene {start + index + 1}</span>}
          {picture && <img src={picture} alt="" loading="lazy" />}
          {!wish.photo && <span className="tile-quote">“{wish.message}”</span>}
          <strong>{wish.caption}</strong>
          <small>From {wish.sender}{illustration && ' · AI illustration'}</small>
        </button>;
      })}
    </div>
    <div className="memory-board-bottom">
      {pageCount > 1 ? <div className="board-pagination">
        <button type="button" onClick={() => setPage(activePage - 1)} disabled={activePage === 0}>Previous</button>
        <span aria-live="polite">{activePage + 1} / {pageCount}</span>
        <button type="button" onClick={() => setPage(activePage + 1)} disabled={activePage === pageCount - 1}>Next</button>
      </div> : <span>{wishes.length} {wishes.length === 1 ? 'memory' : 'memories'} to open</span>}
      <div className="board-actions">
        {wishes.length > 0 && <BoardShare board={{ title: storyboard?.title || 'The case for ' + recipient + '.', intro, mode, visible, start, activePage, pageCount }} preview={preview} sharePath={sharePath} />}
        {wishes.length > 0 && <button className="button board-play" type="button" onClick={() => onOpen(0)}>Play the story <span aria-hidden="true">▷</span></button>}
      </div>
    </div>
  </section>;
}
