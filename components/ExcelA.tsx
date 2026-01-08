"use client";

import { useState } from "react";
import { useUploadedDataMutations } from "@/hooks/use-firebase";
import * as XLSX from "xlsx";
import { Button } from "../components/ui/button";
import { Upload } from "lucide-react";
import { SuccessErrorModal } from "./SuccessErrorModal";

interface ExcelAProps {
  onFileSaved?: (fileInfo: { fileId: string; fileName: string }) => void;
}

export default function ExcelA({ onFileSaved }: ExcelAProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [notificationModalOpen, setNotificationModalOpen] = useState<boolean>(false);
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const [notificationTitle, setNotificationTitle] = useState<string>('');
  const [notificationMessage, setNotificationMessage] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const { saveUploadedData, loading: userLoading, currentUser } = useUploadedDataMutations();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        setParsedData(jsonData.slice(1)); // Remove header row
      };
      reader.readAsArrayBuffer(selectedFile);
    }
  };

  const handleSaveToLocalStorage = () => {
    if (parsedData.length > 0) {
      const dataToStore = { fileName, data: parsedData, date: Date.now() };
      localStorage.setItem("uploadedData", JSON.stringify(dataToStore));
      setNotificationType('success');
      setNotificationTitle('Success!');
      setNotificationMessage('Data saved to localStorage!');
      setNotificationModalOpen(true);
      setParsedData([]);
      setFile(null);
      setFileName("");
    }
  };

  const handleSaveToFirebase = async () => {
    if (parsedData.length > 0) {
      setIsSaving(true);
      try {
        const fileId = crypto.randomUUID();
        const chunkSize = 8000;
        const chunks = [];
        for (let i = 0; i < parsedData.length; i += chunkSize) {
          chunks.push(parsedData.slice(i, i + chunkSize));
        }
        // Save each chunk
        for (let partition = 0; partition < chunks.length; partition++) {
          await saveUploadedData({
            fileId,
            fileName,
            partition,
            data: chunks[partition],
          });
        }
        // Notify parent that file was saved
        onFileSaved?.({ fileId, fileName });
        
        setNotificationType('success');
        setNotificationTitle('Success!');
        setNotificationMessage('Data saved to Firebase!');
        setNotificationModalOpen(true);
        setParsedData([]);
        setFile(null);
        setFileName("");
      } catch (error) {
        console.error('Firebase save error:', error);
        setNotificationType('error');
        setNotificationTitle('Error');
        setNotificationMessage(error instanceof Error ? error.message : 'Failed to save data to Firebase. Please try again.');
        setNotificationModalOpen(true);
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <>
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Upload className="mr-2" />
          Upload New File
        </h2>
        <div className="mb-4">
          <input
            type="file"
            accept=".csv,.xls,.xlsx"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        {parsedData.length > 0 && (
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2">Preview (First 10 rows):</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-300">
                <tbody>
                  {parsedData.slice(0, 10).map((row: any[], index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="border border-gray-300 px-4 py-2 text-sm">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleSaveToLocalStorage} variant="outline">
                Save to LocalStorage
              </Button>
              <Button 
                onClick={handleSaveToFirebase} 
                disabled={isSaving || userLoading || !currentUser}
              >
                {isSaving ? 'Saving...' : userLoading ? 'Loading...' : 'Save to Firebase'}
              </Button>
            </div>
          </div>
        )}
      </div>

      <SuccessErrorModal
        open={notificationModalOpen}
        onOpenChange={setNotificationModalOpen}
        type={notificationType}
        title={notificationTitle}
        message={notificationMessage}
      />
    </>
  );
}