import { organizerId } from '../../lib/organizer';
import { StoryboardJobs } from '../ui/storyboard-jobs';

export default async function OrganizerLayout({ children }) {
  const organizer = await organizerId();
  return <StoryboardJobs key={organizer} organizer={organizer}>{children}</StoryboardJobs>;
}
