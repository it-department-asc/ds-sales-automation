'use client';

import { useUser, useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect } from "react";

export function UserDashboard() {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { getToken } = useAuth();
  const currentUser = useQuery(api.users.getCurrentUser);
  const userCount = useQuery(api.users.getUserCount);

  // Test JWT token
  const [jwtToken, setJwtToken] = useState<string | null>(null);

  useEffect(() => {
    const testToken = async () => {
      if (clerkLoaded && clerkUser) {
        try {
          const token = await getToken({ template: "convex" });
          console.log('JWT raw token:', token);
          setJwtToken(token ? "Token received" : "No token");
          console.log('JWT Token available:', !!token);
        } catch (error) {
          console.error('JWT Token error:', error);
          setJwtToken("Token error");
        }
      }
    };
    testToken();
  }, [clerkLoaded, clerkUser, getToken]);

  return (
    <div className="bg-gray-50 rounded-lg p-4 md:p-8 mt-12">
      <h2 className="text-2xl font-semibold text-black mb-4">
        Your Dashboard !!
      </h2>
      <p className="text-gray-600 mb-4">
        Clerk Status: {clerkLoaded ? 'Loaded' : 'Loading...'}
      </p>
      <p className="text-gray-600 mb-4">
        Clerk User ID: {clerkUser?.id || 'Not signed in'}
      </p>
      <p className="text-gray-600 mb-4">
        JWT Token Status: {jwtToken || 'Checking...'}
      </p>
      <p className="text-gray-600 mb-4">
        Role: {currentUser?.role || 'Loading...'}
      </p>
      <p className="text-gray-600 mb-4">
        Debug - User ID: {currentUser?._id || 'Not found'}
      </p>
      <p className="text-gray-600 mb-4">
        Debug - Email: {currentUser?.email || 'Not found'}
      </p>
      <p className="text-gray-600 mb-4">
        Debug - Total Users in DB: {userCount ?? 'Loading...'}
      </p>

      <p className="text-gray-600">
        Explore your dashboard and manage your account.
      </p>
    </div>
  );
}