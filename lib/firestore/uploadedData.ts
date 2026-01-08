import {
  collection,
  doc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  addDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { UploadedData, CombinedUploadedData } from "./types";
import { getUserById } from "./users";

const COLLECTION_NAME = "uploadedData";

// Save uploaded data partition
export async function saveUploadedData(
  userId: string,
  data: Omit<UploadedData, "id" | "userId" | "createdAt">
): Promise<string> {
  // Firestore doesn't support nested arrays, so we stringify the data
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    userId,
    fileId: data.fileId,
    fileName: data.fileName,
    partition: data.partition,
    data: JSON.stringify(data.data), // Serialize nested arrays
    createdAt: Date.now(),
  });
  return docRef.id;
}

// Get uploaded data for a user (or all for admin)
export async function getUploadedData(
  userId: string,
  isAdmin: boolean
): Promise<CombinedUploadedData[]> {
  let querySnapshot;

  if (isAdmin) {
    querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
  } else {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("userId", "==", userId)
    );
    querySnapshot = await getDocs(q);
  }

  const data = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as UploadedData[];

  // Group by fileId
  const fileMap = new Map<string, UploadedData[]>();
  data.forEach((item) => {
    if (!fileMap.has(item.fileId)) {
      fileMap.set(item.fileId, []);
    }
    fileMap.get(item.fileId)!.push(item);
  });

  // Combine partitions and add uploader info
  const combinedData: CombinedUploadedData[] = [];
  for (const [fileId, partitions] of fileMap) {
    partitions.sort((a, b) => a.partition - b.partition);
    const uploader = await getUserById(partitions[0].userId);
    combinedData.push({
      id: partitions[0].id!,
      userId: partitions[0].userId,
      fileId,
      fileName: partitions[0].fileName,
      createdAt: partitions[0].createdAt,
      uploaderName: uploader
        ? `${uploader.firstName || ""} ${uploader.lastName || ""}`.trim() ||
          uploader.email
        : "Unknown",
    });
  }

  return combinedData;
}

// Get uploaded data content by fileId with pagination
export async function getUploadedDataContent(
  fileId: string,
  offset: number = 0,
  limit: number = 8000
): Promise<{
  data: any[];
  totalRows: number;
  hasMore: boolean;
  nextOffset: number;
} | null> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("fileId", "==", fileId)
  );
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null;
  }

  const partitions = querySnapshot.docs
    .map((doc) => {
      const docData = doc.data();
      return {
        id: doc.id,
        ...docData,
        // Parse the stringified data back to array
        data: typeof docData.data === 'string' ? JSON.parse(docData.data) : docData.data,
      };
    })
    .sort((a: any, b: any) => a.partition - b.partition) as UploadedData[];

  const fullData = partitions.flatMap((p) => p.data);
  const slicedData = fullData.slice(offset, offset + limit);

  return {
    data: slicedData,
    totalRows: fullData.length,
    hasMore: offset + limit < fullData.length,
    nextOffset: offset + limit,
  };
}

// Get latest admin product file
export async function getLatestAdminProductFile(
  adminUserIds: string[]
): Promise<CombinedUploadedData | null> {
  if (adminUserIds.length === 0) return null;

  const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
  const allFiles = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as UploadedData[];

  // Filter admin files
  const adminFiles = allFiles.filter((f) => adminUserIds.includes(f.userId));
  if (adminFiles.length === 0) return null;

  // Group by fileId
  const fileMap = new Map<string, UploadedData[]>();
  adminFiles.forEach((item) => {
    if (!fileMap.has(item.fileId)) {
      fileMap.set(item.fileId, []);
    }
    fileMap.get(item.fileId)!.push(item);
  });

  // Find the latest file
  let latestFileId: string | null = null;
  let latestCreatedAt = 0;
  for (const [fileId, partitions] of fileMap) {
    const createdAt = partitions[0].createdAt;
    if (createdAt > latestCreatedAt) {
      latestCreatedAt = createdAt;
      latestFileId = fileId;
    }
  }

  if (!latestFileId) return null;

  const partitions = fileMap.get(latestFileId)!;
  partitions.sort((a, b) => a.partition - b.partition);

  const uploader = await getUserById(partitions[0].userId);

  return {
    id: partitions[0].id!,
    userId: partitions[0].userId,
    fileId: latestFileId,
    fileName: partitions[0].fileName,
    createdAt: partitions[0].createdAt,
    uploaderName: uploader
      ? `${uploader.firstName || ""} ${uploader.lastName || ""}`.trim() ||
        uploader.email
      : "Unknown",
  };
}

// Delete uploaded data by fileId
export async function deleteUploadedData(fileId: string): Promise<void> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("fileId", "==", fileId)
  );
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    throw new Error("Data not found");
  }

  // Delete all partitions
  await Promise.all(querySnapshot.docs.map((doc) => deleteDoc(doc.ref)));
}
