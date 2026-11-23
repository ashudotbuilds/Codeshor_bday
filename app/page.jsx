import Link from 'next/link';
import { Envelope, StageLabel } from './ui/envelope';

export default function Home() {
  return <section className="story-stage landing">
    <div className="landing-copy scene-enter">
      <StageLabel>A little birthday magic</StageLabel>
      <h1>Some wishes<br />deserve a little<br /><em>drama.</em></h1>
      <p>Gather your people’s favourite memories, photos and dil se wishes. Give the birthday person a surprise they can open, one note at a time.</p>
      <div className="actions">
        <Link className="button" href="/organizer">Make a birthday surprise <span aria-hidden="true">↗</span></Link>
        <Link className="button secondary" href="/demo">Play the demo <span aria-hidden="true">▷</span></Link>
      </div>
    </div>
    <Link className="hero-art" href="/demo" aria-label="Open a sample birthday envelope">
      <Envelope />
      <span className="art-caption">SEALED BY THEIR FAVOURITE PEOPLE <b>♡</b></span>
    </Link>
  </section>;
}
