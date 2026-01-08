'use client';

import React, { useEffect, useState } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { useCurrentUser, useAllUsers, useUserCount } from '@/hooks/use-firebase';
import { AdminUserCard } from '../admin/components/AdminUserCard';

export default function UserDashboardClient() {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { getToken } = useAuth();
  const { currentUser } = useCurrentUser();
  const { users: allUsers } = useAllUsers();
  const { count: userCount } = useUserCount();

  const [jwtToken, setJwtToken] = useState<string | null>(null);

  useEffect(() => {
    const testToken = async () => {
      if (clerkLoaded && clerkUser) {
        try {
          const token = await getToken({ template: 'convex' });
          setJwtToken(token ? 'Token received' : 'No token');
        } catch (error) {
          console.error('JWT Token error:', error);
          setJwtToken('Token error');
        }
      }
    };
    testToken();
  }, [clerkLoaded, clerkUser, getToken]);

  return (
    <div className="bg-gray-50 rounded-lg p-8 mt-12">
      <h2 className="text-2xl font-semibold text-black mb-4">Your Dashboard</h2>
      <p className="text-gray-600 mb-4">Clerk Status: {clerkLoaded ? 'Loaded' : 'Loading...'}</p>
      <p className="text-gray-600 mb-4">Clerk User ID: {clerkUser?.id || 'Not signed in'}</p>
      <p className="text-gray-600 mb-4">JWT Token Status: {jwtToken || 'Checking...'}</p>
      <p className="text-gray-600 mb-4">Role: {currentUser?.role || 'Loading...'}</p>
      <p className="text-gray-600 mb-4">Debug - User ID: {currentUser?.id || 'Not found'}</p>
      <p className="text-gray-600 mb-4">Debug - Email: {currentUser?.email || 'Not found'}</p>
      <p className="text-gray-600 mb-4">Debug - Total Users in DB: {userCount ?? 'Loading...'}</p>

      {currentUser?.role === 'admin' && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-black mb-4">All Users</h3>
          <div className="space-y-2">
            {allUsers?.map((u) => (
              <AdminUserCard key={u.id} user={u} />
            ))}
          </div>
        </div>
      )}

      <p className="text-gray-600">Explore your dashboard and manage your account.</p>
    </div>
  );
}
