"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useCurrentUser, useUploadedData, useUploadedDataMutations } from "@/hooks/use-firebase";
import { Loading } from "../../../components/ui/loading";
import { AccessDenied } from "../../../components/ui/access-denied";
import { Button } from "../../../components/ui/button";
import { Trash2, FileText } from "lucide-react";
import { useConfirm } from "../../../hooks/use-confirm";

const ExcelA = dynamic(() => import("../../../components/ExcelA"));

export default function ExcelViewPage() {
  const [localData, setLocalData] = useState<{ fileName: string; data: any[]; date: number } | null>(null);

  const { currentUser, loading: userLoading } = useCurrentUser();
  const { data: uploadedData, refetch: refetchUploadedData } = useUploadedData();
  const { deleteUploadedData } = useUploadedDataMutations();

  // Local state for optimistic updates
  const [localUploadedData, setLocalUploadedData] = useState<any[] | null>(null);

  // Sync local state from hook
  useEffect(() => {
    if (uploadedData) setLocalUploadedData(uploadedData);
  }, [uploadedData]);

  // Called when a file is saved to Firebase
  const handleFileSaved = async (fileInfo: { fileId: string; fileName: string }) => {
    // Optimistically add to local state
    const newFile = {
      id: fileInfo.fileId,
      fileId: fileInfo.fileId,
      fileName: fileInfo.fileName,
      createdAt: new Date().toISOString(),
      uploaderName: currentUser ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email : 'Unknown',
      userId: currentUser?.id,
    };
    setLocalUploadedData(prev => prev ? [newFile, ...prev] : [newFile]);
    // Also refetch to ensure consistency
    await refetchUploadedData();
  };

  const [ConfirmationDialog, confirm] = useConfirm("Delete File", "Are you sure you want to delete this uploaded file?");

  const localDateString = localData ? (() => {
    const saveDate = new Date(localData.date);
    return isNaN(saveDate.getTime()) 
      ? "Unknown date" 
      : `${saveDate.toLocaleDateString()} at ${saveDate.toLocaleTimeString()}`;
  })() : null;

  useEffect(() => {
    const stored = localStorage.getItem("uploadedData");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (typeof parsed === 'object' && parsed.data && parsed.fileName && parsed.date) {
          setLocalData(parsed);
        } else {
          // Old format, assume it's just data
          setLocalData({ fileName: "Local Storage File", data: parsed, date: Date.now() });
        }
      } catch (error) {
        console.error("Error parsing localStorage data:", error);
      }
    }
  }, []);

  const handleDelete = async (fileId: string) => {
    const confirmed = await confirm();
    if (confirmed) {
      try {
        await deleteUploadedData(fileId);
        // Optimistically remove from local state
        setLocalUploadedData(prev => prev ? prev.filter(item => item.fileId !== fileId) : prev);
      } catch (error) {
        alert("Error deleting: " + error);
      }
    }
  };

  const handleDeleteLocal = async () => {
    const confirmed = await confirm();
    if (confirmed) {
      localStorage.removeItem("uploadedData");
      setLocalData(null);
    }
  };

  if (userLoading || currentUser === undefined || currentUser === null) {
    return <Loading />;
  }

  if (currentUser.role !== "admin") {
    return <AccessDenied />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2 text-center">Excel/CSV File Upload</h1>
      <p className="text-gray-600 text-center mb-6">Upload and manage product data files for sales processing</p>

      <ExcelA onFileSaved={handleFileSaved} />

      {/* Saved Files Section */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FileText className="mr-2" />
          {currentUser?.role === "admin" ? "All Saved Files" : "Your Saved Files"}
        </h2>
        {((localUploadedData && localUploadedData.length > 0) || localData) ? (
          <div className="space-y-4">
            {localUploadedData?.map((item) => {
              const uploadDate = new Date(item.createdAt);
              const dateString = isNaN(uploadDate.getTime()) 
                ? "Unknown date" 
                : `${uploadDate.toLocaleDateString()} at ${uploadDate.toLocaleTimeString()}`;
              return (
                <div key={item.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium">{item.fileName}</p>
                    <p className="text-sm text-gray-500">Uploaded on {dateString}</p>
                    <p className="text-sm text-gray-600">By: {item.uploaderName}</p>
                    <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">Stored in Firebase</span>
                  </div>
                  <Button
                    onClick={() => handleDelete(item.fileId)}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
            {localData && (
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium">{localData.fileName}</p>
                  <p className="text-sm text-gray-500">Saved on {localDateString}</p>
                  <p className="text-sm text-gray-600">By: {currentUser ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email : 'Unknown'}</p>
                  <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Stored locally</span>
                </div>
                <Button
                  onClick={handleDeleteLocal}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500">No files saved yet.</p>
        )}
      </div>

      <ConfirmationDialog />
    </div>
    </div>
  );
}