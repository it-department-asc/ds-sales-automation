import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  addDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { User } from "./types";

const COLLECTION_NAME = "users";

// Create or update user
export async function createUser(userData: Omit<User, "id">): Promise<string> {
  // Check if user already exists by clerkId
  const existingUser = await getUserByClerkId(userData.clerkId);
  if (existingUser) {
    return existingUser.id!;
  }

  // Check if this is the specific admin user
  const isAdminUser = userData.clerkId === "user_372adEWROdQuJunogShuMiKs6ka";

  const userRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...userData,
    role: userData.role || (isAdminUser ? "admin" : "user"),
    status: userData.status || "active",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  return userRef.id;
}

// Get user by Clerk ID
export async function getUserByClerkId(clerkId: string): Promise<User | null> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("clerkId", "==", clerkId)
  );
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null;
  }

  const doc = querySnapshot.docs[0];
  return { id: doc.id, ...doc.data() } as User;
}

// Get user by ID
export async function getUserById(userId: string): Promise<User | null> {
  const docRef = doc(db, COLLECTION_NAME, userId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return { id: docSnap.id, ...docSnap.data() } as User;
}

// Get all users (admin only)
export async function getAllUsers(): Promise<User[]> {
  const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as User[];
}

// Get user count
export async function getUserCount(): Promise<number> {
  const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
  return querySnapshot.size;
}

// Update user
export async function updateUser(
  userId: string,
  updates: Partial<Omit<User, "id" | "clerkId" | "createdAt">>
): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, userId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Date.now(),
  });
}

// Update user role
export async function updateUserRole(
  userId: string,
  role: "user" | "admin"
): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, userId);
  await updateDoc(docRef, {
    role,
    updatedAt: Date.now(),
  });
}

// Update user status
export async function updateUserStatus(
  userId: string,
  status: "active" | "blocked"
): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, userId);
  await updateDoc(docRef, {
    status,
    updatedAt: Date.now(),
  });
}

// Delete user
export async function deleteUser(userId: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, userId);
  await deleteDoc(docRef);
}
