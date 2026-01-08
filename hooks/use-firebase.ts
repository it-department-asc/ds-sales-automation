"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import {
  User,
  UserSalesSummary,
  CombinedUploadedData,
  getUserByClerkId,
  getAllUsers as getAllUsersService,
  getUserCount as getUserCountService,
  createUser as createUserService,
  updateUser as updateUserService,
  updateUserRole as updateUserRoleService,
  updateUserStatus as updateUserStatusService,
  deleteUser as deleteUserService,
  getUserSalesSummaries as getUserSalesSummariesService,
  getAllSalesSummaries as getAllSalesSummariesService,
  getUserSalesSummariesByUserId as getUserSalesSummariesByUserIdService,
  saveUserSalesSummary as saveUserSalesSummaryService,
  getExistingPeriods as getExistingPeriodsService,
  deleteSalesSummary as deleteSalesSummaryService,
  getUploadedData as getUploadedDataService,
  getUploadedDataContent as getUploadedDataContentService,
  getLatestAdminProductFile as getLatestAdminProductFileService,
  saveUploadedData as saveUploadedDataService,
  deleteUploadedData as deleteUploadedDataService,
} from "@/lib/firestore";

// Hook to get current user
export function useCurrentUser() {
  const { user: clerkUser, isLoaded } = useUser();
  const [currentUser, setCurrentUser] = useState<User | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!isLoaded) return;

    if (!clerkUser) {
      setCurrentUser(null);
      setLoading(false);
      return;
    }

    try {
      const user = await getUserByClerkId(clerkUser.id);
      setCurrentUser(user);
    } catch (error) {
      console.error("Error fetching current user:", error);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }, [clerkUser, isLoaded]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { currentUser, loading: loading || !isLoaded, refetch };
}

// Hook to get all users (admin)
export function useAllUsers() {
  const { currentUser } = useCurrentUser();
  const [users, setUsers] = useState<User[] | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!currentUser || currentUser.role !== "admin") {
      setUsers([]);
      setLoading(false);
      return;
    }

    try {
      const allUsers = await getAllUsersService();
      setUsers(allUsers);
    } catch (error) {
      console.error("Error fetching all users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser !== undefined) {
      refetch();
    }
  }, [currentUser, refetch]);

  return { users, loading, refetch };
}

// Hook to get user count
export function useUserCount() {
  const [count, setCount] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const userCount = await getUserCountService();
      setCount(userCount);
    } catch (error) {
      console.error("Error fetching user count:", error);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { count, loading, refetch };
}

// Hook for user mutations
export function useUserMutations() {
  const { currentUser, refetch: refetchCurrentUser } = useCurrentUser();

  const createUser = useCallback(
    async (data: {
      clerkId: string;
      email: string;
      firstName?: string;
      lastName?: string;
      role?: "user" | "admin";
      storeId?: string;
      branch?: string;
      region?: string;
      province?: string;
      city?: string;
      lessor?: string;
      mallName?: string;
      status?: "active" | "blocked";
    }) => {
      const userId = await createUserService({
        ...data,
        role: data.role || "user",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      await refetchCurrentUser();
      return userId;
    },
    [refetchCurrentUser]
  );

  const updateUser = useCallback(
    async (
      userId: string,
      updates: Partial<Omit<User, "id" | "clerkId" | "createdAt">>
    ) => {
      if (!currentUser || currentUser.role !== "admin") {
        throw new Error("Only admins can update user details");
      }
      await updateUserService(userId, updates);
    },
    [currentUser]
  );

  const updateUserRole = useCallback(
    async (userId: string, role: "user" | "admin") => {
      if (!currentUser || currentUser.role !== "admin") {
        throw new Error("Only admins can update user roles");
      }
      await updateUserRoleService(userId, role);
    },
    [currentUser]
  );

  const updateUserStatus = useCallback(
    async (userId: string, status: "active" | "blocked") => {
      if (!currentUser || currentUser.role !== "admin") {
        throw new Error("Only admins can update user status");
      }
      await updateUserStatusService(userId, status);
    },
    [currentUser]
  );

  const deleteUser = useCallback(
    async (userId: string) => {
      if (!currentUser || currentUser.role !== "admin") {
        throw new Error("Only admins can delete users");
      }
      await deleteUserService(userId);
    },
    [currentUser]
  );

  return { createUser, updateUser, updateUserRole, updateUserStatus, deleteUser };
}

// Hook to get user's sales summaries
export function useUserSalesSummaries() {
  const { currentUser } = useCurrentUser();
  const [summaries, setSummaries] = useState<UserSalesSummary[] | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!currentUser) {
      setSummaries(undefined);
      setLoading(false);
      return;
    }

    try {
      const data = await getUserSalesSummariesService(currentUser.id!);
      setSummaries(data);
    } catch (error) {
      console.error("Error fetching user sales summaries:", error);
      setSummaries([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser !== undefined) {
      refetch();
    }
  }, [currentUser, refetch]);

  return { summaries, loading, refetch };
}

// Hook to get all sales summaries (admin)
export function useAllSalesSummaries() {
  const { currentUser } = useCurrentUser();
  const [summaries, setSummaries] = useState<UserSalesSummary[] | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!currentUser || currentUser.role !== "admin") {
      setSummaries([]);
      setLoading(false);
      return;
    }

    try {
      const data = await getAllSalesSummariesService();
      setSummaries(data);
    } catch (error) {
      console.error("Error fetching all sales summaries:", error);
      setSummaries([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser !== undefined) {
      refetch();
    }
  }, [currentUser, refetch]);

  return { summaries, loading, refetch };
}

// Hook to get sales summaries by user ID (admin)
export function useSalesSummariesByUserId(userId?: string) {
  const { currentUser } = useCurrentUser();
  const [summaries, setSummaries] = useState<UserSalesSummary[] | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!currentUser || currentUser.role !== "admin" || !userId) {
      setSummaries([]);
      setLoading(false);
      return;
    }

    try {
      const data = await getUserSalesSummariesByUserIdService(userId);
      setSummaries(data);
    } catch (error) {
      console.error("Error fetching sales summaries by user:", error);
      setSummaries([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser, userId]);

  useEffect(() => {
    if (currentUser !== undefined) {
      refetch();
    }
  }, [currentUser, userId, refetch]);

  return { summaries, loading, refetch };
}

// Hook for sales summary mutations
export function useSalesSummaryMutations() {
  const { currentUser } = useCurrentUser();

  const saveSalesSummary = useCallback(
    async (data: Omit<UserSalesSummary, "id" | "userId" | "createdAt" | "updatedAt">) => {
      if (!currentUser) {
        throw new Error("Not authenticated");
      }
      await saveUserSalesSummaryService(currentUser.id!, data);
    },
    [currentUser]
  );

  const deleteSalesSummary = useCallback(
    async (id: string) => {
      if (!currentUser || currentUser.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }
      await deleteSalesSummaryService(id);
    },
    [currentUser]
  );

  return { saveSalesSummary, deleteSalesSummary };
}

// Hook to get existing periods
export function useExistingPeriods() {
  const { currentUser } = useCurrentUser();
  const [periods, setPeriods] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!currentUser) {
      setPeriods([]);
      setLoading(false);
      return;
    }

    try {
      const data = await getExistingPeriodsService(currentUser.id!);
      setPeriods(data);
    } catch (error) {
      console.error("Error fetching existing periods:", error);
      setPeriods([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser !== undefined) {
      refetch();
    }
  }, [currentUser, refetch]);

  return { periods, loading, refetch };
}

// Hook to get uploaded data
export function useUploadedData() {
  const { currentUser } = useCurrentUser();
  const [data, setData] = useState<CombinedUploadedData[] | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!currentUser) {
      setData(undefined);
      setLoading(false);
      return;
    }

    try {
      const uploadedData = await getUploadedDataService(
        currentUser.id!,
        currentUser.role === "admin"
      );
      setData(uploadedData);
    } catch (error) {
      console.error("Error fetching uploaded data:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser !== undefined) {
      refetch();
    }
  }, [currentUser, refetch]);

  return { data, loading, refetch };
}

// Hook to get uploaded data content
export function useUploadedDataContent(fileId?: string, offset = 0, limit = 8000) {
  const [content, setContent] = useState<{
    data: any[];
    totalRows: number;
    hasMore: boolean;
    nextOffset: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!fileId) {
      setContent(null);
      setLoading(false);
      return;
    }

    try {
      const result = await getUploadedDataContentService(fileId, offset, limit);
      setContent(result);
    } catch (error) {
      console.error("Error fetching uploaded data content:", error);
      setContent(null);
    } finally {
      setLoading(false);
    }
  }, [fileId, offset, limit]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { content, loading, refetch };
}

// Hook to get latest admin product file
export function useLatestAdminProductFile() {
  const { currentUser } = useCurrentUser();
  const [file, setFile] = useState<CombinedUploadedData | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!currentUser) {
      // Keep loading true until we have currentUser
      return;
    }

    try {
      // Fetch all users to get admin IDs (this is needed for any user to see admin uploads)
      const allUsers = await getAllUsersService();
      const adminIds = allUsers.filter((u) => u.role === "admin").map((u) => u.id!);

      if (adminIds.length === 0) {
        setFile(null);
        setLoading(false);
        return;
      }

      const latestFile = await getLatestAdminProductFileService(adminIds);
      setFile(latestFile);
    } catch (error) {
      console.error("Error fetching latest admin product file:", error);
      setFile(null);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser !== undefined) {
      refetch();
    }
  }, [currentUser, refetch]);

  return { file, loading, refetch };
}

// Hook for uploaded data mutations
export function useUploadedDataMutations() {
  const { currentUser, loading } = useCurrentUser();

  const saveUploadedData = useCallback(
    async (data: { fileId: string; fileName: string; partition: number; data: any[] }) => {
      if (loading) {
        throw new Error("User data is still loading. Please wait.");
      }
      if (!currentUser) {
        throw new Error("Not authenticated. Please sign in first.");
      }
      if (!currentUser.id) {
        throw new Error("User ID not found. Please try signing out and back in.");
      }
      await saveUploadedDataService(currentUser.id, data);
    },
    [currentUser, loading]
  );

  const deleteUploadedData = useCallback(async (fileId: string) => {
    await deleteUploadedDataService(fileId);
  }, []);

  return { saveUploadedData, deleteUploadedData, loading, currentUser };
}
