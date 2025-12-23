'use client';

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { AdminDashboard } from "../admin/components/AdminDashboard";
import { UserDashboard } from "../user/components/UserDashboard";
import { WaitingForBranch } from "./WaitingForBranch";
import { currentUser } from "@clerk/nextjs/server";

export function SignedInContent() {
  const { user } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);

  return (
    <>
      <UserWelcome user={user} currentUser={currentUser} />
      <RoleBasedDashboard currentUser={currentUser} />
    </>
  );
}

function UserWelcome({ user, currentUser }: { user: any, currentUser: any }) {
  const storeInfo = currentUser?.storeId && currentUser?.branch ? `${currentUser.storeId} ${currentUser.branch}` : '';
  return (
    <>
      <h1 className="text-2xl md:text-4xl font-bold text-black mb-2 md:mb-4">
        Welcome, {user?.firstName || user?.username || 'User'} {storeInfo && `-${storeInfo}`}
      </h1>
      <p className="text-sm md:text-lg text-gray-600 mb-4 md:mb-6">
        Secure authentication made simple with Clerk.
      </p>
    </>
  );
}

function RoleBasedDashboard({ currentUser }: { currentUser: any }) {
  if (currentUser?.role === 'admin') {
    return <AdminDashboard />;
  } else if (currentUser?.role === 'user') {
    // Check if user has store assignment
    if (!currentUser?.storeId || !currentUser?.branch) {
      return <WaitingForBranch />;
    }
    return <UserDashboard currentUser={currentUser} />;
  }
  return null;
}