'use client';

import { useUser } from "@clerk/nextjs";
import { useCurrentUser, useUserSalesSummaries } from "@/hooks/use-firebase";
import { useRouter } from 'next/navigation';
import { AdminDashboard } from "../admin/components/AdminDashboard";
import { UserDashboard } from "../user/components/UserDashboard";
import { WaitingForBranch } from "./WaitingForBranch";
import { Loading } from "../../components/ui/loading";
import { SalesSummaryReminderModal } from "./SalesSummaryReminderModal";
import { useState, useEffect, useRef } from "react";

export function SignedInContent() {
  const { user, isLoaded: clerkLoaded } = useUser();
  const { currentUser, loading: userLoading, refetch: refetchCurrentUser } = useCurrentUser();

  // Listen for user-synced event to refetch current user (new user registration)
  useEffect(() => {
    const handleUserSynced = () => {
      refetchCurrentUser();
    };
    window.addEventListener('user-synced', handleUserSynced);
    return () => window.removeEventListener('user-synced', handleUserSynced);
  }, [refetchCurrentUser]);

  // Show loading immediately on login until all data is fully loaded
  if (!clerkLoaded || !user || userLoading || currentUser === undefined) {
    return <Loading />;
  }

  return <RoleBasedDashboard user={user} currentUser={currentUser} />;
}

function UserWelcome({ user, currentUser }: { user: any, currentUser: any }) {
  const [logsExpanded, setLogsExpanded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { summaries: userSalesSummaries, refetch: refetchUserSalesSummaries } = useUserSalesSummaries();
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setLogsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Refresh summaries and router when modal Continue is clicked
  useEffect(() => {
    const onModalContinue = () => {
      try {
        if (refetchUserSalesSummaries) refetchUserSalesSummaries();
        if (router && typeof (router as any).refresh === 'function') {
          (router as any).refresh();
        }
      } catch (e) {
        console.error('Error refreshing summaries on modal continue:', e);
        try { window.location.reload(); } catch {}
      }
    };

    window.addEventListener('success-modal-continue', onModalContinue as EventListener);
    return () => window.removeEventListener('success-modal-continue', onModalContinue as EventListener);
  }, [refetchUserSalesSummaries, router]);

  const storeInfo = currentUser?.storeId && currentUser?.branch ? `${currentUser.storeId} ${currentUser.branch}` : '';
  const userName = user?.firstName || user?.username || 'User';
  const userRole = currentUser?.role === 'admin' ? 'Administrator' : 'User';
  
  // Find the most recent summary based on latest activity (updatedAt or createdAt)
  const mostRecentSummary = userSalesSummaries && userSalesSummaries.length > 0 ? userSalesSummaries.reduce((latest, current) => {
    const latestTime = latest.updatedAt || latest.createdAt;
    const currentTime = current.updatedAt || current.createdAt;
    return currentTime > latestTime ? current : latest;
  }) : null;
  
  const lastActivityTime = mostRecentSummary ? new Date(mostRecentSummary.updatedAt || mostRecentSummary.createdAt) : null;
  const isToday = lastActivityTime && lastActivityTime.toDateString() === new Date().toDateString();

  return (
    <div className="bg-white rounded-2xl p-8 md:p-12 shadow-lg border border-gray-100 mb-8">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
        
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

        {currentUser?.role !== 'admin' && (isToday && lastActivityTime ? (
          <div className="flex-shrink-0" ref={dropdownRef}>
            <div className="relative">
              <button
                onClick={() => setLogsExpanded(!logsExpanded)}
                className="inline-flex items-center gap-2 bg-green-100 border border-green-300 rounded-full px-4 py-2 shadow-sm hover:bg-green-200 transition-colors"
              >
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="text-green-800 font-medium text-sm">
                  {mostRecentSummary?.updatedAt ? `Sales Summary Updated Today - ${mostRecentSummary.period}` : `Sales Summary Saved Today - ${mostRecentSummary?.period}`}
                </div>
                <div className="text-green-600 text-xs">
                  {mostRecentSummary?.updatedAt 
                    ? new Date(mostRecentSummary.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : lastActivityTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  }
                </div>
                <svg className={`w-4 h-4 text-green-600 transition-transform ${logsExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {logsExpanded && mostRecentSummary && (
                <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10 min-w-64">
                  <div className="text-xs font-medium text-gray-700 mb-2">Activity Logs - {mostRecentSummary.period}</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-gray-600">Created:</span>
                      <span className="text-xs font-medium text-gray-900">
                        {new Date(mostRecentSummary.createdAt).toLocaleDateString()} {new Date(mostRecentSummary.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {mostRecentSummary?.updatedAt && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-xs text-gray-600">Updated:</span>
                        <span className="text-xs font-medium text-gray-900">
                          {new Date(mostRecentSummary.updatedAt).toLocaleDateString()} {new Date(mostRecentSummary.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
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