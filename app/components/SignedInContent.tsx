'use client';

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { AdminDashboard } from "../admin/components/AdminDashboard";
import { UserDashboard } from "../user/components/UserDashboard";
import { WaitingForBranch } from "./WaitingForBranch";
import { Loading } from "../../components/ui/loading";
import { SalesSummaryReminderModal } from "./SalesSummaryReminderModal";

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
  const userName = user?.firstName || user?.username || 'User';
  const userRole = currentUser?.role === 'admin' ? 'Administrator' : 'User';
  
  // Get user's sales summaries to check if they saved today
  const userSalesSummaries = useQuery(api.userSalesSummaries.getUserSalesSummaries);
  
  // Check if user has saved a sales summary today
  const hasSavedToday = userSalesSummaries && userSalesSummaries.length > 0;
  const lastSaveTime = hasSavedToday ? new Date(userSalesSummaries[userSalesSummaries.length - 1].createdAt) : null;
  const isToday = lastSaveTime && lastSaveTime.toDateString() === new Date().toDateString();

  return (
    <div className="bg-white rounded-2xl p-8 md:p-12 shadow-lg border border-gray-100 mb-8">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        
        <div className="text-center md:text-left flex-1">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {userName}!
          </h1>
          <p className="text-gray-600 text-lg mb-6">
            {userRole} Dashboard • {storeInfo || 'No store assigned'}
          </p>
          <div className="flex flex-wrap gap-3 justify-center md:justify-start">
            <div className="bg-purple-50 text-purple-700 px-4 py-2 rounded-lg text-sm font-medium">
              Role: {userRole}
            </div>
            {storeInfo && (
              <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium">
                Store: {storeInfo}
              </div>
            )}
            <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-medium">
              Status: Active
            </div>
          </div>
        </div>

        {currentUser?.role !== 'admin' && (isToday && lastSaveTime ? (
          <div className="flex-shrink-0">
            <div className="inline-flex items-center gap-2 bg-green-100 border border-green-300 rounded-full px-4 py-2 shadow-sm">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-green-800 font-medium text-sm">
                Sales Summary Saved Today
              </div>
              <div className="text-green-600 text-xs">
                {lastSaveTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ) : currentUser?.role !== 'admin' && (
          <div className="flex-shrink-0">
            <div className="inline-flex items-center gap-2 bg-orange-100 border border-orange-300 rounded-full px-4 py-2 shadow-sm">
              <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="text-orange-800 font-medium text-sm">
                Upload Sales Summary
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
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
        <SalesSummaryReminderModal currentUser={currentUser} />
        <UserDashboard currentUser={currentUser} />
      </>
    );
  }
  return <Loading />;
}