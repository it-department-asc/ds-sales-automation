'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useRef } from 'react';
import { createUser } from '@/lib/firestore';

export function UserSync() {
  const { user, isLoaded } = useUser();
  const syncedRef = useRef(false);

  useEffect(() => {
    if (isLoaded && user && !syncedRef.current) {
      syncedRef.current = true;
      createUser({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress || '',
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        role: 'user',
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }).then(() => {
        // Notify that user was created so other components can refetch
        window.dispatchEvent(new CustomEvent('user-synced'));
      }).catch((error) => {
        console.error('UserSync - User creation error:', error);
        syncedRef.current = false;
      });
    }
  }, [isLoaded, user]);

  return null;
}