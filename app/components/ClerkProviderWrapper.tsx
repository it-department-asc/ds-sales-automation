'use client';

import { ClerkProvider } from '@clerk/nextjs';

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
      {children}
    </ClerkProvider>
  );
}