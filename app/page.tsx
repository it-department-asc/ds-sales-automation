'use client';

export const dynamic = 'force-dynamic';

import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import { AuthButtons } from "./components/AuthButtons";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <main className="container mx-auto px-4 py-16 flex items-center justify-center min-h-screen">
        <div className="text-center max-w-2xl">
          <SignedOut>
            <h1 className="text-5xl md:text-7xl font-bold text-black mb-6">
              Welcome
            </h1>
            <p className="text-xl text-gray-600 mb-12">
              Secure authentication made simple with Clerk.
            </p>
            <AuthButtons />
          </SignedOut>

          <SignedIn>
            <UserWelcome />
            <div className="bg-gray-50 rounded-lg p-8 mt-12">
              <h2 className="text-2xl font-semibold text-black mb-4">
                You're signed in!
              </h2>
              <p className="text-gray-600">
                Explore your dashboard and manage your account.
              </p>
            </div>
          </SignedIn>
        </div>
      </main>
    </div>
  );
}

function UserWelcome() {
  const { user } = useUser();

  return (
    <>
      <h1 className="text-5xl md:text-7xl font-bold text-black mb-6">
        Welcome, {user?.firstName || user?.username || 'User'}
      </h1>
      <p className="text-xl text-gray-600 mb-12">
        Secure authentication made simple with Clerk.
      </p>
    </>
  );
}
