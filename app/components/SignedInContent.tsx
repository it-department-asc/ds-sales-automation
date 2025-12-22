'use client';

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { AdminDashboard } from "../admin/components/AdminDashboard";
import { UserDashboard } from "../user/components/UserDashboard";

export function SignedInContent() {
  const { user } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);

  return (
    <>
      <UserWelcome user={user} />
      <RoleBasedDashboard currentUser={currentUser} />
    </>
  );
}

function UserWelcome({ user }: { user: any }) {
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

function RoleBasedDashboard({ currentUser }: { currentUser: any }) {
  if (currentUser?.role === 'admin') {
    return <AdminDashboard />;
  } else {
    return <UserDashboard />;
  }
}