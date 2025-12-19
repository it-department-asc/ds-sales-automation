'use client';

import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { AuthButtons } from './AuthButtons';

export function Header() {
  return (
    <header className="sticky top-0 z-50 flex justify-between items-center p-4 bg-white shadow-sm">
      <div>
        <h1 className="text-xl font-semibold text-black">
          DS
        </h1>
      </div>
      <div className="flex items-center">
        <SignedOut>
          <AuthButtons />
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </header>
  );
}