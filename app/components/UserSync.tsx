'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

export function UserSync() {
  const { user, isLoaded } = useUser();
  const createUser = useMutation(api.users.createUser);

  useEffect(() => {
    if (isLoaded && user) {
      createUser({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress || '',
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
      }).then((result) => {
        console.log('UserSync - User creation result:', result);
      }).catch((error) => {
        console.error('UserSync - User creation error:', error);
      });
    }
  }, [isLoaded, user, createUser]);

  return null;
}