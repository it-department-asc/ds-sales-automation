// Firestore type definitions matching Convex schema

export interface User {
  id?: string; // Firestore document ID
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: "user" | "admin";
  status?: "active" | "blocked";
  storeId?: string;
  branch?: string;
  region?: string;
  province?: string;
  city?: string;
  lessor?: string;
  mallName?: string;
  createdAt: number;
  updatedAt: number;
}

export interface UploadedData {
  id?: string; // Firestore document ID
  userId: string;
  fileId: string;
  fileName: string;
  partition: number;
  data: any[];
  createdAt: number;
}

export interface UserSalesSummary {
  id?: string; // Firestore document ID
  userId: string;
  branchCode: string;
  period?: string;
  regularQty: number;
  regularAmt: number | string;
  nonRegularQty: number;
  nonRegularAmt: number | string;
  totalQtySold: number;
  totalAmt: number | string;
  cashCheck?: number | string;
  charge?: number | string;
  gc?: number | string;
  creditNote?: number | string;
  totalPayments?: number | string;
  amountsMatch?: boolean;
  storeId?: string;
  branch?: string;
  region?: string;
  province?: string;
  city?: string;
  lessor?: string;
  mallName?: string;
  transactionCount?: number;
  headCount?: number;
  createdAt: number;
  updatedAt?: number;
}

// Combined file type (after combining partitions)
export interface CombinedUploadedData {
  id: string;
  userId: string;
  fileId: string;
  fileName: string;
  createdAt: number;
  uploaderName: string;
  data?: any[];
}
