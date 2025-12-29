"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import * as XLSX from "xlsx";
import { Button } from "../components/ui/button";
import { Upload } from "lucide-react";

export default function ExcelA() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string>("");

  const saveToConvex = useMutation(api.uploadedData.saveUploadedData);

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
      alert("Data saved to localStorage!");
      setParsedData([]);
      setFile(null);
      setFileName("");
    }
  };

  const handleSaveToConvex = async () => {
    if (parsedData.length > 0) {
      try {
        const fileId = crypto.randomUUID();
        const chunkSize = 8000;
        const chunks = [];
        for (let i = 0; i < parsedData.length; i += chunkSize) {
          chunks.push(parsedData.slice(i, i + chunkSize));
        }
        // Save each chunk
        for (let partition = 0; partition < chunks.length; partition++) {
          await saveToConvex({
            fileId,
            fileName,
            partition,
            data: chunks[partition],
          });
        }
        alert("Data saved to Convex!");
        setParsedData([]);
        setFile(null);
        setFileName("");
      } catch (error) {
        alert("Error saving to Convex: " + error);
      }
    }
  };

  return (
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
            <Button onClick={handleSaveToConvex}>
              Save to Convex
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}