import { auth } from '@clerk/nextjs/server';
import { clerkConfigured } from './clerk-config';

export async function organizerId() {
  if (!clerkConfigured()) return null;
  return (await auth()).userId;
}
