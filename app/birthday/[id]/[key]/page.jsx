import { notFound } from 'next/navigation';
import { recipientCard } from '../../../../lib/cards';
import BirthdayCard from '../../../ui/birthday-card';

export default async function Birthday({ params }) {
  const { id, key } = await params;
  const card = await recipientCard(id, key);
  if (!card) notFound();
  return <BirthdayCard card={card} />;
}
