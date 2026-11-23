import { notFound, redirect } from 'next/navigation';
import { organizerCard } from '../../../../lib/cards';
import { organizerId } from '../../../../lib/organizer';
import BirthdayCard from '../../../ui/birthday-card';

export default async function PreviewCard({ params }) {
  const { id } = await params;
  const organizer = await organizerId();
  if (!organizer) redirect('/organizer');
  const card = await organizerCard(organizer, id);
  if (!card) notFound();
  const sharePath = card.published_at ? '/birthday/' + id + '/' + card.reveal_key : undefined;
  return <BirthdayCard preview organizerCardId={id} sharePath={sharePath} card={{ recipient: card.recipient, storyboard: card.storyboard, wishes: [
    { id: 'opening', sender: card.sender, message: card.message, photo: card.photo }, ...card.wishes
  ] }} />;
}
