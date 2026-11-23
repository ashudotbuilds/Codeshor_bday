'use client';
import { SignInButton, UserButton } from '@clerk/nextjs';

export function OrganizerSignIn() {
  return <SignInButton mode="modal" forceRedirectUrl="/organizer" signUpForceRedirectUrl="/organizer">
    <button className="button">Sign in</button>
  </SignInButton>;
}

export function OrganizerAccount() {
  return <UserButton />;
}
