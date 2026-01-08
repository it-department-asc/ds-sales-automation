import {
  collection,
  doc,
  getDocs,
  deleteDoc,
  query,
  where,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { UserSalesSummary } from "./types";

const COLLECTION_NAME = "userSalesSummaries";

// Save or update user sales summary
export async function saveUserSalesSummary(
  userId: string,
  data: Omit<UserSalesSummary, "id" | "userId" | "createdAt" | "updatedAt">
): Promise<void> {
  // Check for existing entry with same user, storeId, branch, and period
  const q = query(
    collection(db, COLLECTION_NAME),
    where("userId", "==", userId),
    where("storeId", "==", data.storeId),
    where("branch", "==", data.branch),
    where("period", "==", data.period)
  );
  const querySnapshot = await getDocs(q);

  const formatNumber = (num: number | undefined | null) => {
    const value = num ?? 0;
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formattedData = {
    userId,
    branchCode: data.branchCode || "",
    period: data.period || "",
    regularQty: data.regularQty ?? 0,
    regularAmt: formatNumber(data.regularAmt as number),
    nonRegularQty: data.nonRegularQty ?? 0,
    nonRegularAmt: formatNumber(data.nonRegularAmt as number),
    totalQtySold: data.totalQtySold ?? 0,
    totalAmt: formatNumber(data.totalAmt as number),
    cashCheck: formatNumber(data.cashCheck as number),
    charge: formatNumber(data.charge as number),
    gc: formatNumber(data.gc as number),
    creditNote: formatNumber(data.creditNote as number),
    totalPayments: formatNumber(data.totalPayments as number),
    amountsMatch: data.amountsMatch ?? false,
    storeId: data.storeId || "",
    branch: data.branch || "",
    region: data.region || "",
    province: data.province || "",
    city: data.city || "",
    lessor: data.lessor || "",
    mallName: data.mallName || "",
    transactionCount: data.transactionCount ?? 0,
    headCount: data.headCount ?? 0,
  };

  if (!querySnapshot.empty) {
    // Update existing entry
    const existingDoc = querySnapshot.docs[0];
    await updateDoc(existingDoc.ref, {
      ...formattedData,
      updatedAt: Date.now(),
    });
  } else {
    // Insert new entry
    await addDoc(collection(db, COLLECTION_NAME), {
      ...formattedData,
      createdAt: Date.now(),
    });
  }
}

// Get user's sales summaries
export async function getUserSalesSummaries(
  userId: string
): Promise<UserSalesSummary[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("userId", "==", userId)
  );
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as UserSalesSummary[];
}

// Get all sales summaries (admin only)
export async function getAllSalesSummaries(): Promise<UserSalesSummary[]> {
  const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as UserSalesSummary[];
}

// Get user sales summaries by user ID (admin only)
export async function getUserSalesSummariesByUserId(
  userId: string
): Promise<UserSalesSummary[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("userId", "==", userId)
  );
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as UserSalesSummary[];
}

// Get existing periods for a user
export async function getExistingPeriods(userId: string): Promise<string[]> {
  const summaries = await getUserSalesSummaries(userId);
  return summaries.map((s) => s.period).filter(Boolean) as string[];
}

// Delete sales summary
export async function deleteSalesSummary(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
}
