import { notFound } from 'next/navigation';
import { guestCard } from '../../../../lib/cards';
import { WishForm } from '../../../ui/wish-form';
import { Envelope, StageLabel } from '../../../ui/envelope';

export default async function Invite({ params }) {
  const { id, key } = await params;
  const card = await guestCard(id, key);
  if (!card) notFound();
  return <div className="studio guest-studio scene-enter">
    <section className="studio-feature"><StageLabel>{card.published_at ? 'The envelope is sealed' : 'You’re in on the surprise'}</StageLabel>
      <h1>Birthday post<br />for <em>{card.recipient}.</em></h1>
      <p>{card.published_at ? 'The organizer has finished the card. New wishes are closed.' : 'A memory, an inside joke, or a few words they’ll keep. Add yours to the envelope.'}</p>
      <Envelope small />
    </section>
    {!card.published_at && <section className="studio-inbox composer-form"><StageLabel ink>For {card.recipient}</StageLabel><h2>Leave a little love.</h2>
      <WishForm cardId={id} inviteKey={key} prompt={card.prompt} />
    </section>}
  </div>;
}
