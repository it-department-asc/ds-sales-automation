"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Loading } from "../../../components/ui/loading";
import { AccessDenied } from "../../../components/ui/access-denied";
import { Button } from "../../../components/ui/button";
import { Trash2, FileText } from "lucide-react";

const ExcelA = dynamic(() => import("../../../components/ExcelA"));

export default function ExcelViewPage() {
  const [localData, setLocalData] = useState<{ fileName: string; data: any[]; date: number } | null>(null);

  const currentUser = useQuery(api.users.getCurrentUser);
  const uploadedData = useQuery(api.uploadedData.getUploadedData);
  const deleteData = useMutation(api.uploadedData.deleteUploadedData);

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
    if (confirm("Are you sure you want to delete this uploaded file?")) {
      try {
        await deleteData({ fileId });
      } catch (error) {
        alert("Error deleting: " + error);
      }
    }
  };

  const handleDeleteLocal = () => {
    localStorage.removeItem("uploadedData");
    setLocalData(null);
  };

  if (currentUser === undefined || currentUser === null) {
    return <Loading />;
  }

  if (currentUser.role !== "admin") {
    return <AccessDenied />;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Excel/CSV File Upload</h1>

      <ExcelA />

      {/* Saved Files Section */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FileText className="mr-2" />
          {currentUser?.role === "admin" ? "All Saved Files" : "Your Saved Files"}
        </h2>
        {((uploadedData && uploadedData.length > 0) || localData) ? (
          <div className="space-y-4">
            {uploadedData?.map((item) => {
              const uploadDate = new Date(item.createdAt);
              const dateString = isNaN(uploadDate.getTime()) 
                ? "Unknown date" 
                : `${uploadDate.toLocaleDateString()} at ${uploadDate.toLocaleTimeString()}`;
              return (
                <div key={item._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium">{item.fileName}</p>
                    <p className="text-sm text-gray-500">Uploaded on {dateString}</p>
                    <p className="text-sm text-gray-600">By: {item.uploaderName}</p>
                    <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">Stored in Convex</span>
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
    </div>
  );
}