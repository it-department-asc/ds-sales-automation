'use client';

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { AdminDashboard } from "../admin/components/AdminDashboard";
import { UserDashboard } from "../user/components/UserDashboard";
import { WaitingForBranch } from "./WaitingForBranch";
import { Loading } from "../../components/ui/loading";

export function SignedInContent() {
  const { user, isLoaded: clerkLoaded } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);

  // Show loading immediately on login until all data is fully loaded
  if (!clerkLoaded || !user || currentUser === undefined) {
    return <Loading />;
  }

  return <RoleBasedDashboard user={user} currentUser={currentUser} />;
}

function UserWelcome({ user, currentUser }: { user: any, currentUser: any }) {
  const storeInfo = currentUser?.storeId && currentUser?.branch ? `${currentUser.storeId} ${currentUser.branch}` : '';
  return (
    <>
      <h1 className="text-2xl md:text-4xl font-bold text-black mb-2 md:mb-4">
        Welcome, {user?.firstName || user?.username || 'User'}
      </h1>
      <p className="text-sm md:text-lg text-gray-600 mb-4 md:mb-6">
        Secure authentication made simple with Clerk.
      </p>
    </>
  );
}

function RoleBasedDashboard({ user, currentUser }: { user: any, currentUser: any }) {
  if (currentUser?.role === 'admin') {
    return (
      <>
        <UserWelcome user={user} currentUser={currentUser} />
        <AdminDashboard />
      </>
    );
  } else if (currentUser?.role === 'user') {
    // Check if user has store assignment
    if (!currentUser?.storeId || !currentUser?.branch) {
      return (
        <>
          <UserWelcome user={user} currentUser={currentUser} />
          <WaitingForBranch />
        </>
      );
    }
    return (
      <>
        <UserWelcome user={user} currentUser={currentUser} />
        <UserDashboard currentUser={currentUser} />
      </>
    );
  }
  return <Loading />;
}