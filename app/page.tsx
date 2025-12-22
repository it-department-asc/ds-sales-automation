'use client';

export const dynamic = 'force-dynamic';

import { SignedIn, SignedOut, useUser, useAuth } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { AuthButtons } from "./components/AuthButtons";
import { useState, useEffect } from "react";

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
            <UserDashboard />
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

function UserDashboard() {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { getToken } = useAuth();
  const currentUser = useQuery(api.users.getCurrentUser);
  const allUsers = useQuery(api.users.getAllUsers);
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
    <div className="bg-gray-50 rounded-lg p-8 mt-12">
      <h2 className="text-2xl font-semibold text-black mb-4">
        Your Dashboard
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

      {currentUser?.role === 'admin' && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-black mb-4">All Users</h3>
          <div className="space-y-2">
            {allUsers?.map((user) => (
              <AdminUserCard key={user._id} user={user} />
            ))}
          </div>
        </div>
      )}

      <p className="text-gray-600">
        Explore your dashboard and manage your account.
      </p>
    </div>
  );
}

function AdminUserCard({ user }: { user: any }) {
  const updateUserRole = useMutation(api.users.updateUserRole);

  const handleRoleChange = (newRole: "user" | "admin") => {
    updateUserRole({ userId: user._id, role: newRole });
  };

  return (
    <div className="bg-white p-4 rounded border">
      <p className="text-black mb-2">{user.firstName} {user.lastName} - {user.email}</p>
      <div className="flex items-center gap-2">
        <span className="text-gray-600">Role:</span>
        <select
          value={user.role}
          onChange={(e) => handleRoleChange(e.target.value as "user" | "admin")}
          className="px-2 py-1 border rounded text-black"
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>
    </div>
  );
}
