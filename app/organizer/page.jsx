import Link from 'next/link';
import { connection } from 'next/server';
import { clerkConfigured } from '../../lib/clerk-config';
import { organizerId } from '../../lib/organizer';
import { listCards } from '../../lib/cards';
import { OrganizerSignIn, OrganizerAccount } from '../ui/account';
import { WishForm } from '../ui/wish-form';
import { Envelope, StageLabel } from '../ui/envelope';

export default async function Organizer() {
  await connection();
  const configured = clerkConfigured();
  const organizer = configured ? await organizerId() : null;
  if (!organizer) return <section className="story-stage reveal-intro">
    <div><StageLabel>Birthday Adda</StageLabel><h1>Make their<br /><em>day.</em></h1>
      <p>{configured ? 'Sign in to start the card, collect wishes, and send the finished envelope.' : 'Organizer sign-in is being set up. You can still try the birthday reveal.'}</p>
      <div className="actions">{configured && <OrganizerSignIn />}<Link className="button secondary" href="/demo">Play the demo</Link></div>
    </div><Envelope />
  </section>;
  const cards = await listCards(organizer);
  return <div className="studio composer-studio scene-enter">
    <section className="studio-feature">
      <div className="heading-row"><StageLabel>The surprise desk</StageLabel><OrganizerAccount /></div>
      <h1>Your <em>birthday post.</em></h1>
      {cards.length ? <ul className="cards">{cards.map(card => <li key={card.id}><Link href={'/organizer/' + card.id}>
        <span className="mini-seal" aria-hidden="true">✉</span><span><strong>{card.recipient}’s birthday</strong>
        <small>{card.published_at ? 'Ready to send' : 'Collecting wishes'} · {card.wish_count} guest {card.wish_count === 1 ? 'wish' : 'wishes'}</small></span>
        <span className="card-arrow" aria-hidden="true">↗</span>
      </Link></li>)}</ul> : <p>Your cards will appear here once you write the first note.</p>}
    </section>
    <section className="studio-inbox composer-form"><StageLabel ink>Start the surprise</StageLabel><h2>Write the first note.</h2><WishForm /></section>
  </div>;
}
