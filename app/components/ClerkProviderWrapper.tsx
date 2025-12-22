'use client';

import { ClerkProvider, useAuth } from '@clerk/nextjs';
import { ConvexReactClient } from 'convex/react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ClerkProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        elements: {
          logoBox: 'transform scale-400 pointer-events: none;',
        },
      }}
    >
      <ConvexProviderWithClerk
        client={convex}
        useAuth={useAuth}
      >
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}