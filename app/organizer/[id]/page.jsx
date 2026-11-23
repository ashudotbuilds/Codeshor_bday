import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { organizerCard } from '../../../lib/cards';
import { organizerId } from '../../../lib/organizer';
import { CardActions } from '../../ui/card-actions';
import { Envelope, StageLabel } from '../../ui/envelope';
import StoryboardSettings from '../../ui/storyboard-settings';

export default async function ManageCard({ params }) {
  const { id } = await params;
  const organizer = await organizerId();
  if (!organizer) redirect('/organizer');
  const card = await organizerCard(organizer, id);
  if (!card) notFound();
  const published = Boolean(card.published_at);
  const sharePath = published ? '/birthday/' + id + '/' + card.reveal_key : '/invite/' + id + '/' + card.invite_key;
  const previewPath = '/organizer/' + id + '/preview';
  const wishes = [{ id: 'opening', sender: card.sender, message: card.message, photo: card.photo }, ...card.wishes];
  const textWishes = wishes.filter(wish => !wish.photo).map(wish => ({
    id: wish.id, sender: wish.sender, message: wish.message, illustrated: Boolean(card.storyboard?.illustrations?.[wish.id])
  }));

  return <section className="studio scene-enter">
    <div className="studio-feature">
      <div><Link className="back-link" href="/organizer">‹ Your cards</Link>
        <StageLabel>{published ? 'Ready to send' : 'Collecting wishes'}</StageLabel>
        <h1>Birthday post<br />for <em>{card.recipient}.</em></h1>
        <p>{published ? 'The envelope is sealed. Send their link when the moment feels right.' : 'Send the guest link to their people, then seal the envelope when you’re ready.'}</p>
      </div>
      <Envelope small />
      <CardActions key={String(published)} id={id} published={published} sharePath={sharePath} previewPath={previewPath} />
      <StoryboardSettings id={id} configured={Boolean(card.storyboard?.scenes)} published={published} wishes={textWishes} />
    </div>
    <aside className="studio-inbox">
      <div className="inbox-heading"><StageLabel ink>Inside the envelope</StageLabel><h2>Love notes</h2>
        <p>{card.wishes.length} guest {card.wishes.length === 1 ? 'wish' : 'wishes'} · {wishes.length} {wishes.length === 1 ? 'note' : 'notes'} in the card</p></div>
      <div className="inbox-notes" aria-label="Submitted wishes">
        {wishes.map((wish, index) => <details key={index} className="inbox-note" open={index === 0}>
          <summary><span className="note-initial" aria-hidden="true">{Array.from(wish.sender)[0]?.toUpperCase()}</span>
            <span>{wish.sender}<small>{index === 0 ? 'First note · Organizer' : wish.photo ? 'Guest wish · Photo' : 'Guest wish'}</small></span>
            <span className="expand" aria-hidden="true">+</span></summary>
          <p className="message">{wish.message}</p>{wish.photo && <img className="wish-photo" src={wish.photo} alt={'Photo from ' + wish.sender} />}
        </details>)}
      </div>
      {card.pending.length > 0 && <details className="pending"><summary>{card.pending.length} listed {card.pending.length === 1 ? 'guest' : 'guests'} still to hear from</summary>
        <p>{card.pending.join(', ')}</p><small>Matched by the name each guest signs with.</small></details>}
    </aside>
  </section>;
}
